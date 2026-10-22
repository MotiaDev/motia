// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

use std::{collections::HashMap, ops::Deref, pin::Pin, sync::Arc};

use colored::Colorize;
use dashmap::{
    DashMap,
    mapref::{multiple::RefMulti, one::Ref},
};
use futures::Future;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

pub use crate::protocol::{TriggerDeliveryContract, TriggerDeliveryMode};

pub const KNOWN_TRIGGER_TYPE_PROVIDERS: &[(&str, &str)] = &[
    ("http", "http"),
    ("cron", "cron"),
    ("subscribe", "pubsub"),
    ("state", "state"),
    ("durable:subscriber", "queue"),
    ("stream", "iii-stream"),
    ("stream:join", "iii-stream"),
    ("stream:leave", "iii-stream"),
    ("log", "iii-observability"),
    ("trace", "iii-observability"),
    ("configuration", "configuration"),
];

/// Maps a known trigger type to the worker package that provides it. Connected
/// workers are attributed by UUID first; this table supplies discovery fallback
/// for in-process workers and identifies the provider when install guidance is
/// needed.
pub fn known_trigger_type_provider(trigger_type_id: &str) -> Option<&'static str> {
    KNOWN_TRIGGER_TYPE_PROVIDERS
        .iter()
        .find(|(id, _)| *id == trigger_type_id)
        .map(|(_, worker)| *worker)
}

/// Outcome of [`TriggerRegistry::register_trigger`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterTriggerOutcome {
    /// The trigger type was available and the binding is live.
    Registered,
    /// The trigger type is not (yet) available, or the bind could not be
    /// delivered to its provider (connection closing). The registration
    /// intent is parked in [`TriggerRegistry::pending_triggers`] and will be
    /// activated automatically when the trigger type (re)registers.
    Deferred,
}

/// What identifies a provider: the namespace it serves and the type id it
/// answers for.
///
/// The id alone was the key until trigger types became namespaced, and two
/// projects providing the same id overwrote each other — silently, and taking
/// the loser's bindings with them into the winner's provider.
pub type TypeKey = (String, String);

/// Builds a [`TypeKey`] without the call sites spelling out two `to_string()`s.
pub fn type_key(namespace: &str, id: &str) -> TypeKey {
    (namespace.to_string(), id.to_string())
}

#[derive(Clone)]
pub struct TriggerType {
    pub id: String,
    /// Namespace this provider serves. In-process engine providers use
    /// [`DEFAULT_NAMESPACE`]; an SDK worker's provider uses its connection's
    /// namespace.
    pub namespace: String,
    pub _description: String,
    pub trigger_request_format: Option<Value>,
    pub call_request_format: Option<Value>,
    pub call_response_format: Option<Value>,
    pub delivery_mode: TriggerDeliveryMode,
    pub delivery_contract: Option<TriggerDeliveryContract>,
    pub registrator: Arc<dyn TriggerRegistrator>,
    pub worker_id: Option<Uuid>,
}

impl TriggerType {
    /// A provider in [`DEFAULT_NAMESPACE`] — where every in-process engine
    /// provider lives, and where a resolved lookup falls back to.
    pub fn new(
        id: impl Into<String>,
        description: impl Into<String>,
        registrator: Box<dyn TriggerRegistrator>,
        worker_id: Option<Uuid>,
    ) -> Self {
        Self::new_ns(
            crate::protocol::DEFAULT_NAMESPACE,
            id,
            description,
            registrator,
            worker_id,
        )
    }

    pub fn new_ns(
        namespace: impl Into<String>,
        id: impl Into<String>,
        description: impl Into<String>,
        registrator: Box<dyn TriggerRegistrator>,
        worker_id: Option<Uuid>,
    ) -> Self {
        let id = id.into();
        let trigger_request_format = Self::trigger_request_format_for(&id);
        let call_request_format = Self::call_request_format_for(&id);
        let call_response_format = Self::call_response_format_for(&id);
        Self {
            id,
            namespace: namespace.into(),
            _description: description.into(),
            trigger_request_format,
            call_request_format,
            call_response_format,
            delivery_mode: TriggerDeliveryMode::default(),
            delivery_contract: None,
            registrator: Arc::from(registrator),
            worker_id,
        }
    }

    pub fn with_delivery_mode(mut self, mode: TriggerDeliveryMode) -> Self {
        self.delivery_mode = mode;
        self
    }

    pub fn with_delivery_contract(mut self, contract: TriggerDeliveryContract) -> Self {
        self.delivery_contract = Some(contract);
        self
    }

    fn compatible_with(&self, other: &Self) -> bool {
        self.delivery_mode == other.delivery_mode
            && self.delivery_contract == other.delivery_contract
            && self.trigger_request_format == other.trigger_request_format
            && self.call_request_format == other.call_request_format
            && self.call_response_format == other.call_response_format
    }

    /// The key this provider is filed under.
    pub fn key(&self) -> TypeKey {
        (self.namespace.clone(), self.id.clone())
    }

    pub fn with_trigger_request_format<T: schemars::JsonSchema>(mut self) -> Self {
        self.trigger_request_format = Self::schema_for::<T>();
        self
    }

    pub fn with_call_request_format<T: schemars::JsonSchema>(mut self) -> Self {
        self.call_request_format = Self::schema_for::<T>();
        self
    }

    /// Schema for what a bound handler must RETURN when this trigger fires
    /// (e.g. the HTTP response envelope). Exposed via `engine::triggers::info`
    /// as `response_schema` so callers can discover the return contract.
    pub fn with_call_response_format<T: schemars::JsonSchema>(mut self) -> Self {
        self.call_response_format = Self::schema_for::<T>();
        self
    }

    fn schema_for<T: schemars::JsonSchema>() -> Option<Value> {
        serde_json::to_value(schemars::schema_for!(T)).ok()
    }

    fn trigger_request_format_for(id: &str) -> Option<Value> {
        use crate::trigger_formats::*;

        match id {
            "http" => Self::schema_for::<HttpTriggerConfig>(),
            "cron" => Self::schema_for::<CronTriggerConfig>(),
            "durable:subscriber" => Self::schema_for::<QueueTriggerConfig>(),
            "subscribe" => Self::schema_for::<SubscribeTriggerConfig>(),
            "state" => Self::schema_for::<StateTriggerConfig>(),
            "stream:join" | "stream:leave" => Self::schema_for::<StreamJoinLeaveTriggerConfig>(),
            "stream" => Self::schema_for::<StreamTriggerConfig>(),
            "log" => Self::schema_for::<LogTriggerConfig>(),
            "trace" => Self::schema_for::<TraceTriggerConfig>(),
            "configuration" => Self::schema_for::<ConfigurationTriggerConfig>(),
            _ => None,
        }
    }

    fn call_request_format_for(id: &str) -> Option<Value> {
        use crate::trigger_formats::*;

        match id {
            "http" => Self::schema_for::<HttpCallRequest>(),
            "cron" => Self::schema_for::<CronCallRequest>(),
            "state" => Self::schema_for::<StateCallRequest>(),
            "stream:join" | "stream:leave" => Self::schema_for::<StreamJoinLeaveCallRequest>(),
            "stream" => Self::schema_for::<StreamCallRequest>(),
            "log" => Self::schema_for::<LogCallRequest>(),
            "trace" => Self::schema_for::<TraceCallRequest>(),
            "configuration" => Self::schema_for::<ConfigurationCallRequest>(),
            _ => None,
        }
    }

    /// Schema a bound handler must RETURN when this trigger fires. Only trigger
    /// types whose handler return shape is fixed declare one. `http` returns an
    /// `HttpCallResponse` (`status_code` / `headers` / `body`); most triggers
    /// place no constraint on the return and report `None`.
    fn call_response_format_for(id: &str) -> Option<Value> {
        use crate::trigger_formats::*;

        match id {
            "http" => Self::schema_for::<HttpCallResponse>(),
            _ => None,
        }
    }
}

/// Marker error for registrator failures where the bind never reached the
/// provider (its connection channel is closed — the worker is dying or
/// disconnecting). The registry parks such binds for replay on the next type
/// (re)registration. Any other registrator error is a provider rejection
/// (e.g. invalid config): a definitive answer that fails the registration.
#[derive(Debug)]
pub struct RegistratorUnavailable;

impl std::fmt::Display for RegistratorUnavailable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("trigger provider connection unavailable")
    }
}

impl std::error::Error for RegistratorUnavailable {}

pub trait TriggerRegistrator: Send + Sync {
    fn register_assignment(
        &self,
        trigger: Trigger,
        _token: String,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        self.register_trigger(trigger)
    }
    fn unregister_assignment(
        &self,
        trigger: Trigger,
        _token: String,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        self.unregister_trigger(trigger)
    }
    fn register_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>>;
    /// Re-deliver an already-accepted binding (type re-registration replay,
    /// pending-intent recovery). Defaults to `register_trigger`. Registrators
    /// whose register path blocks on an ack from the provider worker
    /// (`WorkerConnection`) must override this to fire-and-forget: replay
    /// runs inline on that provider's own read loop, so awaiting its ack
    /// stalls the connection until the timeout.
    fn replay_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        self.register_trigger(trigger)
    }
    fn unregister_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>>;
}

#[derive(Clone, Debug, Eq, Serialize, Deserialize)]
pub struct Trigger {
    pub id: String,
    pub trigger_type: String,
    pub function_id: String,
    pub config: Value,
    pub worker_id: Option<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
    /// Namespace the target `function_id` resolves in when this trigger fires.
    /// Taken from the `RegisterTrigger` message's `namespace` (not the registering
    /// connection): the trigger names its target namespace explicitly, and an
    /// absent value means [`crate::protocol::DEFAULT_NAMESPACE`] — see
    /// `Engine::fire_triggers`. Also defaults to `default` for engine-internal
    /// registrations and for wire payloads that predate the field. A durable
    /// `engine::register_trigger` binding takes the calling connection's
    /// namespace instead: its target is the caller's own function.
    #[serde(default = "crate::protocol::default_namespace")]
    pub namespace: String,
    /// Namespace the caller named for the provider, if any.
    ///
    /// `Some` is strict: that namespace or nothing. `None` asks for the
    /// resolution in [`TriggerRegistry::resolve_provider_key`] — `home_namespace`
    /// first, then [`DEFAULT_NAMESPACE`] — which is what carries workers that
    /// have not been migrated onto the engine's own providers without them
    /// saying anything.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trigger_namespace: Option<String>,
    /// The registering connection's namespace: the first place a resolved
    /// lookup looks, and the namespace a provider must later register in to
    /// claim this binding back from the fallback.
    ///
    /// Kept apart from `namespace`, which is the *target*'s: a worker may bind
    /// a trigger whose function lives elsewhere, and its provider should still
    /// be the one at home.
    #[serde(default = "crate::protocol::default_namespace")]
    pub home_namespace: String,
    /// Where the provider was actually found. Written by the registry at bind
    /// time and read by everything that has to reach the same provider again:
    /// replay, unregister, and the disconnect sweep.
    #[serde(default = "crate::protocol::default_namespace")]
    pub provider_namespace: String,
}

impl Trigger {
    /// The three namespace fields for an engine-internal binding: one declared
    /// in engine configuration rather than by a worker connection.
    ///
    /// These are engine orchestration, so they are at home in
    /// [`DEFAULT_NAMESPACE`] and resolve their provider there — which is also
    /// where every in-process provider registers. They stay resolvable rather
    /// than explicit so a project that later provides the type can still be
    /// preferred if such a binding is ever given a different home.
    pub fn internal_namespaces() -> (Option<String>, String, String) {
        (
            None,
            crate::protocol::default_namespace(),
            crate::protocol::default_namespace(),
        )
    }

    /// The provider this binding is currently bound to.
    pub fn provider_key(&self) -> TypeKey {
        (self.provider_namespace.clone(), self.trigger_type.clone())
    }

    /// Whether this binding is only on the fallback provider, and so would
    /// prefer a provider that registers at home later.
    ///
    /// Explicit bindings are never re-homed: naming a namespace means that one
    /// and no other.
    pub fn is_on_fallback(&self) -> bool {
        self.trigger_namespace.is_none() && self.provider_namespace != self.home_namespace
    }
}

// Only `id` is considered for Hash and Eq/PartialEq
impl PartialEq for Trigger {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl std::hash::Hash for Trigger {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

/// A read-only trigger entry that keeps its registry shard locked.
pub struct TriggerRef<'a>(Ref<'a, String, Arc<Trigger>>);

impl TriggerRef<'_> {
    pub fn key(&self) -> &String {
        self.0.key()
    }

    pub fn value(&self) -> &Trigger {
        self.0.value().as_ref()
    }
}

impl Deref for TriggerRef<'_> {
    type Target = Trigger;

    fn deref(&self) -> &Self::Target {
        self.value()
    }
}

/// A read-only trigger entry returned by registry iteration.
pub struct TriggerIterRef<'a>(RefMulti<'a, String, Arc<Trigger>>);

impl TriggerIterRef<'_> {
    pub fn key(&self) -> &String {
        self.0.key()
    }

    pub fn value(&self) -> &Trigger {
        self.0.value().as_ref()
    }
}

impl Deref for TriggerIterRef<'_> {
    type Target = Trigger;

    fn deref(&self) -> &Self::Target {
        self.value()
    }
}

/// Live triggers with an index for dispatch by trigger type.
///
/// Both maps share each immutable trigger, including its JSON metadata.
/// All writes hold the id's shard lock while updating the type index, so a
/// concurrent replacement or removal cannot leave an old destination indexed.
/// The id map is private and exposes no mutable references. Dispatch reads only
/// the type index and releases its guard before calling a handler.
#[derive(Default)]
pub struct TriggerStore {
    by_id: DashMap<String, Arc<Trigger>>,
    by_type: DashMap<String, HashMap<String, Arc<Trigger>>>,
}

impl TriggerStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn len(&self) -> usize {
        self.by_id.len()
    }

    pub fn is_empty(&self) -> bool {
        self.by_id.is_empty()
    }

    pub fn contains_key(&self, id: &str) -> bool {
        self.by_id.contains_key(id)
    }

    pub fn get(&self, id: &str) -> Option<TriggerRef<'_>> {
        // Keep DashMap's original guard so this read handle remains Send.
        self.by_id.get(id).map(TriggerRef)
    }

    pub fn iter(&self) -> impl Iterator<Item = TriggerIterRef<'_>> {
        self.by_id.iter().map(TriggerIterRef)
    }

    pub fn insert(&self, id: String, trigger: Trigger) -> Option<Trigger> {
        use dashmap::mapref::entry::Entry;

        let trigger = Arc::new(trigger);
        match self.by_id.entry(id) {
            Entry::Occupied(mut entry) => {
                if entry.get().trigger_type != trigger.trigger_type {
                    self.remove_target(entry.key(), &entry.get().trigger_type);
                }
                self.insert_target(entry.key(), &trigger);
                Some(Arc::unwrap_or_clone(entry.insert(trigger)))
            }
            Entry::Vacant(entry) => {
                self.insert_target(entry.key(), &trigger);
                entry.insert(trigger);
                None
            }
        }
    }

    pub fn remove(&self, id: &str) -> Option<(String, Trigger)> {
        self.remove_if(id, |_, _| true)
    }

    pub fn remove_if(
        &self,
        id: &str,
        predicate: impl FnOnce(&String, &Trigger) -> bool,
    ) -> Option<(String, Trigger)> {
        self.by_id
            .remove_if(id, |key, trigger| {
                if !predicate(key, trigger) {
                    return false;
                }
                self.remove_target(key, &trigger.trigger_type);
                true
            })
            .map(|(id, trigger)| (id, Arc::unwrap_or_clone(trigger)))
    }

    pub(crate) fn targets_for_type(&self, trigger_type: &str) -> Vec<Arc<Trigger>> {
        self.by_type
            .get(trigger_type)
            .map(|targets| targets.values().map(Arc::clone).collect())
            .unwrap_or_default()
    }

    fn insert_target(&self, id: &str, trigger: &Arc<Trigger>) {
        self.by_type
            .entry(trigger.trigger_type.clone())
            .or_default()
            .insert(id.to_string(), Arc::clone(trigger));
    }

    fn remove_target(&self, id: &str, trigger_type: &str) {
        // Remove an empty bucket under the same lock as its last entry, so an
        // insertion into that type cannot be lost between the two operations.
        self.by_type.remove_if_mut(trigger_type, |_, targets| {
            targets.remove(id);
            targets.is_empty()
        });
    }
}

/// Equality is deliberately independent of alias IDs and provider resolution.
#[derive(Clone, PartialEq, Eq)]
struct TriggerDescriptor {
    home: String,
    target: String,
    provider_selection: Option<String>,
    trigger_type: String,
    function: String,
    config: Value,
    metadata: Option<Value>,
}

impl From<&Trigger> for TriggerDescriptor {
    fn from(trigger: &Trigger) -> Self {
        Self {
            home: trigger.home_namespace.clone(),
            target: trigger.namespace.clone(),
            provider_selection: trigger.trigger_namespace.clone(),
            trigger_type: trigger.trigger_type.clone(),
            function: trigger.function_id.clone(),
            config: trigger.config.clone(),
            metadata: trigger.metadata.clone(),
        }
    }
}

struct LogicalTrigger {
    descriptor: TriggerDescriptor,
    // Serializes I/O for this intent only, not membership or registry access.
    operation: tokio::sync::Mutex<()>,
}

#[derive(Default)]
struct SharedSubscriptions {
    aliases: HashMap<(Uuid, String), String>,
    intents: HashMap<String, Arc<LogicalTrigger>>,
}

#[derive(Default)]
struct AssignmentSet {
    operation: tokio::sync::Mutex<()>,
    removed: std::sync::atomic::AtomicBool,
    transferring: std::sync::atomic::AtomicBool,
    // Entries include unconfirmed deliveries: they remain teardown debt until
    // positively stopped or their provider session disconnects.
    copies: std::sync::Mutex<HashMap<Option<Uuid>, (Arc<TriggerType>, String, bool)>>,
}

struct LegacyInstall {
    trigger: Trigger,
    provider: Option<Uuid>,
    registrator: Arc<dyn TriggerRegistrator>,
    acknowledged: std::sync::atomic::AtomicBool,
    published: std::sync::Mutex<Option<std::sync::Weak<Trigger>>>,
}

#[derive(Default)]
pub struct TriggerRegistry {
    /// Providers, by `(namespace, type id)`.
    pub trigger_types: Arc<DashMap<TypeKey, TriggerType>>,
    shared_namespace_ownership: std::sync::OnceLock<bool>,
    provider_owners: std::sync::Mutex<HashMap<TypeKey, Vec<Arc<TriggerType>>>>,
    subscriptions: std::sync::Mutex<SharedSubscriptions>,
    assignments: DashMap<String, Arc<AssignmentSet>>,
    selection: std::sync::Mutex<HashMap<TypeKey, usize>>,
    legacy_uncertain: std::sync::Mutex<std::collections::HashSet<String>>,
    // Reserved before provider I/O, including ownerless registrations. A
    // cancelled future leaves its descriptor/debt visible until explicit teardown.
    legacy_installs: DashMap<String, Arc<LegacyInstall>>,
    // Observation only, never lifecycle authority. Legacy replies have no wire
    // generation: once a session/id is reused, even a positive reply is ambiguous.
    // Retain that tombstone so an old ACK cannot confirm a successor installation.
    legacy_observations: std::sync::Mutex<HashMap<(Uuid, String), Option<Arc<LegacyInstall>>>>,
    retired_providers: std::sync::Mutex<std::collections::HashSet<Uuid>>,
    #[cfg(test)]
    removal_pause: std::sync::Mutex<
        Option<(
            tokio::sync::oneshot::Sender<()>,
            tokio::sync::oneshot::Receiver<()>,
        )>,
    >,
    #[cfg(test)]
    replay_pause: std::sync::Mutex<
        Option<(
            tokio::sync::oneshot::Sender<()>,
            tokio::sync::oneshot::Receiver<()>,
        )>,
    >,
    pub triggers: Arc<TriggerStore>,
    /// Registration intents whose trigger type is not currently available or
    /// whose activation did not complete: the type never registered, its
    /// provider worker disconnected, the bind could not be delivered, or the
    /// provider asynchronously rejected the activation. These
    /// bindings are disabled (they never fire) until the trigger type
    /// (re)registers, at which point they are activated and moved into
    /// `triggers`. Keyed by trigger id, like `triggers`.
    pub pending_triggers: Arc<DashMap<String, Trigger>>,
    /// Serializes two-map transitions between `triggers` and
    /// `pending_triggers` (a late-rejection re-park vs an explicit
    /// unregister). DashMap only makes each map operation atomic; without
    /// this, a re-park's remove+insert can interleave with an unregister's
    /// removes and resurrect an explicitly-unregistered binding. Held only
    /// around the map operations, never across an await.
    pub park_transition: std::sync::Mutex<()>,
}

impl TriggerRegistry {
    pub fn new() -> Self {
        Self {
            trigger_types: Arc::new(DashMap::new()),
            triggers: Arc::new(TriggerStore::new()),
            pending_triggers: Arc::new(DashMap::new()),
            park_transition: std::sync::Mutex::new(()),
            shared_namespace_ownership: std::sync::OnceLock::new(),
            provider_owners: std::sync::Mutex::new(HashMap::new()),
            subscriptions: std::sync::Mutex::new(SharedSubscriptions::default()),
            assignments: DashMap::new(),
            selection: Default::default(),
            legacy_uncertain: Default::default(),
            legacy_installs: Default::default(),
            legacy_observations: Default::default(),
            retired_providers: Default::default(),
            #[cfg(test)]
            removal_pause: Default::default(),
            #[cfg(test)]
            replay_pause: Default::default(),
        }
    }

    pub(crate) fn set_shared_namespace_ownership(&self, enabled: bool) {
        let _ = self.shared_namespace_ownership.set(enabled);
    }

    fn shared(&self) -> bool {
        self.shared_namespace_ownership
            .get()
            .copied()
            .unwrap_or(false)
    }

    fn assignment_providers(&self, key: &TypeKey) -> Vec<Arc<TriggerType>> {
        let owners = self
            .provider_owners
            .lock()
            .expect("provider owners poisoned");
        let Some(members) = owners.get(key) else {
            return Vec::new();
        };
        members.clone()
    }

    /// Observational counts only: membership and ACK state are sampled separately.
    pub(crate) fn ownership_snapshot(
        &self,
        trigger: &Trigger,
        eligible: impl Fn(Uuid) -> bool,
    ) -> (usize, usize, usize, TriggerDeliveryMode, bool) {
        let owner_count = {
            let subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
            if subscriptions.intents.contains_key(&trigger.id) {
                subscriptions
                    .aliases
                    .iter()
                    .filter(|((owner, _), id)| *id == &trigger.id && eligible(*owner))
                    .map(|((owner, _), _)| *owner)
                    .collect::<std::collections::HashSet<_>>()
                    .len()
            } else {
                usize::from(trigger.worker_id.is_none_or(&eligible))
            }
        };
        let providers = self
            .assignment_providers(&trigger.provider_key())
            .into_iter()
            .filter(|p| p.worker_id.is_none_or(&eligible))
            .collect::<Vec<_>>();
        let mode = providers
            .first()
            .map(|p| p.delivery_mode)
            .unwrap_or_default();
        let provider_count = providers.len();
        let active_count = self.assignments.get(&trigger.id).map_or_else(
            || {
                usize::from(
                    providers.iter().any(|p| {
                        p.worker_id.is_none() || self.legacy_installation_confirmed(trigger, p)
                    }) && self.triggers.contains_key(&trigger.id),
                )
            },
            |state| {
                if state.removed.load(std::sync::atomic::Ordering::SeqCst)
                    || state.transferring.load(std::sync::atomic::Ordering::SeqCst)
                    || self.legacy_execution_uncertain(&trigger.id)
                {
                    return 0;
                }
                state
                    .copies
                    .lock()
                    .expect("copies poisoned")
                    .values()
                    .filter(|(p, _, ack)| {
                        *ack && providers
                            .iter()
                            .any(|current| current.worker_id == p.worker_id)
                    })
                    .count()
            },
        );
        let required = match mode {
            TriggerDeliveryMode::Parallel => provider_count,
            TriggerDeliveryMode::SingleActive => 1,
        };
        (
            owner_count,
            provider_count,
            active_count,
            mode,
            provider_count == 0 || active_count < required,
        )
    }

    /// Linearization point for accepting provider work. No guard survives dispatch:
    /// already accepted work may finish, but is never replayed during handover.
    pub(crate) fn firing_assignment(
        &self,
        id: &str,
        token: &str,
        caller: Uuid,
    ) -> Option<Arc<Trigger>> {
        let _park = self
            .park_transition
            .lock()
            .expect("park transition poisoned");
        if self.legacy_execution_uncertain(id) {
            return None;
        }
        let state = self.assignments.get(id)?;
        if state.removed.load(std::sync::atomic::Ordering::SeqCst)
            || state.transferring.load(std::sync::atomic::Ordering::SeqCst)
        {
            return None;
        }
        let copies = state.copies.lock().expect("copies poisoned");
        let (provider, current, active) = copies.get(&Some(caller))?;
        if !active
            || current != token
            || !self
                .assignment_providers(&provider.key())
                .iter()
                .any(|p| p.worker_id == Some(caller))
        {
            return None;
        }
        self.triggers.get(id).map(|t| Arc::new(t.value().clone()))
    }

    #[cfg(test)]
    async fn pause_transition(
        pause: &std::sync::Mutex<
            Option<(
                tokio::sync::oneshot::Sender<()>,
                tokio::sync::oneshot::Receiver<()>,
            )>,
        >,
    ) {
        let pause = pause.lock().unwrap().take();
        if let Some((reached, resume)) = pause {
            let _ = reached.send(());
            let _ = resume.await;
        }
    }

    // This tombstone describes execution uncertainty, not provider membership.
    // Neither a new declaration nor a retry/ACK can prove an unfenced owner
    // stopped. Keep it independent of assignment lifecycles and feature flags.
    fn legacy_execution_uncertain(&self, id: &str) -> bool {
        self.legacy_uncertain
            .lock()
            .expect("legacy uncertainty poisoned")
            .contains(id)
    }

    /// Only the actual receiver of a positive legacy result calls this. Neither
    /// successful enqueue nor fail-open completion is installation evidence.
    pub(crate) fn observe_legacy_ack(
        &self,
        provider: Uuid,
        id: &str,
        kind: &str,
        function: &str,
        positive: bool,
    ) {
        let observations = self
            .legacy_observations
            .lock()
            .expect("legacy observations poisoned");
        let Some(Some(install)) = observations.get(&(provider, id.to_owned())) else {
            return;
        };
        if install.trigger.trigger_type != kind || install.trigger.function_id != function {
            return;
        }
        // Preserve the observation even between reservation removal and live
        // publication. Counting still requires this exact immutable publication;
        // removal/reuse tombstones prevent attaching it to any successor.
        install
            .acknowledged
            .store(positive, std::sync::atomic::Ordering::SeqCst);
    }

    fn legacy_publication_current(&self, install: &LegacyInstall) -> bool {
        let published = install
            .published
            .lock()
            .expect("legacy publication poisoned");
        published
            .as_ref()
            .and_then(std::sync::Weak::upgrade)
            .is_some_and(|published| {
                self.triggers
                    .by_id
                    .get(&install.trigger.id)
                    .is_some_and(|current| Arc::ptr_eq(current.value(), &published))
            })
    }

    fn legacy_installation_confirmed(&self, trigger: &Trigger, provider: &TriggerType) -> bool {
        let Some(owner) = provider.worker_id else {
            return false;
        };
        if self.legacy_execution_uncertain(&trigger.id) {
            return false;
        }
        let observations = self
            .legacy_observations
            .lock()
            .expect("legacy observations poisoned");
        observations
            .get(&(owner, trigger.id.clone()))
            .is_some_and(|observation| {
                observation.as_ref().is_some_and(|install| {
                    Arc::ptr_eq(&install.registrator, &provider.registrator)
                        && install
                            .acknowledged
                            .load(std::sync::atomic::Ordering::SeqCst)
                        && self.legacy_publication_current(install)
                })
            })
    }

    async fn install_legacy(
        &self,
        trigger: Trigger,
        provider: &TriggerType,
        replay: bool,
    ) -> Result<RegisterTriggerOutcome, anyhow::Error> {
        let install = Arc::new(LegacyInstall {
            trigger: trigger.clone(),
            provider: provider.worker_id,
            registrator: provider.registrator.clone(),
            acknowledged: std::sync::atomic::AtomicBool::new(false),
            published: Default::default(),
        });
        let was_live;
        {
            let _park = self
                .park_transition
                .lock()
                .expect("park transition poisoned");
            if self.legacy_execution_uncertain(&trigger.id)
                || self.legacy_installs.contains_key(&trigger.id)
            {
                return Ok(RegisterTriggerOutcome::Deferred);
            }
            // Cleanup may have retired the provider after the caller's lookup.
            if provider.worker_id.is_some_and(|id| {
                self.retired_providers
                    .lock()
                    .expect("retired providers poisoned")
                    .contains(&id)
            }) || !self
                .trigger_types
                .get(&provider.key())
                .is_some_and(|current| current.worker_id == provider.worker_id)
            {
                self.pending_triggers.insert(trigger.id.clone(), trigger);
                return Ok(RegisterTriggerOutcome::Deferred);
            }
            was_live = self.triggers.contains_key(&trigger.id);
            if !was_live {
                self.pending_triggers
                    .insert(trigger.id.clone(), trigger.clone());
            }
            self.legacy_installs
                .insert(trigger.id.clone(), install.clone());
            if self.shared() {
                if let Some(owner) = provider.worker_id {
                    use std::collections::hash_map::Entry;
                    match self
                        .legacy_observations
                        .lock()
                        .expect("legacy observations poisoned")
                        .entry((owner, trigger.id.clone()))
                    {
                        Entry::Vacant(entry) => {
                            entry.insert(Some(install.clone()));
                        }
                        Entry::Occupied(mut entry) => {
                            entry.insert(None);
                        }
                    }
                }
            }
        }
        let result = if replay {
            provider.registrator.replay_trigger(trigger.clone()).await
        } else {
            provider.registrator.register_trigger(trigger.clone()).await
        };
        let _park = self
            .park_transition
            .lock()
            .expect("park transition poisoned");
        // Teardown can invalidate this generation while I/O is suspended. A
        // missing/changed reservation is never permission to republish its intent.
        let current = self
            .legacy_installs
            .get(&trigger.id)
            .is_some_and(|entry| Arc::ptr_eq(entry.value(), &install));
        if !current {
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        self.legacy_installs.remove(&trigger.id);
        let provider_live = self
            .trigger_types
            .get(&provider.key())
            .is_some_and(|current| current.worker_id == provider.worker_id);
        // A lost install ACK may follow a successful local start. Preserve
        // that execution uncertainty after releasing the I/O reservation, even
        // while the provider is still connected: neither disconnect nor a home
        // declaration can turn this pending intent into permission to hand over.
        if !provider_live
            || result
                .as_ref()
                .is_err_and(|error| error.downcast_ref::<RegistratorUnavailable>().is_some())
        {
            self.legacy_uncertain
                .lock()
                .expect("legacy uncertainty poisoned")
                .insert(trigger.id.clone());
        }
        if self.legacy_execution_uncertain(&trigger.id) {
            self.triggers.remove(&trigger.id);
            self.pending_triggers.insert(trigger.id.clone(), trigger);
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        match result {
            Ok(()) => {
                self.pending_triggers.remove(&trigger.id);
                self.triggers.insert(trigger.id.clone(), trigger.clone());
                *install
                    .published
                    .lock()
                    .expect("legacy publication poisoned") = self
                    .triggers
                    .by_id
                    .get(&trigger.id)
                    .map(|current| Arc::downgrade(current.value()));
                Ok(RegisterTriggerOutcome::Registered)
            }
            Err(error) if error.downcast_ref::<RegistratorUnavailable>().is_some() => {
                self.triggers.remove(&trigger.id);
                self.pending_triggers.insert(trigger.id.clone(), trigger);
                Ok(RegisterTriggerOutcome::Deferred)
            }
            Err(error) => {
                if !was_live {
                    self.pending_triggers.remove(&trigger.id);
                }
                Err(error)
            }
        }
    }

    fn current_assignment(&self, id: &str, state: &AssignmentSet) -> bool {
        self.assignments
            .get(id)
            .is_some_and(|current| std::ptr::eq(current.value().as_ref(), state))
    }

    fn publish_assignments(&self, trigger: &Trigger, state: &AssignmentSet) {
        let _park = self
            .park_transition
            .lock()
            .expect("park transition poisoned");
        // A completed teardown may already have been followed by a new binding
        // with the same public ID. Old completions must not touch that lifecycle.
        if !self.current_assignment(&trigger.id, state) {
            return;
        }
        let active = !self.legacy_execution_uncertain(&trigger.id)
            && !state.transferring.load(std::sync::atomic::Ordering::SeqCst)
            && !state.removed.load(std::sync::atomic::Ordering::SeqCst)
            && state
                .copies
                .lock()
                .expect("copies poisoned")
                .values()
                .any(|copy| copy.2);
        if active {
            self.pending_triggers.remove(&trigger.id);
            self.triggers.insert(trigger.id.clone(), trigger.clone());
        } else {
            self.triggers.remove(&trigger.id);
            if !state.removed.load(std::sync::atomic::Ordering::SeqCst) {
                self.pending_triggers
                    .insert(trigger.id.clone(), trigger.clone());
            } else {
                // Tombstone retains its descriptor until teardown debt is paid.
                self.pending_triggers
                    .insert(trigger.id.clone(), trigger.clone());
            }
        }
    }

    pub(crate) async fn replay_shared_assignments(&self, key: TypeKey) {
        self.rehome_shared_bindings(&key).await;
        // Snapshot the descriptor and reserve its lifecycle under the same lock
        // used by final removal's authoritative lookup/deletion. A first claim
        // is allowed only while the pending intent is still present.
        let bindings = {
            let _park = self
                .park_transition
                .lock()
                .expect("park transition poisoned");
            let mut bindings = self
                .triggers
                .iter()
                .filter(|t| t.provider_key() == key)
                .map(|t| t.value().clone())
                .collect::<Vec<_>>();
            bindings.extend(
                self.pending_triggers
                    .iter()
                    .filter(|t| self.resolve_provider_key(t.value()).as_ref() == Some(&key))
                    .map(|t| {
                        let mut trigger = t.value().clone();
                        trigger.provider_namespace = key.0.clone();
                        trigger
                    }),
            );
            bindings
                .into_iter()
                .filter(|trigger| {
                    !self.legacy_execution_uncertain(&trigger.id)
                        && !self.legacy_installs.contains_key(&trigger.id)
                })
                .map(|trigger| {
                    // A previously unprovided pending intent gets its first assignment
                    // lifecycle here, while final removal cannot race the claim.
                    let state = self
                        .assignments
                        .entry(trigger.id.clone())
                        .or_default()
                        .clone();
                    (trigger, state)
                })
                .collect::<Vec<_>>()
        };
        #[cfg(test)]
        Self::pause_transition(&self.replay_pause).await;
        futures::future::join_all(
            bindings
                .into_iter()
                .map(|(trigger, state)| self.install_assignment_lifecycle(trigger, state)),
        )
        .await;
    }

    async fn install_assignments(
        &self,
        trigger: Trigger,
    ) -> Result<RegisterTriggerOutcome, anyhow::Error> {
        let state = self
            .assignments
            .get(&trigger.id)
            .map(|state| state.value().clone())
            .ok_or_else(|| anyhow::anyhow!("trigger lifecycle was removed"))?;
        self.install_assignment_lifecycle(trigger, state).await
    }

    async fn install_assignment_lifecycle(
        &self,
        trigger: Trigger,
        state: Arc<AssignmentSet>,
    ) -> Result<RegisterTriggerOutcome, anyhow::Error> {
        let _operation = state.operation.lock().await;
        if !self.current_assignment(&trigger.id, &state)
            || state.removed.load(std::sync::atomic::Ordering::SeqCst)
        {
            anyhow::bail!("trigger teardown pending");
        }
        if self.legacy_execution_uncertain(&trigger.id)
            || self.legacy_installs.contains_key(&trigger.id)
            || state.transferring.load(std::sync::atomic::Ordering::SeqCst)
        {
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        // Keep cancellation/partial delivery reachable for last-subscriber teardown.
        if !self.triggers.contains_key(&trigger.id) {
            self.pending_triggers
                .insert(trigger.id.clone(), trigger.clone());
        }
        let mut providers = self.assignment_providers(&trigger.provider_key());
        if providers
            .first()
            .is_some_and(|p| p.delivery_mode == TriggerDeliveryMode::SingleActive)
        {
            let copies = state.copies.lock().expect("copies poisoned");
            if let Some((provider, _, _)) = copies.values().next() {
                providers.retain(|p| p.worker_id == provider.worker_id);
            } else if !providers.is_empty() {
                let mut selection = self.selection.lock().expect("selection poisoned");
                let cursor = selection.entry(trigger.provider_key()).or_default();
                let selected = providers[*cursor % providers.len()].clone();
                *cursor = cursor.wrapping_add(1);
                providers = vec![selected];
            }
        }
        // Freeze the required membership for this operation. A healthy copy
        // makes the route usable, but never proves this snapshot complete.
        let required = providers
            .iter()
            .map(|provider| provider.worker_id)
            .collect::<Vec<_>>();
        let installs = providers
            .into_iter()
            .filter_map(|provider| {
                let mut copies = state.copies.lock().expect("copies poisoned");
                if let Some((_, token, active)) = copies.get(&provider.worker_id) {
                    // Retry an uncertain delivery with its original identity;
                    // replacing it would lose the old generation's stop debt.
                    return (!active).then(|| (provider.clone(), token.clone()));
                }
                let token = Uuid::new_v4().to_string();
                copies.insert(provider.worker_id, (provider.clone(), token.clone(), false));
                Some((provider, token))
            })
            .collect::<Vec<_>>();
        let outcomes = futures::future::join_all(installs.into_iter().map(|(provider, token)| {
            let state = &state;
            let trigger = &trigger;
            async move {
                let result = provider
                    .registrator
                    .register_assignment(trigger.clone(), token.clone())
                    .await;
                let member = self
                    .assignment_providers(&trigger.provider_key())
                    .iter()
                    .any(|current| current.worker_id == provider.worker_id);
                {
                    let mut copies = state.copies.lock().expect("copies poisoned");
                    if let Some(copy) = copies.get_mut(&provider.worker_id) {
                        if copy.1 == token {
                            copy.2 = result.is_ok()
                                && member
                                && !self.legacy_execution_uncertain(&trigger.id)
                                && !state.removed.load(std::sync::atomic::Ordering::SeqCst)
                                && !state.transferring.load(std::sync::atomic::Ordering::SeqCst);
                            if !member
                                || result.as_ref().is_err_and(|e| {
                                    e.downcast_ref::<RegistratorUnavailable>().is_none()
                                })
                            {
                                copies.remove(&provider.worker_id);
                            }
                        }
                    }
                }
                self.publish_assignments(trigger, state);
                result
            }
        }))
        .await;
        self.publish_assignments(&trigger, &state);
        // Success is the required membership snapshot, not merely one healthy
        // copy. Partial installs remain live and reachable for teardown.
        if outcomes.iter().any(Result::is_err) {
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        let complete = !state.removed.load(std::sync::atomic::Ordering::SeqCst)
            && !required.is_empty()
            && required.iter().all(|owner| {
                state
                    .copies
                    .lock()
                    .expect("copies poisoned")
                    .get(owner)
                    .is_some_and(|copy| copy.2)
            });
        if complete {
            Ok(RegisterTriggerOutcome::Registered)
        } else {
            Ok(RegisterTriggerOutcome::Deferred)
        }
    }

    async fn revoke_assignments(
        &self,
        id: &str,
        state: Arc<AssignmentSet>,
    ) -> Result<bool, anyhow::Error> {
        {
            let _park = self
                .park_transition
                .lock()
                .expect("park transition poisoned");
            if !self.current_assignment(id, &state) {
                return Ok(false);
            }
            state
                .removed
                .store(true, std::sync::atomic::Ordering::SeqCst);
            // Disable lookup/firing before any stop I/O, even if installation
            // is still finishing. The descriptor and copies are teardown debt.
            if let Some((_, trigger)) = self.triggers.remove(id) {
                self.pending_triggers.insert(id.to_string(), trigger);
            }
        }
        let _operation = state.operation.lock().await;
        if !self.current_assignment(id, &state) {
            return Ok(false);
        }
        let trigger = self
            .triggers
            .get(id)
            .map(|t| t.value().clone())
            .or_else(|| self.pending_triggers.get(id).map(|t| t.value().clone()));
        let Some(trigger) = trigger else {
            if state.copies.lock().expect("copies poisoned").is_empty() {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.assignments
                    .remove_if(id, |_, current| Arc::ptr_eq(current, &state));
                return Ok(false);
            }
            anyhow::bail!("trigger teardown descriptor missing");
        };
        let copies = state
            .copies
            .lock()
            .expect("copies poisoned")
            .values()
            .cloned()
            .collect::<Vec<_>>();
        let results = futures::future::join_all(copies.into_iter().map(|(provider, token, _)| {
            let state = &state;
            let trigger = &trigger;
            async move {
                let connected = self
                    .assignment_providers(&trigger.provider_key())
                    .iter()
                    .any(|p| p.worker_id == provider.worker_id);
                let result = if connected {
                    provider
                        .registrator
                        .unregister_assignment(trigger.clone(), token.clone())
                        .await
                } else {
                    Ok(())
                };
                if result.is_ok() {
                    state
                        .copies
                        .lock()
                        .expect("copies poisoned")
                        .remove(&provider.worker_id);
                }
                result
            }
        }))
        .await;
        if let Some(error) = results.into_iter().find_map(Result::err) {
            return Err(error);
        }
        let _park = self
            .park_transition
            .lock()
            .expect("park transition poisoned");
        if !self.current_assignment(id, &state) {
            return Ok(false);
        }
        self.triggers.remove(id);
        self.pending_triggers.remove(id);
        self.assignments.remove(id);
        Ok(true)
    }

    async fn rehome_shared_bindings(&self, key: &TypeKey) {
        if key.0 == crate::protocol::DEFAULT_NAMESPACE {
            return;
        }
        let mut candidates = self.fallback_bindings_for(&key.0, &key.1);
        candidates.extend(
            self.pending_triggers
                .iter()
                .filter(|t| {
                    t.home_namespace == key.0 && t.trigger_type == key.1 && t.is_on_fallback()
                })
                .map(|t| t.value().clone()),
        );
        for mut trigger in candidates {
            if self.legacy_execution_uncertain(&trigger.id) {
                continue;
            }
            let Some(state) = self.assignments.get(&trigger.id).map(|s| s.value().clone()) else {
                // An unfenced provider cannot prove it stopped via shared_v1.
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.legacy_uncertain
                    .lock()
                    .expect("legacy uncertainty poisoned")
                    .insert(trigger.id.clone());
                self.triggers.remove(&trigger.id);
                self.pending_triggers.insert(trigger.id.clone(), trigger);
                continue;
            };
            let operation = state.operation.lock().await;
            if !self.current_assignment(&trigger.id, &state)
                || state.removed.load(std::sync::atomic::Ordering::SeqCst)
            {
                continue;
            }
            {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                state
                    .transferring
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                for copy in state.copies.lock().expect("copies poisoned").values_mut() {
                    copy.2 = false;
                }
                self.triggers.remove(&trigger.id);
                self.pending_triggers
                    .insert(trigger.id.clone(), trigger.clone());
            }
            let copies = state
                .copies
                .lock()
                .expect("copies poisoned")
                .values()
                .cloned()
                .collect::<Vec<_>>();
            let mut stopped = true;
            for (provider, token, _) in copies {
                let connected = self
                    .assignment_providers(&provider.key())
                    .iter()
                    .any(|p| p.worker_id == provider.worker_id);
                if connected
                    && provider
                        .registrator
                        .unregister_assignment(trigger.clone(), token)
                        .await
                        .is_err()
                {
                    stopped = false;
                } else {
                    state
                        .copies
                        .lock()
                        .expect("copies poisoned")
                        .remove(&provider.worker_id);
                }
            }
            if !stopped || state.removed.load(std::sync::atomic::Ordering::SeqCst) {
                continue;
            }
            trigger.provider_namespace = key.0.clone();
            self.pending_triggers
                .insert(trigger.id.clone(), trigger.clone());
            state
                .transferring
                .store(false, std::sync::atomic::Ordering::SeqCst);
            drop(operation);
            let _ = self.install_assignment_lifecycle(trigger, state).await;
        }
    }

    pub(crate) fn has_assignment(&self, id: &str) -> bool {
        self.assignments.contains_key(id)
    }

    pub(crate) fn subscriber_aliases(&self, canonical: &str) -> Vec<(Uuid, String)> {
        self.subscriptions
            .lock()
            .expect("subscriptions poisoned")
            .aliases
            .iter()
            .filter(|(_, id)| id.as_str() == canonical)
            .map(|(alias, _)| alias.clone())
            .collect()
    }

    /// Session-path removal never accepts a canonical ID or another session's alias.
    pub async fn unregister_subscriber(
        &self,
        worker: Uuid,
        alias: String,
        trigger_type: Option<String>,
    ) -> Result<bool, anyhow::Error> {
        if !self.shared() {
            return self.unregister_trigger(alias, trigger_type).await;
        }
        let alias = (worker, alias);
        let (canonical, intent) = {
            let subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
            let Some(canonical) = subscriptions.aliases.get(&alias) else {
                return Ok(false);
            };
            (
                canonical.clone(),
                Arc::clone(&subscriptions.intents[canonical]),
            )
        };
        let _operation = intent.operation.lock().await;
        {
            let mut subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
            // Another removal may have completed while this call waited for I/O.
            if subscriptions.aliases.get(&alias) != Some(&canonical) {
                return Ok(false);
            }
            if subscriptions
                .aliases
                .iter()
                .any(|(other, id)| other != &alias && id == &canonical)
            {
                subscriptions.aliases.remove(&alias);
                return Ok(true);
            }
        }
        // Keep the last alias and descriptor reachable while the provider runs.
        // An error (or cancellation) must leave the same canonical ID retryable.
        self.unregister_trigger_binding(canonical.clone(), trigger_type)
            .await?;
        self.forget_subscription(&canonical);
        Ok(true)
    }

    fn forget_subscription(&self, canonical: &str) {
        let mut subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
        subscriptions.intents.remove(canonical);
        subscriptions.aliases.retain(|_, id| id != canonical);
    }

    /// The namespace a fired trigger's target/condition function resolves in,
    /// looked up LIVE by trigger id at fire time.
    ///
    /// Message-broker triggers (queue `durable:subscriber`, `subscribe`) invoke
    /// their target inside an adapter task that holds only the trigger id — the
    /// enqueued/published message carries no namespace. Resolving against the
    /// registry here uses the trigger's CURRENT binding, exactly as the
    /// in-process workers (state/stream/cron/...) read the live `Trigger`. A
    /// message that sits in a durable queue while its trigger is re-registered
    /// therefore resolves against the new namespace, and one whose trigger has
    /// been unregistered falls back to [`DEFAULT_NAMESPACE`] (there is no binding
    /// left to consult). This is the intended semantic for this plan, not an
    /// accident of lookup.
    pub fn namespace_of(&self, trigger_id: &str) -> String {
        self.triggers
            .get(trigger_id)
            .map(|t| t.namespace.clone())
            .unwrap_or_else(|| crate::protocol::DEFAULT_NAMESPACE.to_string())
    }

    /// Where this binding's provider lives, or `None` when nothing provides it.
    ///
    /// Two steps, and the order is the whole migration story: a project that
    /// ships its own provider for a type id gets it, and everything that has
    /// not been migrated reaches the engine's provider in
    /// [`DEFAULT_NAMESPACE`] without having to say so. Naming a namespace
    /// explicitly skips both steps — that namespace or nothing, because a
    /// caller who was specific should not be quietly served by someone else.
    pub fn resolve_provider_key(&self, trigger: &Trigger) -> Option<TypeKey> {
        if let Some(explicit) = &trigger.trigger_namespace {
            let key = type_key(explicit, &trigger.trigger_type);
            return self.trigger_types.contains_key(&key).then_some(key);
        }

        let home = type_key(&trigger.home_namespace, &trigger.trigger_type);
        if self.trigger_types.contains_key(&home) {
            return Some(home);
        }

        let fallback = type_key(crate::protocol::DEFAULT_NAMESPACE, &trigger.trigger_type);
        self.trigger_types
            .contains_key(&fallback)
            .then_some(fallback)
    }

    /// Bindings that fell back to [`DEFAULT_NAMESPACE`] and would rather have
    /// the provider that just registered at `namespace`.
    ///
    /// Without this the resolution is order-dependent: a worker that binds
    /// before its project's provider announces itself lands on the engine's
    /// one and stays there for good — so whether a project's own provider is
    /// used comes down to which container started first, which is not
    /// something anyone can see or control.
    fn fallback_bindings_for(&self, namespace: &str, type_id: &str) -> Vec<Trigger> {
        self.triggers
            .iter()
            .filter(|pair| {
                let trigger = pair.value();
                trigger.trigger_type == type_id
                    && trigger.home_namespace == namespace
                    && trigger.is_on_fallback()
            })
            .map(|pair| pair.value().clone())
            .collect()
    }

    /// Move fallback bindings onto the provider that just registered at home.
    ///
    /// The old provider is told to let go first. A failure there is logged and
    /// not fatal: the binding still moves, because leaving it on a provider
    /// this registry no longer routes to would make it fire from a place
    /// nothing can unregister.
    async fn rehome_fallback_bindings(&self, trigger_type: &TriggerType) {
        let candidates = self.fallback_bindings_for(&trigger_type.namespace, &trigger_type.id);
        if candidates.is_empty() {
            return;
        }

        for mut trigger in candidates {
            if self.legacy_execution_uncertain(&trigger.id) {
                continue;
            }
            let previous = trigger.provider_key();
            if let Some(old) = self.trigger_types.get(&previous)
                && let Err(err) = old.registrator.unregister_trigger(trigger.clone()).await
            {
                tracing::warn!(
                    error = %err,
                    trigger_id = %trigger.id,
                    from = %previous.0,
                    "Could not detach a trigger from its fallback provider; re-homing anyway"
                );
            }

            trigger.provider_namespace = trigger_type.namespace.clone();
            match trigger_type
                .registrator
                .replay_trigger(trigger.clone())
                .await
            {
                Ok(()) => {
                    tracing::info!(
                        "{} Trigger {} (type {}) moved from {} to its own namespace {}",
                        "[RE-HOMED]".green(),
                        trigger.id.purple(),
                        trigger.trigger_type.purple(),
                        previous.0.purple(),
                        trigger_type.namespace.purple(),
                    );
                    self.triggers.insert(trigger.id.clone(), trigger);
                }
                Err(err) => {
                    // It is off the old provider and the new one refused it.
                    // Park rather than leave it pointing at a provider that is
                    // no longer routed: pending is the bucket that gets
                    // retried on the next registration.
                    tracing::error!(
                        error = %err,
                        trigger_id = %trigger.id,
                        "Re-homing failed; the binding is parked until the trigger type re-registers"
                    );
                    let _park = self
                        .park_transition
                        .lock()
                        .expect("park_transition lock poisoned");
                    self.triggers.remove(&trigger.id);
                    self.pending_triggers.insert(trigger.id.clone(), trigger);
                }
            }
        }
    }

    pub async fn unregister_worker(&self, worker_id: &Uuid) {
        if self.shared() {
            {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.retired_providers
                    .lock()
                    .expect("retired providers poisoned")
                    .insert(*worker_id);
                // Session UUIDs are never reused. Serialize this release with
                // install reservation so a retiring session cannot add it back.
                self.legacy_observations
                    .lock()
                    .expect("legacy observations poisoned")
                    .retain(|(owner, _), _| owner != worker_id);
                let mut uncertain = self
                    .legacy_uncertain
                    .lock()
                    .expect("legacy uncertainty poisoned");
                for install in self.legacy_installs.iter() {
                    if install.provider == Some(*worker_id) {
                        uncertain.insert(install.trigger.id.clone());
                        self.pending_triggers
                            .insert(install.trigger.id.clone(), install.trigger.clone());
                    }
                }
                for trigger in self.triggers.iter() {
                    if self
                        .trigger_types
                        .get(&trigger.provider_key())
                        .is_some_and(|p| {
                            p.worker_id == Some(*worker_id) && p.delivery_contract.is_none()
                        })
                    {
                        uncertain.insert(trigger.id.clone());
                    }
                }
            }
            let aliases: Vec<String> = self
                .subscriptions
                .lock()
                .expect("subscriptions poisoned")
                .aliases
                .keys()
                .filter(|(owner, _)| owner == worker_id)
                .map(|(_, alias)| alias.clone())
                .collect();
            for entry in self.assignments.iter() {
                entry
                    .copies
                    .lock()
                    .expect("copies poisoned")
                    .remove(&Some(*worker_id));
            }
            // A departing session cannot retire an acknowledged sibling.
            {
                let mut owners = self
                    .provider_owners
                    .lock()
                    .expect("provider owners poisoned");
                owners.retain(|key, members| {
                    members.retain(|member| member.worker_id != Some(*worker_id));
                    if let Some(first) = members.first() {
                        self.trigger_types
                            .insert(key.clone(), first.as_ref().clone());
                        true
                    } else {
                        self.trigger_types.remove(key);
                        false
                    }
                });
            }
            for alias in aliases {
                if let Err(error) = self.unregister_subscriber(*worker_id, alias, None).await {
                    tracing::error!(%error, "Failed to remove last trigger subscriber");
                }
            }
            let assignments = self
                .assignments
                .iter()
                .map(|entry| (entry.key().clone(), entry.value().clone()))
                .collect::<Vec<_>>();
            for (id, state) in assignments {
                let trigger = self
                    .triggers
                    .get(&id)
                    .map(|t| t.value().clone())
                    .or_else(|| self.pending_triggers.get(&id).map(|t| t.value().clone()));
                if let Some(trigger) = trigger {
                    self.publish_assignments(&trigger, &state);
                }
            }
            let orphaned: Vec<Trigger> = self
                .triggers
                .iter()
                .filter(|entry| !self.trigger_types.contains_key(&entry.provider_key()))
                .map(|entry| entry.value().clone())
                .collect();
            {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park_transition poisoned");
                for trigger in orphaned {
                    if let Some((_, trigger)) = self.triggers.remove(&trigger.id) {
                        self.pending_triggers.insert(trigger.id.clone(), trigger);
                    }
                }
            }
            let keys = self
                .provider_owners
                .lock()
                .expect("provider owners poisoned")
                .iter()
                .filter(|(_, members)| {
                    members[0].delivery_contract == Some(TriggerDeliveryContract::SharedV1)
                })
                .map(|(key, _)| key.clone())
                .collect::<Vec<_>>();
            for key in keys {
                self.replay_shared_assignments(key).await;
            }
            return;
        }
        let worker_trigger_type_keys: Vec<TypeKey> = self
            .trigger_types
            .iter()
            .filter(|pair| pair.value().worker_id == Some(*worker_id))
            .map(|pair| pair.key().clone())
            .collect();

        let worker_triggers: Vec<Trigger> = self
            .triggers
            .iter()
            .filter(|pair| pair.value().worker_id == Some(*worker_id))
            .map(|pair| pair.value().clone())
            .collect();

        for trigger in worker_triggers {
            tracing::debug!(trigger_id = trigger.id, "Removing trigger");
            // The entry may have been replaced between the snapshot above and
            // now (worker reconnect: the new connection replays the same
            // trigger id before the old connection's cleanup runs). Only
            // remove it — and only unregister it with the registrator — if it
            // still belongs to the disconnecting worker; a replaced binding
            // keeps firing. Same guard as trigger types below.
            if self
                .triggers
                .remove_if(&trigger.id, |_, t| t.worker_id == Some(*worker_id))
                .is_none()
            {
                tracing::debug!(
                    trigger_id = trigger.id,
                    "Trigger already replaced by another worker; leaving it"
                );
                continue;
            }

            if let Some(trigger_type) = self.trigger_types.get(&trigger.provider_key()) {
                tracing::debug!(trigger_type_id = trigger_type.id, "Unregistering trigger");

                let result: Result<(), anyhow::Error> = trigger_type
                    .registrator
                    .unregister_trigger(trigger.clone())
                    .await;
                if let Err(err) = result {
                    tracing::error!(error = %err, "Error unregistering trigger");
                }
            }

            tracing::debug!(trigger_id = trigger.id, "Trigger removed");
        }

        // Connection-owned intents die with their worker, same as live
        // connection-owned bindings above.
        self.pending_triggers
            .retain(|_, trigger| trigger.worker_id != Some(*worker_id));

        for key in worker_trigger_type_keys {
            tracing::debug!(trigger_type_id = %key.1, namespace = %key.0, "Removing trigger type");
            // The entry may have been replaced by a new provider between the
            // snapshot above and now (worker restart: the replacement can
            // register before the old connection's cleanup runs). Only remove
            // it if it still belongs to the disconnecting worker — and only
            // then are its bindings orphaned; a replaced type keeps firing.
            let removed = self
                .trigger_types
                .remove_if(&key, |_, tt| tt.worker_id == Some(*worker_id))
                .is_some();
            if !removed {
                tracing::debug!(
                    trigger_type_id = %key.1,
                    "Trigger type already replaced by another worker; leaving it"
                );
                continue;
            }
            tracing::debug!(trigger_type_id = %key.1, "Trigger type removed");

            // Bindings this provider served are now orphaned: nothing can fire
            // them. Each resolves again — a binding that only resolved here
            // because it is at home can fall back to the engine's provider in
            // `default`, which is the same step that carried it before its own
            // provider existed. Whatever still resolves nowhere is parked, so a
            // provider restart never silently drops everyone else's bindings.
            let orphaned: Vec<Trigger> = self
                .triggers
                .iter()
                .filter(|pair| pair.value().provider_key() == key)
                .map(|pair| pair.value().clone())
                .collect();
            for mut trigger in orphaned {
                // Act only when this call is the one that removed the binding:
                // a concurrent owner-disconnect cleanup may have already
                // reaped it, and re-adding it would resurrect a dead worker's
                // binding.
                if self.triggers.remove(&trigger.id).is_none() {
                    continue;
                }

                if self.legacy_execution_uncertain(&trigger.id) {
                    self.pending_triggers.insert(trigger.id.clone(), trigger);
                    continue;
                }
                match self.resolve_provider_key(&trigger) {
                    Some(next) => {
                        trigger.provider_namespace = next.0.clone();
                        let replayed = match self.trigger_types.get(&next) {
                            Some(provider) => {
                                provider.registrator.replay_trigger(trigger.clone()).await
                            }
                            None => Err(anyhow::anyhow!("provider vanished during failover")),
                        };
                        match replayed {
                            Ok(()) => {
                                tracing::info!(
                                    "{} Trigger {} (type {}) fell back to {} after its provider left",
                                    "[RE-HOMED]".green(),
                                    trigger.id.purple(),
                                    trigger.trigger_type.purple(),
                                    next.0.purple(),
                                );
                                self.triggers.insert(trigger.id.clone(), trigger);
                                continue;
                            }
                            Err(err) => tracing::error!(
                                error = %err,
                                trigger_id = %trigger.id,
                                "Fallback provider refused the binding; parking it"
                            ),
                        }
                    }
                    None => tracing::warn!(
                        "{} Trigger {} (type {}, function {}) is disabled: its trigger type was unregistered. It will be re-registered automatically when the trigger type returns.",
                        "[DISABLED]".yellow(),
                        trigger.id.purple(),
                        trigger.trigger_type.purple(),
                        trigger.function_id.purple(),
                    ),
                }
                self.pending_triggers.insert(trigger.id.clone(), trigger);
            }
        }
    }

    pub async fn register_trigger_type(
        &self,
        trigger_type: TriggerType,
    ) -> Result<(), anyhow::Error> {
        let key = trigger_type.key();
        self.register_trigger_type_declaration(trigger_type).await?;
        if self.shared() {
            self.rehome_shared_bindings(&key).await;
        }
        Ok(())
    }

    // WS declaration runs on the provider read loop. Stop/install ACKs must be
    // awaited by its separately spawned replay task, never by that read loop.
    pub(crate) async fn register_trigger_type_declaration(
        &self,
        trigger_type: TriggerType,
    ) -> Result<(), anyhow::Error> {
        let key = trigger_type.key();
        let trigger_type_id = trigger_type.id.clone();
        let trigger_type = Arc::new(trigger_type);
        if self.shared() {
            if trigger_type.delivery_mode == TriggerDeliveryMode::Parallel
                && trigger_type.delivery_contract != Some(TriggerDeliveryContract::SharedV1)
            {
                anyhow::bail!("trigger_owner_mismatch: parallel requires shared_v1");
            }
            let mut owners = self
                .provider_owners
                .lock()
                .expect("provider owners poisoned");
            if let Some(members) = owners.get_mut(&key) {
                let same_session = members
                    .iter()
                    .any(|owner| owner.worker_id == trigger_type.worker_id);
                if !members[0].compatible_with(&trigger_type)
                    || (!same_session
                        && (trigger_type.delivery_contract.is_none()
                            || trigger_type.worker_id.is_none()
                            || members.iter().any(|owner| owner.worker_id.is_none())))
                {
                    anyhow::bail!("trigger_owner_mismatch: incompatible provider declaration");
                }
                if !same_session {
                    members.push(Arc::clone(&trigger_type));
                }
                return Ok(());
            }
            owners.insert(key.clone(), vec![Arc::clone(&trigger_type)]);
            self.trigger_types
                .insert(key.clone(), trigger_type.as_ref().clone());
            if trigger_type.delivery_contract == Some(TriggerDeliveryContract::SharedV1) {
                return Ok(());
            }
        }

        tracing::info!(
            "{} Trigger Type {} in {}",
            "[REGISTERED]".green(),
            trigger_type_id.purple(),
            trigger_type.namespace.purple()
        );

        // Publish the type BEFORE any replay so every concurrent path
        // observes the new generation first:
        //  * a concurrent `register_trigger` that misses the pending drain
        //    finds the type on its post-park re-check, so an intent can never
        //    be stranded in pending while the type is available (see
        //    `register_trigger`);
        //  * a stale disconnect cleanup of the previous provider now fails
        //    its ownership check (see `unregister_worker`) instead of parking
        //    bindings this registration is about to replay — which would
        //    deliver them twice.
        if !self.shared() {
            self.trigger_types
                .insert(key.clone(), trigger_type.as_ref().clone());
        }

        // Only the bindings this provider actually serves. Filtering by type
        // id alone is what sent one project's bindings into another project's
        // provider, so the resolved key is the filter.
        let matching_triggers: Vec<Trigger> = self
            .triggers
            .iter()
            .filter(|pair| {
                pair.value().provider_key() == key && !self.legacy_execution_uncertain(pair.key())
            })
            .map(|pair| pair.value().clone())
            .collect();

        // Re-fetch instead of using the inserted value: if an even newer
        // generation replaced the entry in the meantime, replay must route to
        // that one.
        if let Some(trigger_type) = self.trigger_types.get(&key) {
            for trigger in matching_triggers {
                if self.shared() {
                    let _ = self.install_legacy(trigger, &trigger_type, true).await;
                    continue;
                }
                let result = trigger_type
                    .registrator
                    .replay_trigger(trigger.clone())
                    .await;
                if let Err(err) = result {
                    tracing::error!(error = %err, "Error registering trigger");
                }
            }

            // A parked intent resolves again from scratch: it may have been
            // parked when nothing provided the type at all, and this
            // registration is what makes it resolvable.
            let pending: Vec<String> = self
                .pending_triggers
                .iter()
                .filter(|pair| {
                    !self
                        .legacy_uncertain
                        .lock()
                        .expect("legacy uncertainty poisoned")
                        .contains(pair.key())
                        && pair.value().trigger_type == trigger_type_id
                        && self.resolve_provider_key(pair.value()).as_ref() == Some(&key)
                })
                .map(|pair| pair.key().clone())
                .collect();

            for trigger_id in pending {
                // `remove` claims the intent, so a concurrent drain of the
                // same type cannot activate it twice.
                let Some((_, mut trigger)) = self.pending_triggers.remove(&trigger_id) else {
                    continue;
                };
                trigger.provider_namespace = key.0.clone();
                self.activate_pending_trigger(&trigger_type, trigger).await;
            }
        }

        // Claim back what settled on the fallback before this provider existed.
        // Re-fetched for the same reason as above, and after the replay so a
        // binding is never in flight to two providers at once.
        if !self.shared()
            && key.0 != crate::protocol::DEFAULT_NAMESPACE
            && let Some(trigger_type) = self.trigger_types.get(&key)
        {
            self.rehome_fallback_bindings(&trigger_type).await;
        }

        Ok(())
    }

    /// Activate a claimed pending intent against its now-available trigger
    /// type. On registrator failure the intent is parked again so the next
    /// type (re)registration retries it.
    async fn activate_pending_trigger(&self, trigger_type: &TriggerType, trigger: Trigger) -> bool {
        if self.legacy_execution_uncertain(&trigger.id) {
            // Replay must leave the parked descriptor owned by its intent,
            // rather than create a lifecycle or revive a removed subscription.
            let _park = self
                .park_transition
                .lock()
                .expect("park transition poisoned");
            let subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
            if subscriptions.intents.contains_key(&trigger.id) {
                self.pending_triggers
                    .entry(trigger.id.clone())
                    .or_insert(trigger);
            }
            return false;
        }
        if self.shared()
            && trigger_type.delivery_contract == Some(TriggerDeliveryContract::SharedV1)
        {
            // The caller owns a freshly claimed pending intent. Production's
            // concurrent shared_v1 claim carries its Arc directly to install.
            let state = {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.assignments
                    .entry(trigger.id.clone())
                    .or_default()
                    .clone()
            };
            return matches!(
                self.install_assignment_lifecycle(trigger, state).await,
                Ok(RegisterTriggerOutcome::Registered)
            );
        }
        if self.shared() {
            return matches!(
                self.install_legacy(trigger, trigger_type, true).await,
                Ok(RegisterTriggerOutcome::Registered)
            );
        }
        match trigger_type
            .registrator
            .replay_trigger(trigger.clone())
            .await
        {
            Ok(()) => {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                if self.legacy_execution_uncertain(&trigger.id) {
                    return false;
                }
                tracing::info!(
                    "{} Trigger {} (type {}, function {}) recovered from pending",
                    "[REGISTERED]".green(),
                    trigger.id.purple(),
                    trigger.trigger_type.purple(),
                    trigger.function_id.purple(),
                );
                self.triggers.insert(trigger.id.clone(), trigger);
                true
            }
            Err(err) => {
                tracing::error!(
                    error = %err,
                    trigger_id = %trigger.id,
                    trigger_type = %trigger.trigger_type,
                    "Error registering pending trigger; it stays pending"
                );
                self.pending_triggers.insert(trigger.id.clone(), trigger);
                false
            }
        }
    }

    /// Human-readable warning for a registration intent that had to be
    /// parked because its trigger type is not available.
    fn pending_trigger_warning(trigger: &Trigger) -> String {
        let base = format!(
            "{} Trigger {} (function {}) was NOT activated: trigger type {} is not registered. It will be registered automatically when the trigger type becomes available.",
            "[PENDING]".yellow(),
            trigger.id.purple(),
            trigger.function_id.purple(),
            trigger.trigger_type.purple().bold(),
        );
        match known_trigger_type_provider(&trigger.trigger_type) {
            Some(worker_name) => format!(
                "{} If this persists, the {} worker is missing — run: {}",
                base,
                worker_name.cyan().bold(),
                format!(
                    "iii trigger -n <compose-daemon-namespace> compose::add worker={}",
                    worker_name
                )
                .green()
                .bold()
            ),
            None => format!(
                "{} If this persists, search for a worker that provides this trigger type at {}",
                base,
                "https://workers.iii.dev/".cyan().bold()
            ),
        }
    }

    pub async fn register_trigger(
        &self,
        trigger: Trigger,
    ) -> Result<RegisterTriggerOutcome, anyhow::Error> {
        if self.shared()
            && let Some(owner) = trigger.worker_id
        {
            let descriptor = TriggerDescriptor::from(&trigger);
            let alias = (owner, trigger.id.clone());
            let (canonical, intent) = {
                let mut subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
                if let Some(id) = subscriptions.aliases.get(&alias) {
                    let intent = &subscriptions.intents[id];
                    if intent.descriptor != descriptor {
                        anyhow::bail!(
                            "trigger_registration_conflict: alias has a different descriptor"
                        );
                    }
                    (id.clone(), Arc::clone(intent))
                } else {
                    let existing = subscriptions
                        .intents
                        .iter()
                        .find(|(_, intent)| intent.descriptor == descriptor)
                        .map(|(id, intent)| (id.clone(), Arc::clone(intent)));
                    let (id, intent) = existing.unwrap_or_else(|| {
                        let id = Uuid::new_v4().to_string();
                        let intent = Arc::new(LogicalTrigger {
                            descriptor,
                            operation: tokio::sync::Mutex::new(()),
                        });
                        subscriptions
                            .intents
                            .insert(id.clone(), Arc::clone(&intent));
                        (id, intent)
                    });
                    // Reserve the alias during intent discovery; publication is
                    // revalidated under the intent's operation lock below.
                    subscriptions.aliases.insert(alias.clone(), id.clone());
                    (id, intent)
                }
            };
            let _operation = intent.operation.lock().await;
            {
                let mut subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
                if !subscriptions.intents.contains_key(&canonical) {
                    anyhow::bail!("trigger_registration_conflict: subscription was removed");
                }
                if let Some(current) = subscriptions.aliases.get(&alias)
                    && current != &canonical
                {
                    anyhow::bail!(
                        "trigger_registration_conflict: alias has a different descriptor"
                    );
                }
                // A removal may have dropped this alias while we waited for the
                // operation lock, leaving a peer's subscription alive. Restore
                // our subscriber before reporting idempotent registration.
                subscriptions.aliases.insert(alias, canonical.clone());
            }
            if self.legacy_execution_uncertain(&canonical) {
                return Ok(RegisterTriggerOutcome::Deferred);
            }
            if self.assignments.contains_key(&canonical) {
                let mut binding = self
                    .triggers
                    .get(&canonical)
                    .map(|t| t.value().clone())
                    .or_else(|| {
                        self.pending_triggers
                            .get(&canonical)
                            .map(|t| t.value().clone())
                    })
                    .unwrap_or(trigger);
                binding.id = canonical;
                // Do not discard aliases on a teardown error: they are needed
                // to retry paying the last subscriber's remaining stop debt.
                return self.install_assignments(binding).await;
            }
            if self.triggers.contains_key(&canonical) {
                return Ok(RegisterTriggerOutcome::Registered);
            }
            if self.pending_triggers.contains_key(&canonical) {
                return Ok(RegisterTriggerOutcome::Deferred);
            }
            let mut trigger = trigger;
            trigger.id = canonical.clone();
            let result = self.register_trigger_binding(trigger).await;
            if result.is_err() {
                let mut subscriptions = self.subscriptions.lock().expect("subscriptions poisoned");
                subscriptions.intents.remove(&canonical);
                subscriptions.aliases.retain(|_, id| id != &canonical);
            }
            return result;
        }
        self.register_trigger_binding(trigger).await
    }

    async fn register_trigger_binding(
        &self,
        trigger: Trigger,
    ) -> Result<RegisterTriggerOutcome, anyhow::Error> {
        if self.legacy_execution_uncertain(&trigger.id) {
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        let mut trigger = trigger;
        let resolved = self.resolve_provider_key(&trigger);
        if let Some(key) = &resolved {
            trigger.provider_namespace = key.0.clone();
        }
        let trigger = trigger;
        let Some(trigger_type) = resolved.as_ref().and_then(|key| {
            self.trigger_types
                .get(key)
                .map(|entry| entry.value().clone())
        }) else {
            // Park the intent instead of failing: workers may connect in any
            // order, and a binding that arrives before its trigger type's
            // provider must survive until the provider shows up.
            tracing::warn!("{}", Self::pending_trigger_warning(&trigger));
            {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.pending_triggers
                    .insert(trigger.id.clone(), trigger.clone());
            }

            // Close the park/drain race: if the type registered between the
            // lookup above and the park, its pending drain may have already
            // run. Re-check and activate the intent ourselves — claiming it
            // via `remove` so we never double-activate with a drain.
            // Resolved again rather than reusing the earlier miss: the
            // provider that appeared in the meantime may be either step.
            if let Some(key) = self.resolve_provider_key(&trigger)
                && let Some(trigger_type) = self
                    .trigger_types
                    .get(&key)
                    .map(|entry| entry.value().clone())
            {
                let claimed = {
                    let _park = self
                        .park_transition
                        .lock()
                        .expect("park transition poisoned");
                    self.pending_triggers
                        .remove(&trigger.id)
                        .map(|(_, mut parked)| {
                            parked.provider_namespace = key.0.clone();
                            let state = (self.shared()
                                && trigger_type.delivery_contract
                                    == Some(TriggerDeliveryContract::SharedV1))
                            .then(|| {
                                self.assignments
                                    .entry(trigger.id.clone())
                                    .or_default()
                                    .clone()
                            });
                            (parked, state)
                        })
                };
                let Some((parked, state)) = claimed else {
                    return Ok(RegisterTriggerOutcome::Deferred);
                };
                let activated = if let Some(state) = state {
                    matches!(
                        self.install_assignment_lifecycle(parked, state).await,
                        Ok(RegisterTriggerOutcome::Registered)
                    )
                } else {
                    self.activate_pending_trigger(&trigger_type, parked).await
                };
                if activated {
                    return Ok(RegisterTriggerOutcome::Registered);
                }
            }

            return Ok(RegisterTriggerOutcome::Deferred);
        };

        if self.shared()
            && trigger_type.delivery_contract == Some(TriggerDeliveryContract::SharedV1)
        {
            // Only an explicit registration or a locked pending-intent claim
            // creates a lifecycle; replay carries an existing Arc instead.
            let state = {
                let _park = self
                    .park_transition
                    .lock()
                    .expect("park transition poisoned");
                self.assignments
                    .entry(trigger.id.clone())
                    .or_default()
                    .clone()
            };
            return self.install_assignment_lifecycle(trigger, state).await;
        }
        if self.shared() {
            return self.install_legacy(trigger, &trigger_type, false).await;
        }
        if let Err(err) = trigger_type
            .registrator
            .register_trigger(trigger.clone())
            .await
        {
            if err.downcast_ref::<RegistratorUnavailable>().is_none() {
                // The provider processed and rejected the bind (e.g. invalid
                // config): a definitive answer, not a delivery failure. Fail
                // the registration so callers surface the error, and leave any
                // previous live registration of this id tracked — the provider
                // still runs it and it must stay reachable for teardown.
                tracing::error!(error = %err, "Error registering trigger");
                return Err(err);
            }
            tracing::error!(
                error = %err,
                trigger_id = %trigger.id,
                trigger_type = %trigger.trigger_type,
                "Trigger provider unreachable; bind parked as pending until the trigger type re-registers"
            );
            // Park instead of failing; an undeliverable re-registration
            // supersedes a previous live binding with the same id (the dying
            // provider's jobs die with it) — the binding must end in exactly
            // one bucket.
            self.triggers.remove(&trigger.id);
            self.pending_triggers.insert(trigger.id.clone(), trigger);
            return Ok(RegisterTriggerOutcome::Deferred);
        }

        drop(trigger_type);

        tracing::debug!(trigger = %trigger.id, worker_id = %trigger.worker_id.unwrap_or_default(), "Registering trigger");

        // Recheck after provider I/O: an unfenced loss/rehome may have parked
        // this binding while its old registration completion was in flight.
        let _park = self
            .park_transition
            .lock()
            .expect("park transition poisoned");
        if self.legacy_execution_uncertain(&trigger.id) {
            return Ok(RegisterTriggerOutcome::Deferred);
        }
        // A live registration supersedes any parked intent with the same id.
        self.pending_triggers.remove(&trigger.id);
        self.triggers.insert(trigger.id.clone(), trigger);

        Ok(RegisterTriggerOutcome::Registered)
    }

    /// Unregister a trigger by id. Idempotent: returns `Ok(false)` when no
    /// trigger with this id exists (rather than erroring), so callers can treat
    /// double-unregister as a no-op. A parked pending intent counts as
    /// existing: unregistering it drops the intent and returns `Ok(true)`.
    /// On a registrator error the registry entry is left in place (registry
    /// and registrator stay consistent) and the error is propagated. Returns
    /// `Ok(true)` when a trigger was removed.
    pub async fn unregister_trigger(
        &self,
        id: String,
        trigger_type: Option<String>,
    ) -> Result<bool, anyhow::Error> {
        let intent = if self.shared() {
            self.subscriptions
                .lock()
                .expect("subscriptions poisoned")
                .intents
                .get(&id)
                .cloned()
        } else {
            None
        };
        // Global and subscriber teardown use the same per-intent I/O lock.
        let _operation = match &intent {
            Some(intent) => Some(intent.operation.lock().await),
            None => None,
        };
        let result = self
            .unregister_trigger_binding(id.clone(), trigger_type)
            .await?;
        if self.shared() {
            self.forget_subscription(&id);
        }
        Ok(result)
    }

    async fn unregister_trigger_binding(
        &self,
        id: String,
        trigger_type: Option<String>,
    ) -> Result<bool, anyhow::Error> {
        if let Some(state) = self.assignments.get(&id).map(|entry| entry.value().clone()) {
            return self.revoke_assignments(&id, state).await;
        }
        #[cfg(test)]
        Self::pause_transition(&self.removal_pause).await;
        tracing::info!(
            "Unregistering trigger: {} of type: {}",
            id.purple(),
            trigger_type.as_deref().unwrap_or("<missing>").purple()
        );

        let (state, trigger) = {
            let _park = self
                .park_transition
                .lock()
                .expect("park_transition lock poisoned");
            // Keep only id/session tombstones: a later untagged result cannot
            // distinguish the removed registration from a same-session retry.
            for ((_, observed_id), observation) in self
                .legacy_observations
                .lock()
                .expect("legacy observations poisoned")
                .iter_mut()
            {
                if observed_id == &id {
                    *observation = None;
                }
            }
            if self.legacy_installs.remove(&id).is_some() {
                // An in-flight unfenced install may already execute. Invalidate
                // its completion and keep uncertainty even after removing intent.
                self.legacy_uncertain
                    .lock()
                    .expect("legacy uncertainty poisoned")
                    .insert(id.clone());
            }
            // Replay can reserve the FIRST lifecycle after the fast lookup
            // above. The authoritative lookup and the no-lifecycle deletion
            // must share replay's reservation lock, or removal loses that Arc.
            if let Some(state) = self.assignments.get(&id) {
                (Some(state.value().clone()), None)
            } else {
                let Some(trigger_entry) = self.triggers.get(&id) else {
                    return Ok(self.pending_triggers.remove(&id).is_some());
                };
                (None, Some(trigger_entry.value().clone()))
            }
        };
        if let Some(state) = state {
            return self.revoke_assignments(&id, state).await;
        }
        let trigger = trigger.expect("legacy live binding");

        if let Some(tt) = self.trigger_types.get(&trigger.provider_key()) {
            tt.registrator.unregister_trigger(trigger.clone()).await?;
        }

        // A late async rejection may re-park this binding while the
        // registrator call above is in flight; an explicit unregister must
        // win over that park or the intent resurrects on the next type
        // registration. The transition lock makes this two-map clear atomic
        // with the re-park's own live-to-pending move.
        let _park = self
            .park_transition
            .lock()
            .expect("park_transition lock poisoned");
        self.triggers.remove(&id);
        self.pending_triggers.remove(&id);

        Ok(true)
    }

    /// Move a live binding to `pending_triggers` after its provider reported
    /// an async registration error (the caller has already verified the
    /// reporter owned the trigger type). No-op when the binding is already
    /// gone — a concurrent disconnect GC or explicit unregister reaped it,
    /// and parking then would resurrect a dead binding.
    pub async fn park_rejected_trigger(&self, id: &str, reporter_worker_id: Uuid) {
        let parked_type = {
            let _park = self
                .park_transition
                .lock()
                .expect("park_transition lock poisoned");
            let Some((_, failed)) = self.triggers.remove(id) else {
                return;
            };
            tracing::warn!(
                trigger_id = %id,
                trigger_type = %failed.trigger_type,
                function_id = %failed.function_id,
                "Trigger registration rejected by provider; parked as pending until the trigger type re-registers"
            );
            let provider = failed.provider_key();
            self.pending_triggers.insert(failed.id.clone(), failed);
            provider
        };

        // Close the park/replacement race (mirror of the unknown-type park in
        // `register_trigger`): the reporter's ownership was checked before the
        // park, but a replacement provider may have registered — and drained
        // pending intents — in between, which would strand this park until
        // yet another re-registration. If the type's current owner is no
        // longer the reporter, claim the intent back (via `remove`, so we
        // never double-activate with a drain) and activate it through the
        // current provider. While the reporter still owns the type the park
        // is intended: replaying would just be rejected again.
        if let Some(trigger_type) = self
            .trigger_types
            .get(&parked_type)
            .map(|entry| entry.value().clone())
            && trigger_type.worker_id != Some(reporter_worker_id)
        {
            if self.shared()
                && trigger_type.delivery_contract == Some(TriggerDeliveryContract::SharedV1)
            {
                // Do not remove pending first and reserve an Arc later: final
                // removal must see either the pending intent or its lifecycle.
                self.replay_shared_assignments(parked_type).await;
            } else if let Some((_, parked)) = self.pending_triggers.remove(id) {
                self.activate_pending_trigger(&trigger_type, parked).await;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::DEFAULT_NAMESPACE;
    use std::collections::HashSet;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// A no-op registrator used for testing synchronous registry operations.
    struct MockRegistrator {
        register_count: AtomicUsize,
        unregister_count: AtomicUsize,
    }

    impl MockRegistrator {
        fn new() -> Self {
            Self {
                register_count: AtomicUsize::new(0),
                unregister_count: AtomicUsize::new(0),
            }
        }
    }

    struct ControlledRegistrator {
        register_count: AtomicUsize,
        unregister_count: AtomicUsize,
        fail_register: bool,
        fail_unregister: bool,
    }

    impl ControlledRegistrator {
        fn new(fail_register: bool, fail_unregister: bool) -> Self {
            Self {
                register_count: AtomicUsize::new(0),
                unregister_count: AtomicUsize::new(0),
                fail_register,
                fail_unregister,
            }
        }
    }

    impl TriggerRegistrator for Arc<ControlledRegistrator> {
        fn register_trigger(
            &self,
            _trigger: Trigger,
        ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
            self.register_count.fetch_add(1, Ordering::SeqCst);
            Box::pin(async move {
                if self.fail_register {
                    Err(anyhow::anyhow!("register failed"))
                } else {
                    Ok(())
                }
            })
        }

        fn unregister_trigger(
            &self,
            _trigger: Trigger,
        ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
            self.unregister_count.fetch_add(1, Ordering::SeqCst);
            Box::pin(async move {
                if self.fail_unregister {
                    Err(anyhow::anyhow!("unregister failed"))
                } else {
                    Ok(())
                }
            })
        }
    }

    impl TriggerRegistrator for MockRegistrator {
        fn register_trigger(
            &self,
            _trigger: Trigger,
        ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
            self.register_count.fetch_add(1, Ordering::SeqCst);
            Box::pin(async { Ok(()) })
        }

        fn unregister_trigger(
            &self,
            _trigger: Trigger,
        ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
            self.unregister_count.fetch_add(1, Ordering::SeqCst);
            Box::pin(async { Ok(()) })
        }
    }

    #[derive(Default)]
    struct AssignmentFixture {
        installs: AtomicUsize,
        stops: AtomicUsize,
        failure: AtomicUsize,
        stop_failure: AtomicUsize,
        tokens: std::sync::Mutex<Vec<String>>,
    }

    impl TriggerRegistrator for Arc<AssignmentFixture> {
        fn register_trigger(
            &self,
            _: Trigger,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            panic!("shared_v1 must not use legacy register/replay");
        }
        fn unregister_trigger(
            &self,
            _: Trigger,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            panic!("shared_v1 must not use legacy stop");
        }
        fn register_assignment(
            &self,
            _: Trigger,
            token: String,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            self.installs.fetch_add(1, Ordering::SeqCst);
            self.tokens.lock().unwrap().push(token);
            let failure = self.failure.load(Ordering::SeqCst);
            Box::pin(async move {
                match failure {
                    0 => Ok(()),
                    1 => Err(anyhow::anyhow!("copy rejected")),
                    _ => Err(anyhow::Error::new(RegistratorUnavailable)),
                }
            })
        }
        fn unregister_assignment(
            &self,
            _: Trigger,
            _: String,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            self.stops.fetch_add(1, Ordering::SeqCst);
            let failure = self.stop_failure.load(Ordering::SeqCst);
            Box::pin(async move {
                match failure {
                    0 => Ok(()),
                    1 => Err(anyhow::anyhow!("stop rejected")),
                    _ => Err(anyhow::Error::new(RegistratorUnavailable)),
                }
            })
        }
    }

    async fn assignment_fixture(registry: &TriggerRegistry) -> Arc<AssignmentFixture> {
        let fixture = Arc::new(AssignmentFixture::default());
        registry
            .register_trigger_type(
                TriggerType::new_ns(
                    "orders",
                    "fixture",
                    "assignment regression",
                    Box::new(fixture.clone()),
                    Some(Uuid::new_v4()),
                )
                .with_delivery_mode(TriggerDeliveryMode::Parallel)
                .with_delivery_contract(TriggerDeliveryContract::SharedV1),
            )
            .await
            .unwrap();
        fixture
    }

    fn assignment_binding() -> Trigger {
        let mut binding = make_trigger("alias", "fixture");
        binding.worker_id = Some(Uuid::new_v4());
        binding.namespace = "orders".into();
        binding.home_namespace = "orders".into();
        binding.provider_namespace = "orders".into();
        binding
    }

    #[tokio::test]
    async fn shared_trigger_parallel_partial_retry_requires_every_snapshot_member() {
        for failure in [1, 2] {
            let registry = TriggerRegistry::new();
            registry.set_shared_namespace_ownership(true);
            let healthy = assignment_fixture(&registry).await;
            let failing = assignment_fixture(&registry).await;
            failing.failure.store(failure, Ordering::SeqCst);
            let binding = assignment_binding();
            assert_eq!(
                registry.register_trigger(binding.clone()).await.unwrap(),
                RegisterTriggerOutcome::Deferred
            );
            let canonical = registry.subscriptions.lock().unwrap().aliases
                [&(binding.worker_id.unwrap(), binding.id.clone())]
                .clone();
            assert!(registry.triggers.contains_key(&canonical));
            assert_eq!(
                registry.register_trigger(binding.clone()).await.unwrap(),
                RegisterTriggerOutcome::Deferred,
                "healthy sibling is not a complete snapshot"
            );
            assert_eq!(healthy.installs.load(Ordering::SeqCst), 1);
            assert_eq!(
                failing.installs.load(Ordering::SeqCst),
                2,
                "uncertain/rejected copies must retry"
            );
            if failure == 2 {
                let tokens = failing.tokens.lock().unwrap();
                assert_eq!(
                    tokens[0], tokens[1],
                    "uncertain generation retains its teardown identity"
                );
            }
            failing.failure.store(0, Ordering::SeqCst);
            registry
                .replay_shared_assignments(type_key("orders", "fixture"))
                .await;
            assert_eq!(
                registry.register_trigger(binding).await.unwrap(),
                RegisterTriggerOutcome::Registered
            );
            assert_eq!(healthy.installs.load(Ordering::SeqCst), 1);
            assert_eq!(failing.installs.load(Ordering::SeqCst), 3);
        }
    }

    #[tokio::test]
    async fn shared_trigger_ack_failed_stop_is_inactive_retryable_tombstone() {
        for failure in [1, 2] {
            let registry = TriggerRegistry::new();
            registry.set_shared_namespace_ownership(true);
            let provider = assignment_fixture(&registry).await;
            let binding = assignment_binding();
            registry.register_trigger(binding.clone()).await.unwrap();
            let canonical = registry.subscriptions.lock().unwrap().aliases
                [&(binding.worker_id.unwrap(), binding.id.clone())]
                .clone();
            assert_eq!(registry.namespace_of(&canonical), "orders");
            provider.stop_failure.store(failure, Ordering::SeqCst);
            assert!(
                registry
                    .unregister_subscriber(binding.worker_id.unwrap(), binding.id.clone(), None)
                    .await
                    .is_err()
            );
            assert!(!registry.triggers.contains_key(&canonical));
            assert_eq!(registry.namespace_of(&canonical), DEFAULT_NAMESPACE);
            assert!(registry.pending_triggers.contains_key(&canonical));
            assert!(
                registry.register_trigger(binding.clone()).await.is_err(),
                "retry cannot resurrect a tombstone"
            );
            registry
                .replay_shared_assignments(type_key("orders", "fixture"))
                .await;
            assert!(!registry.triggers.contains_key(&canonical));
            assert_eq!(provider.installs.load(Ordering::SeqCst), 1);
            provider.stop_failure.store(0, Ordering::SeqCst);
            assert!(
                registry
                    .unregister_subscriber(binding.worker_id.unwrap(), binding.id.clone(), None)
                    .await
                    .unwrap()
            );
            assert!(!registry.pending_triggers.contains_key(&canonical));
            assert!(!registry.has_assignment(&canonical));
            assert!(registry.subscriber_aliases(&canonical).is_empty());
            assert_eq!(provider.stops.load(Ordering::SeqCst), 2);
        }
    }

    #[tokio::test(start_paused = true)]
    async fn shared_trigger_parallel_router_pending_alias_removal_keeps_ack_reader_free() {
        use crate::{engine::Outbound, protocol::Message, worker_connections::WorkerConnection};

        crate::workers::observability::metrics::ensure_default_meter();
        let engine = crate::engine::Engine::new();
        engine.set_shared_namespace_ownership(true);
        let registry = &engine.trigger_registry;
        let (tx, mut rx) = tokio::sync::mpsc::channel(16);
        let worker = WorkerConnection::new(tx);
        engine.worker_registry.register_worker(worker.clone());
        engine
            .router_msg(
                &worker,
                &Message::RegisterTrigger {
                    assignment_id: None,
                    id: "pending-alias".into(),
                    trigger_type: "fixture".into(),
                    function_id: "orders::created".into(),
                    config: serde_json::json!({}),
                    metadata: None,
                    namespace: None,
                    trigger_namespace: None,
                },
            )
            .await
            .unwrap();
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(worker.id, "pending-alias".into())]
            .clone();
        assert!(registry.pending_triggers.contains_key(&canonical));
        assert!(!registry.has_assignment(&canonical));
        registry
            .register_trigger_type(
                TriggerType::new_ns(
                    DEFAULT_NAMESPACE,
                    "fixture",
                    "self-ACK regression",
                    Box::new(worker.clone()),
                    Some(worker.id),
                )
                .with_delivery_mode(TriggerDeliveryMode::Parallel)
                .with_delivery_contract(TriggerDeliveryContract::SharedV1),
            )
            .await
            .unwrap();

        let (reached, ready) = tokio::sync::oneshot::channel();
        let (resume, wait) = tokio::sync::oneshot::channel();
        *registry.removal_pause.lock().unwrap() = Some((reached, wait));
        let message = Message::UnregisterTrigger {
            assignment_id: None,
            id: "pending-alias".into(),
            trigger_type: Some("fixture".into()),
        };
        // This is the actual reader-facing router future, not a direct call to
        // unregister_subscriber. Pause removal after its no-lifecycle lookup.
        let dispatch = engine.router_msg(&worker, &message);
        tokio::pin!(dispatch);
        let mut reader_free = match futures::poll!(&mut dispatch) {
            std::task::Poll::Ready(result) => {
                result.unwrap();
                true
            }
            std::task::Poll::Pending => false,
        };
        ready.await.unwrap();
        let replay = registry.replay_shared_assignments(type_key(DEFAULT_NAMESPACE, "fixture"));
        tokio::pin!(replay);
        assert!(futures::poll!(&mut replay).is_pending());
        let Outbound::Protocol(Message::RegisterTrigger {
            id,
            trigger_type,
            function_id,
            assignment_id: Some(token),
            ..
        }) = rx
            .try_recv()
            .expect("replay enqueued installation to the same reader")
        else {
            panic!("expected identified installation");
        };
        assert_eq!(id, canonical);
        assert!(
            worker
                .pending_trigger_acks
                .contains_key(&format!("{token}:false"))
        );
        resume.send(()).unwrap();
        if !reader_free {
            reader_free = match futures::poll!(&mut dispatch) {
                std::task::Poll::Ready(result) => {
                    result.unwrap();
                    true
                }
                std::task::Poll::Pending => false,
            };
        }

        // Recover out of band only AFTER measuring dispatch. A real sequential
        // WS reader cannot route this ACK until that dispatch has returned.
        // No clock advance, sleep, or 10-second timeout makes the test finish.
        engine
            .router_msg(
                &worker,
                &Message::TriggerRegistrationResult {
                    assignment_id: Some(token.clone()),
                    id: id.clone(),
                    trigger_type: trigger_type.clone(),
                    function_id,
                    error: None,
                },
            )
            .await
            .unwrap();
        replay.await;
        if !reader_free {
            assert!(futures::poll!(&mut dispatch).is_pending());
        }
        let Outbound::Protocol(Message::UnregisterTrigger {
            id: stopped_id,
            assignment_id: Some(stopped_token),
            ..
        }) = rx.recv().await.expect("identified teardown")
        else {
            panic!("expected stop after recovered installation ACK");
        };
        assert_eq!((stopped_id, stopped_token), (id.clone(), token.clone()));
        engine
            .router_msg(
                &worker,
                &Message::UnregisterTriggerResult {
                    assignment_id: Some(token),
                    id,
                    trigger_type,
                    error: None,
                },
            )
            .await
            .unwrap();
        if !reader_free {
            dispatch.await.unwrap();
        }
        while !worker.assignment_tasks.is_empty() {
            tokio::task::yield_now().await;
        }
        assert!(worker.pending_trigger_acks.is_empty());
        assert!(!registry.has_assignment(&canonical));
        assert!(registry.subscriber_aliases(&canonical).is_empty());
        assert!(
            reader_free,
            "production router blocked its own ACK reader after a pending alias acquired its first replay lifecycle"
        );
    }

    #[tokio::test]
    async fn shared_trigger_parallel_pending_replay_reservation_races_final_removal() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let binding = assignment_binding();
        assert_eq!(
            registry.register_trigger(binding.clone()).await.unwrap(),
            RegisterTriggerOutcome::Deferred
        );
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        assert!(!registry.has_assignment(&canonical));
        let provider = assignment_fixture(&registry).await;
        let (remove_reached, mut remove_ready) = tokio::sync::oneshot::channel();
        let (remove_resume, remove_wait) = tokio::sync::oneshot::channel();
        *registry.removal_pause.lock().unwrap() = Some((remove_reached, remove_wait));
        let (replay_reached, mut replay_ready) = tokio::sync::oneshot::channel();
        let (replay_resume, replay_wait) = tokio::sync::oneshot::channel();
        *registry.replay_pause.lock().unwrap() = Some((replay_reached, replay_wait));
        let removal =
            registry.unregister_subscriber(binding.worker_id.unwrap(), binding.id.clone(), None);
        let replay = registry.replay_shared_assignments(type_key("orders", "fixture"));
        tokio::pin!(removal, replay);
        assert!(futures::poll!(&mut removal).is_pending());
        remove_ready.try_recv().unwrap();
        assert!(futures::poll!(&mut replay).is_pending());
        replay_ready.try_recv().unwrap();
        assert!(
            registry.has_assignment(&canonical),
            "production replay reserved its first lifecycle"
        );
        remove_resume.send(()).unwrap();
        assert!(removal.await.unwrap());
        assert!(registry.subscriber_aliases(&canonical).is_empty());
        replay_resume.send(()).unwrap();
        replay.await;
        assert_eq!(
            (
                provider.installs.load(Ordering::SeqCst),
                registry.triggers.contains_key(&canonical),
                registry.pending_triggers.contains_key(&canonical),
                registry.has_assignment(&canonical)
            ),
            (0, false, false, false),
            "production pending replay must not outlive final subscriber removal"
        );
    }

    #[tokio::test]
    async fn shared_trigger_parallel_pending_removal_before_replay_leaves_no_lifecycle() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let binding = assignment_binding();
        assert_eq!(
            registry.register_trigger(binding.clone()).await.unwrap(),
            RegisterTriggerOutcome::Deferred
        );
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        let provider = assignment_fixture(&registry).await;
        assert!(
            registry
                .unregister_subscriber(binding.worker_id.unwrap(), binding.id.clone(), None)
                .await
                .unwrap()
        );
        registry
            .replay_shared_assignments(type_key("orders", "fixture"))
            .await;
        assert_eq!(provider.installs.load(Ordering::SeqCst), 0);
        assert!(!registry.has_assignment(&canonical));
        assert!(!registry.triggers.contains_key(&canonical));
        assert!(!registry.pending_triggers.contains_key(&canonical));
        assert!(registry.subscriber_aliases(&canonical).is_empty());
    }

    #[tokio::test]
    async fn shared_trigger_parallel_stale_lifecycle_cannot_damage_reregistered_id() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let provider = assignment_fixture(&registry).await;
        let mut binding = assignment_binding();
        binding.worker_id = None; // Durable bindings intentionally reuse public IDs.
        registry.register_trigger(binding.clone()).await.unwrap();
        let old_trigger = registry.triggers.get(&binding.id).unwrap().value().clone();
        let old = registry
            .assignments
            .get(&binding.id)
            .unwrap()
            .value()
            .clone();
        let guard = old.operation.lock().await;
        let first = registry.revoke_assignments(&binding.id, old.clone());
        let stale = registry.revoke_assignments(&binding.id, old.clone());
        tokio::pin!(first, stale);
        assert!(futures::poll!(&mut first).is_pending());
        assert!(futures::poll!(&mut stale).is_pending());
        drop(guard);
        assert!(first.await.unwrap());
        assert_eq!(
            registry.register_trigger(binding.clone()).await.unwrap(),
            RegisterTriggerOutcome::Registered
        );
        let current = registry
            .assignments
            .get(&binding.id)
            .unwrap()
            .value()
            .clone();
        assert!(!Arc::ptr_eq(&old, &current));
        assert!(
            !stale.await.unwrap(),
            "queued stale teardown must not stop the replacement"
        );
        assert!(
            !registry
                .revoke_assignments(&binding.id, old.clone())
                .await
                .unwrap()
        );
        assert!(
            registry
                .install_assignment_lifecycle(old_trigger.clone(), old.clone())
                .await
                .is_err()
        );
        registry.publish_assignments(&old_trigger, &old);
        assert!(registry.current_assignment(&binding.id, &current));
        assert!(registry.triggers.contains_key(&binding.id));
        assert!(!registry.pending_triggers.contains_key(&binding.id));
        assert_eq!(provider.installs.load(Ordering::SeqCst), 2);
        assert_eq!(provider.stops.load(Ordering::SeqCst), 1);
        assert_eq!(
            current
                .copies
                .lock()
                .unwrap()
                .values()
                .filter(|copy| copy.2)
                .count(),
            1
        );
        assert!(
            registry
                .unregister_trigger(binding.id.clone(), None)
                .await
                .unwrap()
        );
        assert_eq!(provider.stops.load(Ordering::SeqCst), 2);
    }

    #[tokio::test]
    async fn shared_trigger_parallel_stale_replay_after_final_subscriber_removal() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let a = assignment_fixture(&registry).await;
        let b = assignment_fixture(&registry).await;
        let binding = assignment_binding();
        assert_eq!(
            registry.register_trigger(binding.clone()).await.unwrap(),
            RegisterTriggerOutcome::Registered
        );
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();

        // Pause replay at its snapshot/install boundary, before it acquires an
        // AssignmentSet. No task scheduling or timeout determines this ordering.
        let stale_replay = registry.triggers.get(&canonical).unwrap().value().clone();
        assert_eq!(a.installs.load(Ordering::SeqCst), 1);
        assert_eq!(b.installs.load(Ordering::SeqCst), 1);
        assert!(
            registry
                .unregister_subscriber(binding.worker_id.unwrap(), binding.id.clone(), None)
                .await
                .unwrap()
        );
        assert!(registry.subscriber_aliases(&canonical).is_empty());
        assert!(
            !registry
                .subscriptions
                .lock()
                .unwrap()
                .intents
                .contains_key(&canonical)
        );
        assert!(!registry.triggers.contains_key(&canonical));
        assert!(!registry.pending_triggers.contains_key(&canonical));
        assert_eq!(a.stops.load(Ordering::SeqCst), 1);
        assert_eq!(b.stops.load(Ordering::SeqCst), 1);

        // Resume exactly the helper called by replay_shared_assignments. Final
        // teardown has completed, so an old state's tombstone alone cannot fence
        // a replacement AssignmentSet created from this stale logical binding.
        let _ = registry.install_assignments(stale_replay).await;
        assert_eq!(
            (
                a.installs.load(Ordering::SeqCst),
                b.installs.load(Ordering::SeqCst),
                registry.triggers.contains_key(&canonical),
                registry.pending_triggers.contains_key(&canonical),
            ),
            (1, 1, false, false),
            "stale replay must not reinstall or republish a removed logical binding"
        );
        assert!(registry.subscriber_aliases(&canonical).is_empty());
    }

    #[tokio::test]
    async fn shared_trigger_parallel_claimed_pending_recovery_uses_identified_fanout() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let a = assignment_fixture(&registry).await;
        let b = assignment_fixture(&registry).await;
        let binding = assignment_binding();
        // Deterministically exercise the same claimed pending helper used when
        // a provider appears between the initial lookup and post-park recheck.
        registry
            .pending_triggers
            .insert(binding.id.clone(), binding.clone());
        let (_, claimed) = registry.pending_triggers.remove(&binding.id).unwrap();
        let provider = registry
            .trigger_types
            .get(&type_key("orders", "fixture"))
            .unwrap()
            .value()
            .clone();
        assert!(registry.activate_pending_trigger(&provider, claimed).await);
        assert_eq!(a.installs.load(Ordering::SeqCst), 1);
        assert_eq!(b.installs.load(Ordering::SeqCst), 1);
        assert!(registry.triggers.contains_key(&binding.id));
        assert!(!registry.pending_triggers.contains_key(&binding.id));
    }

    // KAN-321: only tests; registrator completion is the explicit stop barrier.
    #[derive(Default)]
    struct SingleActiveFixture {
        installs: AtomicUsize,
        stops: AtomicUsize,
        stop_gate: tokio::sync::Notify,
        reject_stop: std::sync::atomic::AtomicBool,
    }

    impl TriggerRegistrator for Arc<SingleActiveFixture> {
        fn register_trigger(
            &self,
            _: Trigger,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            self.installs.fetch_add(1, Ordering::SeqCst);
            Box::pin(async { Ok(()) })
        }
        fn unregister_trigger(
            &self,
            _: Trigger,
        ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
            self.stops.fetch_add(1, Ordering::SeqCst);
            Box::pin(async move {
                self.stop_gate.notified().await;
                if self.reject_stop.load(Ordering::SeqCst) {
                    anyhow::bail!("stop acknowledgement timed out");
                }
                Ok(())
            })
        }
    }

    async fn single_active_provider(
        registry: &TriggerRegistry,
        namespace: &str,
        id: Uuid,
        fixture: Arc<SingleActiveFixture>,
        fenced: bool,
    ) {
        let mut provider = TriggerType::new_ns(
            namespace,
            "fixture",
            "single active regression",
            Box::new(fixture),
            Some(id),
        );
        if fenced {
            provider = provider.with_delivery_contract(TriggerDeliveryContract::SharedV1);
        }
        registry.register_trigger_type(provider).await.unwrap();
    }

    #[tokio::test]
    async fn shared_trigger_single_active_initial_selection_is_cyclic_and_assignment_sticky() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let a = Arc::new(SingleActiveFixture::default());
        let b = Arc::new(SingleActiveFixture::default());
        single_active_provider(&registry, "orders", Uuid::from_u128(1), a.clone(), true).await;
        single_active_provider(&registry, "orders", Uuid::from_u128(2), b.clone(), true).await;
        let first = assignment_binding();
        let mut second = first.clone();
        second.id = "second".into();
        second.config = serde_json::json!({"tick": 2});
        for binding in [&first, &second] {
            assert_eq!(
                registry.register_trigger(binding.clone()).await.unwrap(),
                RegisterTriggerOutcome::Registered
            );
        }
        assert_eq!(
            (
                a.installs.load(Ordering::SeqCst),
                b.installs.load(Ordering::SeqCst)
            ),
            (1, 1),
            "distinct logical bindings must select successive providers, not always the first owner"
        );
        registry.register_trigger(first).await.unwrap();
        registry.register_trigger(second).await.unwrap();
        registry
            .replay_shared_assignments(type_key("orders", "fixture"))
            .await;
        assert_eq!(
            (
                a.installs.load(Ordering::SeqCst),
                b.installs.load(Ordering::SeqCst)
            ),
            (1, 1),
            "retry/replay cannot rotate a sticky acknowledged assignment"
        );
    }

    #[tokio::test]
    async fn shared_trigger_single_active_live_rehome_waits_positive_stop() {
        single_active_rehome_stop_case(false).await;
    }

    #[tokio::test]
    async fn shared_trigger_single_active_live_rehome_stop_timeout_parks() {
        single_active_rehome_stop_case(true).await;
    }

    async fn single_active_rehome_stop_case(timeout: bool) {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let old = Arc::new(SingleActiveFixture::default());
        let home = Arc::new(SingleActiveFixture::default());
        old.reject_stop.store(timeout, Ordering::SeqCst);
        single_active_provider(
            &registry,
            DEFAULT_NAMESPACE,
            Uuid::from_u128(1),
            old.clone(),
            true,
        )
        .await;
        let binding = assignment_binding();
        registry.register_trigger(binding.clone()).await.unwrap();
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        let moving =
            single_active_provider(&registry, "orders", Uuid::from_u128(2), home.clone(), true);
        tokio::pin!(moving);
        let pending = futures::poll!(&mut moving).is_pending();
        assert_eq!(
            old.stops.load(Ordering::SeqCst),
            1,
            "live fallback rehome must request stop of its previous assignment"
        );
        assert!(
            pending,
            "home installation must wait for a positive stop acknowledgement"
        );
        assert!(
            !registry.triggers.contains_key(&canonical),
            "revoke firing before stop I/O"
        );
        assert_eq!(home.installs.load(Ordering::SeqCst), 0);
        old.stop_gate.notify_one();
        moving.await;
        assert_eq!(
            home.installs.load(Ordering::SeqCst),
            usize::from(!timeout),
            "a stop timeout cannot authorize a live handover"
        );
        assert_eq!(registry.triggers.contains_key(&canonical), !timeout);
        if timeout {
            assert!(
                registry.pending_triggers.contains_key(&canonical),
                "retain uncertain teardown debt without unsafe double-active assignment"
            );
        }
    }

    #[tokio::test]
    async fn shared_trigger_single_active_observed_disconnect_reassigns_fenced_owner() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let a = Arc::new(SingleActiveFixture::default());
        let b = Arc::new(SingleActiveFixture::default());
        let owner = Uuid::from_u128(1);
        single_active_provider(&registry, "orders", owner, a.clone(), true).await;
        single_active_provider(&registry, "orders", Uuid::from_u128(2), b.clone(), true).await;
        let binding = assignment_binding();
        registry.register_trigger(binding.clone()).await.unwrap();
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        registry.unregister_worker(&owner).await;
        assert_eq!(
            b.installs.load(Ordering::SeqCst),
            1,
            "observed disconnected shared_v1 owner must be revoked and replaced by the surviving provider"
        );
        assert!(registry.triggers.contains_key(&canonical));
        assert_eq!(
            a.stops.load(Ordering::SeqCst),
            0,
            "a disconnected socket cannot supply a stop acknowledgement"
        );
    }

    #[tokio::test]
    async fn shared_trigger_single_active_ambiguous_legacy_loss_stays_parked() {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let old = Arc::new(SingleActiveFixture::default());
        let replacement = Arc::new(SingleActiveFixture::default());
        let owner = Uuid::from_u128(1);
        single_active_provider(&registry, "orders", owner, old.clone(), false).await;
        let binding = assignment_binding();
        registry.register_trigger(binding.clone()).await.unwrap();
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        registry.unregister_worker(&owner).await;
        single_active_provider(
            &registry,
            "orders",
            Uuid::from_u128(2),
            replacement.clone(),
            false,
        )
        .await;
        assert_eq!(
            replacement.installs.load(Ordering::SeqCst),
            0,
            "an unfenced disconnected legacy owner may still execute work: a replacement announcement cannot authorize handover"
        );
        assert!(!registry.triggers.contains_key(&canonical));
        assert!(registry.pending_triggers.contains_key(&canonical));
    }

    #[tokio::test]
    async fn shared_trigger_single_active_live_legacy_fallback_shared_v1_replay_stays_parked() {
        single_active_legacy_to_shared_replay(false).await;
    }

    #[tokio::test]
    async fn shared_trigger_single_active_ambiguous_legacy_loss_shared_v1_replay_stays_parked() {
        single_active_legacy_to_shared_replay(true).await;
    }

    async fn single_active_legacy_to_shared_replay(disconnected: bool) {
        let registry = TriggerRegistry::new();
        registry.set_shared_namespace_ownership(true);
        let legacy = Arc::new(SingleActiveFixture::default());
        let home = Arc::new(SingleActiveFixture::default());
        let old_owner = Uuid::from_u128(101);
        let old_namespace = if disconnected {
            "orders"
        } else {
            DEFAULT_NAMESPACE
        };
        single_active_provider(&registry, old_namespace, old_owner, legacy.clone(), false).await;
        let binding = assignment_binding();
        assert_eq!(
            registry.register_trigger(binding.clone()).await.unwrap(),
            RegisterTriggerOutcome::Registered
        );
        let canonical = registry.subscriptions.lock().unwrap().aliases
            [&(binding.worker_id.unwrap(), binding.id.clone())]
            .clone();
        assert_eq!(legacy.installs.load(Ordering::SeqCst), 1);
        assert!(
            !registry.has_assignment(&canonical),
            "legacy installation has no fencing lifecycle"
        );
        if disconnected {
            registry.unregister_worker(&old_owner).await;
        }
        single_active_provider(
            &registry,
            "orders",
            Uuid::from_u128(102),
            home.clone(),
            true,
        )
        .await;
        assert_eq!(
            home.installs.load(Ordering::SeqCst),
            0,
            "declaration alone must not transfer legacy work"
        );
        assert_eq!(
            legacy.stops.load(Ordering::SeqCst),
            0,
            "no positive legacy stop acknowledgement was supplied"
        );
        // This is also the production WS declaration replay path. Its pending
        // scan must not undo the uncertainty recorded by rehome or disconnect.
        for _ in 0..2 {
            registry
                .replay_shared_assignments(type_key("orders", "fixture"))
                .await;
            assert_eq!(
                home.installs.load(Ordering::SeqCst),
                0,
                "shared_v1 replay installed a replacement without resolving legacy execution uncertainty; disconnected={disconnected}"
            );
            assert!(!registry.triggers.contains_key(&canonical));
            assert!(registry.pending_triggers.contains_key(&canonical));
            assert!(
                !registry.has_assignment(&canonical),
                "replay must not manufacture a fenced lifecycle for uncertain legacy work"
            );
        }
        assert_eq!(
            registry.register_trigger(binding).await.unwrap(),
            RegisterTriggerOutcome::Deferred,
            "subscriber retry cannot bypass the same legacy fence"
        );
        assert_eq!(home.installs.load(Ordering::SeqCst), 0);
    }

    // KAN-321 regression: a lost install ACK is not proof that legacy work stopped.
    #[tokio::test]
    async fn shared_trigger_single_active_legacy_ack_timeout_then_home_announcement_stays_parked() {
        #[derive(Default)]
        struct LegacyAckTimeout {
            installs: AtomicUsize,
            stops: AtomicUsize,
            release_ack_timeout: tokio::sync::Notify,
        }

        impl TriggerRegistrator for Arc<LegacyAckTimeout> {
            fn register_trigger(
                &self,
                _: Trigger,
            ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
                Box::pin(async move {
                    // The adapter starts local work, but its positive ACK is lost.
                    self.installs.fetch_add(1, Ordering::SeqCst);
                    self.release_ack_timeout.notified().await;
                    Err(anyhow::Error::new(RegistratorUnavailable))
                })
            }

            fn unregister_trigger(
                &self,
                _: Trigger,
            ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
                self.stops.fetch_add(1, Ordering::SeqCst);
                Box::pin(async { Ok(()) })
            }
        }

        let mut unsafe_handovers = Vec::new();
        for disconnected in [false, true] {
            let registry = TriggerRegistry::new();
            registry.set_shared_namespace_ownership(true);
            let legacy = Arc::new(LegacyAckTimeout::default());
            let home = Arc::new(SingleActiveFixture::default());
            let legacy_owner = Uuid::from_u128(301);
            registry
                .register_trigger_type(TriggerType::new_ns(
                    if disconnected {
                        "orders"
                    } else {
                        DEFAULT_NAMESPACE
                    },
                    "fixture",
                    "legacy install ACK timeout",
                    Box::new(legacy.clone()),
                    Some(legacy_owner),
                ))
                .await
                .unwrap();
            let mut binding = assignment_binding();
            binding.worker_id = Some(Uuid::from_u128(303));
            let registration = registry.register_trigger(binding.clone());
            tokio::pin!(registration);
            assert!(futures::poll!(&mut registration).is_pending());
            assert_eq!(legacy.installs.load(Ordering::SeqCst), 1);
            let canonical = registry.subscriptions.lock().unwrap().aliases
                [&(binding.worker_id.unwrap(), binding.id.clone())]
                .clone();
            assert!(registry.legacy_installs.contains_key(&canonical));
            // Explicit completion barrier: timeout happens BEFORE disconnect or
            // home declaration, rather than while the legacy reservation exists.
            legacy.release_ack_timeout.notify_one();
            assert_eq!(
                registration.await.unwrap(),
                RegisterTriggerOutcome::Deferred
            );
            assert!(!registry.legacy_installs.contains_key(&canonical));
            assert!(!registry.has_assignment(&canonical));
            assert!(!registry.triggers.contains_key(&canonical));
            assert!(registry.pending_triggers.contains_key(&canonical));
            if disconnected {
                registry.unregister_worker(&legacy_owner).await;
                assert!(
                    !registry
                        .trigger_types
                        .contains_key(&type_key("orders", "fixture"))
                );
            } else {
                assert!(
                    registry
                        .trigger_types
                        .contains_key(&type_key(DEFAULT_NAMESPACE, "fixture"))
                );
            }
            single_active_provider(
                &registry,
                "orders",
                Uuid::from_u128(302),
                home.clone(),
                true,
            )
            .await;
            // Await the complete production replay, not an absence/quiet-time
            // window. The legacy adapter is still running in BOTH scenarios:
            // a lost install ACK or socket loss cannot supply a positive stop.
            registry
                .replay_shared_assignments(type_key("orders", "fixture"))
                .await;
            assert_eq!(legacy.stops.load(Ordering::SeqCst), 0);
            if home.installs.load(Ordering::SeqCst) != 0
                || registry.has_assignment(&canonical)
                || registry.triggers.contains_key(&canonical)
                || !registry.pending_triggers.contains_key(&canonical)
            {
                unsafe_handovers.push((
                    disconnected,
                    home.installs.load(Ordering::SeqCst),
                    registry.has_assignment(&canonical),
                    registry.triggers.contains_key(&canonical),
                    registry.pending_triggers.contains_key(&canonical),
                ));
            }
        }
        assert!(
            unsafe_handovers.is_empty(),
            "lost legacy install ACK cannot authorize shared_v1 replay without positive stop; (disconnected, installs, lifecycle, live, pending)={unsafe_handovers:?}"
        );
    }

    #[tokio::test]
    async fn shared_namespace_legacy_observation_correlates_session_descriptor_and_generation() {
        use crate::{
            engine::{Engine, Outbound},
            protocol::Message,
            worker_connections::WorkerConnection,
        };
        crate::workers::observability::metrics::ensure_default_meter();
        let engine = Arc::new(Engine::new());
        engine.set_shared_namespace_ownership(true);
        let (tx, mut rx) = tokio::sync::mpsc::channel(16);
        let worker = WorkerConnection::new(tx);
        engine.worker_registry.register_worker(worker.clone());
        engine
            .trigger_registry
            .register_trigger_type(TriggerType::new(
                "legacy-observed",
                "observation fixture",
                Box::new(worker.clone()),
                Some(worker.id),
            ))
            .await
            .unwrap();
        let binding = make_trigger("observation-generation", "legacy-observed");
        let registry = &engine.trigger_registry;
        let registration = registry.register_trigger(binding.clone());
        tokio::pin!(registration);
        assert!(futures::poll!(&mut registration).is_pending());
        assert!(matches!(
            rx.try_recv().unwrap(),
            Outbound::Protocol(Message::RegisterTrigger {
                assignment_id: None,
                ..
            })
        ));
        let active = || registry.ownership_snapshot(&binding, |_| true).2;
        assert_eq!(active(), 0);
        registry.observe_legacy_ack(
            Uuid::new_v4(),
            &binding.id,
            &binding.trigger_type,
            &binding.function_id,
            true,
        );
        registry.observe_legacy_ack(
            worker.id,
            &binding.id,
            "wrong-kind",
            &binding.function_id,
            true,
        );
        registry.observe_legacy_ack(
            worker.id,
            &binding.id,
            &binding.trigger_type,
            "wrong-function",
            true,
        );
        let observation = registry.legacy_observations.lock().unwrap();
        assert!(
            !observation[&(worker.id, binding.id.clone())]
                .as_ref()
                .unwrap()
                .acknowledged
                .load(Ordering::SeqCst)
        );
        drop(observation);
        let ack = Message::TriggerRegistrationResult {
            assignment_id: None,
            id: binding.id.clone(),
            trigger_type: binding.trigger_type.clone(),
            function_id: binding.function_id.clone(),
            error: None,
        };
        engine.router_msg(&worker, &ack).await.unwrap();
        registration.await.unwrap();
        assert_eq!(active(), 1);

        // Replacing the published immutable registration, even with identical
        // fields, invalidates the observation rather than carrying its ACK over.
        registry
            .triggers
            .insert(binding.id.clone(), binding.clone());
        assert_eq!(active(), 0);
        engine.router_msg(&worker, &ack).await.unwrap();
        assert_eq!(active(), 0, "old ACK cannot attach to a replacement Arc");
        registry
            .unregister_trigger(binding.id.clone(), None)
            .await
            .unwrap();
        assert!(matches!(
            rx.try_recv().unwrap(),
            Outbound::Protocol(Message::UnregisterTrigger { .. })
        ));
        assert_eq!(active(), 0);

        let successor = registry.register_trigger(binding.clone());
        tokio::pin!(successor);
        assert!(futures::poll!(&mut successor).is_pending());
        rx.try_recv().unwrap();
        engine.router_msg(&worker, &ack).await.unwrap();
        successor.await.unwrap();
        assert_eq!(
            active(),
            0,
            "legacy wire has no generation: reused session/id ACK is ambiguous"
        );
        registry.unregister_worker(&worker.id).await;
        assert!(
            !registry
                .legacy_observations
                .lock()
                .unwrap()
                .keys()
                .any(|(owner, _)| *owner == worker.id)
        );
    }

    fn make_trigger(id: &str, trigger_type: &str) -> Trigger {
        Trigger {
            id: id.to_string(),
            trigger_type: trigger_type.to_string(),
            function_id: format!("fn_{}", id),
            config: serde_json::json!({}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        }
    }

    fn target_fields(targets: Vec<Arc<Trigger>>) -> Vec<(String, String, Option<Value>)> {
        targets
            .iter()
            .map(|trigger| {
                (
                    trigger.function_id.clone(),
                    trigger.namespace.clone(),
                    trigger.metadata.clone(),
                )
            })
            .collect()
    }

    #[test]
    fn trigger_store_replacement_updates_type_namespace_and_metadata() {
        let store = TriggerStore::new();
        store.insert("other".into(), make_trigger("other", "unrelated"));
        store.insert("binding".into(), make_trigger("binding", "first"));

        let mut replacement = make_trigger("binding", "first");
        replacement.namespace = "billing".into();
        replacement.function_id = "orders::changed".into();
        replacement.metadata = Some(serde_json::json!({ "revision": 2 }));
        store.insert(replacement.id.clone(), replacement.clone());
        let expected = vec![(
            replacement.function_id.clone(),
            replacement.namespace.clone(),
            replacement.metadata.clone(),
        )];
        assert_eq!(target_fields(store.targets_for_type("first")), expected);

        replacement.trigger_type = "second".into();
        store.insert(replacement.id.clone(), replacement);
        assert!(store.targets_for_type("first").is_empty());
        assert_eq!(target_fields(store.targets_for_type("second")), expected);
        assert_eq!(store.targets_for_type("unrelated").len(), 1);

        store.remove("binding");
        assert!(store.targets_for_type("second").is_empty());
        assert_eq!(store.targets_for_type("unrelated").len(), 1);
    }

    #[test]
    fn trigger_store_shares_metadata_and_moves_it_out_on_removal() {
        let store = TriggerStore::new();
        let mut trigger = make_trigger("binding", "event");
        trigger.metadata = Some(serde_json::json!({ "payload": "x".repeat(4096) }));
        let payload_pointer = trigger.metadata.as_ref().unwrap()["payload"]
            .as_str()
            .unwrap()
            .as_ptr();
        store.insert(trigger.id.clone(), trigger);

        let weak = {
            let by_id = store.by_id.get("binding").unwrap();
            let by_type = store.by_type.get("event").unwrap();
            assert!(Arc::ptr_eq(by_id.value(), &by_type["binding"]));
            Arc::downgrade(by_id.value())
        };
        {
            let entry = store.iter().next().unwrap();
            assert_eq!(entry.key(), "binding");
            assert_eq!(
                entry.value().metadata.as_ref().unwrap()["payload"]
                    .as_str()
                    .unwrap()
                    .as_ptr(),
                payload_pointer,
            );
        }

        let (_, removed) = store.remove("binding").unwrap();
        assert_eq!(
            removed.metadata.as_ref().unwrap()["payload"]
                .as_str()
                .unwrap()
                .as_ptr(),
            payload_pointer,
            "removal must return the original metadata allocation",
        );
        assert!(weak.upgrade().is_none());
        assert!(store.targets_for_type("event").is_empty());
    }

    #[test]
    fn trigger_store_replacement_releases_the_previous_index_owner() {
        let store = TriggerStore::new();
        store.insert("binding".into(), make_trigger("binding", "event"));

        // Cover replacement both within a type and across types.
        for trigger_type in ["event", "other"] {
            let previous = {
                let entry = store.by_id.get("binding").unwrap();
                Arc::downgrade(entry.value())
            };
            let replacement = make_trigger("binding", trigger_type);
            let removed = store.insert("binding".into(), replacement).unwrap();
            assert_eq!(removed.id, "binding");
            assert!(
                previous.upgrade().is_none(),
                "the type index must release the replaced trigger",
            );
            assert_eq!(store.targets_for_type(trigger_type).len(), 1);
        }
        assert!(store.targets_for_type("event").is_empty());
    }

    #[test]
    fn trigger_dispatch_snapshot_survives_replacement_and_removal() {
        let store = TriggerStore::new();
        let mut trigger = make_trigger("binding", "event");
        trigger.namespace = "orders".into();
        trigger.metadata = Some(serde_json::json!({ "revision": 1 }));
        store.insert(trigger.id.clone(), trigger);

        let snapshot = store.targets_for_type("event");
        assert_eq!(snapshot.len(), 1);
        assert!(Arc::ptr_eq(
            &snapshot[0],
            store.by_id.get("binding").unwrap().value(),
        ));
        let previous = Arc::downgrade(&snapshot[0]);

        let mut replacement = make_trigger("binding", "other");
        replacement.namespace = "billing".into();
        replacement.metadata = Some(serde_json::json!({ "revision": 2 }));
        store.insert(replacement.id.clone(), replacement);
        store.remove("binding");

        assert!(store.is_empty());
        assert!(store.targets_for_type("event").is_empty());
        assert!(store.targets_for_type("other").is_empty());
        assert_eq!(snapshot[0].function_id, "fn_binding");
        assert_eq!(snapshot[0].namespace, "orders");
        assert_eq!(
            snapshot[0].metadata,
            Some(serde_json::json!({ "revision": 1 }))
        );
        drop(snapshot);
        assert!(previous.upgrade().is_none());
    }

    #[test]
    fn trigger_dispatch_snapshot_keeps_members_during_same_type_updates() {
        let store = TriggerStore::new();
        store.insert("first".into(), make_trigger("first", "event"));
        store.insert("second".into(), make_trigger("second", "event"));
        let snapshot = store.targets_for_type("event");
        let previous = Arc::downgrade(
            snapshot
                .iter()
                .find(|trigger| trigger.id == "first")
                .unwrap(),
        );

        store.insert("third".into(), make_trigger("third", "event"));
        store.remove("first");

        let current = store.targets_for_type("event");
        assert_eq!(snapshot.len(), 2);
        assert!(snapshot.iter().any(|trigger| trigger.id == "first"));
        assert!(!snapshot.iter().any(|trigger| trigger.id == "third"));
        assert_eq!(current.len(), 2);
        assert!(!current.iter().any(|trigger| trigger.id == "first"));
        assert!(current.iter().any(|trigger| trigger.id == "third"));
        assert!(Arc::ptr_eq(
            snapshot
                .iter()
                .find(|trigger| trigger.id == "second")
                .unwrap(),
            current
                .iter()
                .find(|trigger| trigger.id == "second")
                .unwrap(),
        ));
        drop(snapshot);
        assert!(previous.upgrade().is_none());
    }

    #[test]
    fn trigger_store_stale_owner_cleanup_keeps_replacement_indexed() {
        let store = TriggerStore::new();
        let previous_owner = Uuid::new_v4();
        let owner = Uuid::new_v4();
        let mut trigger = make_trigger("binding", "event");
        trigger.worker_id = Some(previous_owner);
        store.insert(trigger.id.clone(), trigger.clone());
        trigger.worker_id = Some(owner);
        store.insert(trigger.id.clone(), trigger);

        assert!(
            store
                .remove_if("binding", |_, t| t.worker_id == Some(previous_owner))
                .is_none()
        );
        assert_eq!(store.targets_for_type("event").len(), 1);
        assert!(
            store
                .remove_if("binding", |_, t| t.worker_id == Some(owner))
                .is_some()
        );
        assert!(store.targets_for_type("event").is_empty());
    }

    #[test]
    fn trigger_store_concurrent_replacement_and_removal_leave_no_stale_targets() {
        let store = TriggerStore::new();
        let barrier = std::sync::Barrier::new(2);
        std::thread::scope(|scope| {
            for offset in 0..2 {
                let store = &store;
                let barrier = &barrier;
                scope.spawn(move || {
                    barrier.wait();
                    for index in 0..128 {
                        let trigger_type = if (index + offset) % 2 == 0 {
                            "first"
                        } else {
                            "second"
                        };
                        store.insert("binding".into(), make_trigger("binding", trigger_type));
                        if index % 3 == 0 {
                            store.remove("binding");
                        }
                    }
                });
            }
        });
        store.remove("binding");
        assert!(store.is_empty());
        assert!(store.targets_for_type("first").is_empty());
        assert!(store.targets_for_type("second").is_empty());
    }

    #[tokio::test]
    async fn trigger_index_tracks_pending_rehome_failover_and_unregister() {
        let registry = TriggerRegistry::new();
        let fallback_worker = Uuid::new_v4();
        let home_worker = Uuid::new_v4();
        let mut trigger = resolved_trigger("binding", "event", "shop");
        trigger.namespace = "billing".into();
        trigger.metadata = Some(serde_json::json!({ "source": "shop" }));
        let expected = vec![(
            trigger.function_id.clone(),
            trigger.namespace.clone(),
            trigger.metadata.clone(),
        )];

        registry.register_trigger(trigger).await.unwrap();
        assert!(registry.triggers.targets_for_type("event").is_empty());

        let mut fallback = make_trigger_type_ns(DEFAULT_NAMESPACE, "event");
        fallback.worker_id = Some(fallback_worker);
        registry.register_trigger_type(fallback).await.unwrap();
        assert_eq!(
            target_fields(registry.triggers.targets_for_type("event")),
            expected
        );

        let mut home = make_trigger_type_ns("shop", "event");
        home.worker_id = Some(home_worker);
        registry.register_trigger_type(home).await.unwrap();
        assert_eq!(
            target_fields(registry.triggers.targets_for_type("event")),
            expected
        );
        assert_eq!(
            registry.triggers.get("binding").unwrap().provider_namespace,
            "shop"
        );

        registry.unregister_worker(&home_worker).await;
        assert_eq!(
            target_fields(registry.triggers.targets_for_type("event")),
            expected
        );
        assert_eq!(
            registry.triggers.get("binding").unwrap().provider_namespace,
            DEFAULT_NAMESPACE
        );

        registry.unregister_worker(&fallback_worker).await;
        assert!(registry.triggers.targets_for_type("event").is_empty());
        assert!(registry.pending_triggers.contains_key("binding"));

        registry
            .register_trigger_type(make_trigger_type_ns(DEFAULT_NAMESPACE, "event"))
            .await
            .unwrap();
        assert_eq!(
            target_fields(registry.triggers.targets_for_type("event")),
            expected
        );
        registry
            .unregister_trigger("binding".into(), None)
            .await
            .unwrap();
        assert!(registry.triggers.targets_for_type("event").is_empty());
    }

    #[tokio::test]
    async fn trigger_index_excludes_rejected_bindings_until_provider_replacement() {
        let registry = TriggerRegistry::new();
        let worker = Uuid::new_v4();
        let mut provider = make_trigger_type_ns(DEFAULT_NAMESPACE, "event");
        provider.worker_id = Some(worker);
        registry.register_trigger_type(provider).await.unwrap();
        registry
            .register_trigger(make_trigger("binding", "event"))
            .await
            .unwrap();

        registry.park_rejected_trigger("binding", worker).await;
        assert!(registry.triggers.targets_for_type("event").is_empty());
        assert!(registry.pending_triggers.contains_key("binding"));

        registry
            .register_trigger_type(make_trigger_type_ns(DEFAULT_NAMESPACE, "event"))
            .await
            .unwrap();
        assert_eq!(
            target_fields(registry.triggers.targets_for_type("event")),
            vec![("fn_binding".into(), DEFAULT_NAMESPACE.into(), None)]
        );
    }

    /// A binding as a worker at `home` would register it: the provider is
    /// resolved, not named.
    fn resolved_trigger(id: &str, trigger_type: &str, home: &str) -> Trigger {
        Trigger {
            home_namespace: home.to_string(),
            ..make_trigger(id, trigger_type)
        }
    }

    /// A binding that names its provider's namespace: strict, no fallback.
    fn explicit_trigger(id: &str, trigger_type: &str, home: &str, provider: &str) -> Trigger {
        Trigger {
            home_namespace: home.to_string(),
            trigger_namespace: Some(provider.to_string()),
            ..make_trigger(id, trigger_type)
        }
    }

    fn make_trigger_type_ns(namespace: &str, id: &str) -> TriggerType {
        TriggerType::new_ns(
            namespace,
            id,
            format!("Test trigger type {} in {}", id, namespace),
            Box::new(MockRegistrator::new()),
            None,
        )
    }

    // ── The four resolutions ─────────────────────────────────────────────
    //
    // A binding names two namespaces, and they answer different questions:
    // where the provider is, and where the target function is. These four
    // cover every combination of "at home" and "somewhere else".

    #[tokio::test]
    async fn a_provider_at_home_serves_its_own_namespace() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type_ns("shop", "webhook"))
            .await
            .unwrap();

        let trigger = resolved_trigger("t1", "webhook", "shop");
        assert_eq!(
            registry.register_trigger(trigger).await.unwrap(),
            RegisterTriggerOutcome::Registered
        );

        let stored = registry.triggers.get("t1").unwrap();
        assert_eq!(stored.provider_namespace, "shop");
        assert!(!stored.is_on_fallback());
    }

    #[tokio::test]
    async fn a_worker_with_no_provider_at_home_falls_back_to_default() {
        // The migration case: the engine's providers live in `default`, and a
        // worker in another namespace reaches them without saying anything.
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();

        let trigger = resolved_trigger("t1", "cron", "shop");
        assert_eq!(
            registry.register_trigger(trigger).await.unwrap(),
            RegisterTriggerOutcome::Registered
        );

        let stored = registry.triggers.get("t1").unwrap();
        assert_eq!(stored.provider_namespace, DEFAULT_NAMESPACE);
        assert!(stored.is_on_fallback(), "it is only borrowing the engine's");
    }

    #[tokio::test]
    async fn home_wins_over_the_fallback_when_both_exist() {
        // Both providers are up before the bind. The project's own is the one
        // that should serve it — that is what makes shipping a replacement for
        // a built-in type possible at all.
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("state"))
            .await
            .unwrap();
        registry
            .register_trigger_type(make_trigger_type_ns("shop", "state"))
            .await
            .unwrap();

        registry
            .register_trigger(resolved_trigger("t1", "state", "shop"))
            .await
            .unwrap();

        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            "shop"
        );
        // And both providers are still there: one did not replace the other.
        assert_eq!(registry.trigger_types.len(), 2);
    }

    #[tokio::test]
    async fn naming_a_namespace_takes_that_one_and_no_other() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();
        registry
            .register_trigger_type(make_trigger_type_ns("shop", "cron"))
            .await
            .unwrap();

        // Explicit `default` from a worker at home in `shop`: the provider at
        // home exists and must NOT be preferred. A caller who was specific is
        // not quietly served by someone else.
        registry
            .register_trigger(explicit_trigger("t1", "cron", "shop", DEFAULT_NAMESPACE))
            .await
            .unwrap();
        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            DEFAULT_NAMESPACE
        );

        // And an explicit namespace nobody provides does not fall back — it
        // parks, the same as any other unavailable provider.
        assert_eq!(
            registry
                .register_trigger(explicit_trigger("t2", "cron", "shop", "nowhere"))
                .await
                .unwrap(),
            RegisterTriggerOutcome::Deferred
        );
        assert!(registry.pending_triggers.contains_key("t2"));
    }

    #[tokio::test]
    async fn the_target_namespace_is_independent_of_the_provider() {
        // Everything outside its own namespace: the provider is the engine's,
        // the target is a third namespace, and the worker's own appears in
        // neither resolution.
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();

        let trigger = Trigger {
            namespace: "billing".to_string(),
            ..resolved_trigger("t1", "cron", "shop")
        };
        registry.register_trigger(trigger).await.unwrap();

        let stored = registry.triggers.get("t1").unwrap();
        assert_eq!(stored.provider_namespace, DEFAULT_NAMESPACE, "provider");
        assert_eq!(stored.namespace, "billing", "target");
        assert_eq!(stored.home_namespace, "shop", "the worker's own");
    }

    // ── Re-homing ────────────────────────────────────────────────────────

    #[tokio::test]
    async fn a_provider_arriving_late_claims_back_what_fell_back() {
        // The ordering that would otherwise decide everything silently: the
        // binding is made before the project's own provider is up.
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("state"))
            .await
            .unwrap();
        registry
            .register_trigger(resolved_trigger("t1", "state", "shop"))
            .await
            .unwrap();
        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            DEFAULT_NAMESPACE
        );

        // The project's provider registers afterwards.
        registry
            .register_trigger_type(make_trigger_type_ns("shop", "state"))
            .await
            .unwrap();

        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            "shop",
            "a binding must not be stuck on the fallback because of start order"
        );
    }

    #[tokio::test]
    async fn an_explicit_binding_is_never_re_homed() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("state"))
            .await
            .unwrap();
        registry
            .register_trigger(explicit_trigger("t1", "state", "shop", DEFAULT_NAMESPACE))
            .await
            .unwrap();

        registry
            .register_trigger_type(make_trigger_type_ns("shop", "state"))
            .await
            .unwrap();

        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            DEFAULT_NAMESPACE,
            "naming a namespace means that one, whatever appears later"
        );
    }

    #[tokio::test]
    async fn one_namespace_provider_does_not_take_another_namespace_bindings() {
        // The defect this whole change exists for: two providers of the same
        // type id used to overwrite each other, and the winner was handed the
        // loser's bindings.
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type_ns("shop-a", "webhook"))
            .await
            .unwrap();
        registry
            .register_trigger(resolved_trigger("t-a", "webhook", "shop-a"))
            .await
            .unwrap();

        registry
            .register_trigger_type(make_trigger_type_ns("shop-b", "webhook"))
            .await
            .unwrap();

        assert_eq!(
            registry.trigger_types.len(),
            2,
            "neither overwrote the other"
        );
        assert_eq!(
            registry.triggers.get("t-a").unwrap().provider_namespace,
            "shop-a",
            "shop-a's binding must stay with shop-a's provider"
        );
    }

    #[tokio::test]
    async fn a_departing_home_provider_hands_its_bindings_back_to_the_fallback() {
        // The symmetric case. A project provider restarting must not disable
        // the bindings it was serving when the engine still provides the type.
        let registry = TriggerRegistry::new();
        let worker = Uuid::new_v4();
        registry
            .register_trigger_type(make_trigger_type("state"))
            .await
            .unwrap();
        registry
            .register_trigger_type(TriggerType::new_ns(
                "shop",
                "state",
                "the project's own",
                Box::new(MockRegistrator::new()),
                Some(worker),
            ))
            .await
            .unwrap();
        registry
            .register_trigger(resolved_trigger("t1", "state", "shop"))
            .await
            .unwrap();
        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            "shop"
        );

        registry.unregister_worker(&worker).await;

        let stored = registry
            .triggers
            .get("t1")
            .expect("the binding must survive");
        assert_eq!(
            stored.provider_namespace, DEFAULT_NAMESPACE,
            "it should fall back rather than be disabled"
        );
        assert!(registry.pending_triggers.is_empty());
    }

    #[tokio::test]
    async fn with_no_fallback_a_departing_provider_still_parks_its_bindings() {
        let registry = TriggerRegistry::new();
        let worker = Uuid::new_v4();
        registry
            .register_trigger_type(TriggerType::new_ns(
                "shop",
                "custom",
                "only provider anywhere",
                Box::new(MockRegistrator::new()),
                Some(worker),
            ))
            .await
            .unwrap();
        registry
            .register_trigger(resolved_trigger("t1", "custom", "shop"))
            .await
            .unwrap();

        registry.unregister_worker(&worker).await;

        assert!(registry.triggers.is_empty());
        assert!(registry.pending_triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn a_parked_binding_activates_on_whichever_step_appears_first() {
        let registry = TriggerRegistry::new();
        // Nothing provides it yet.
        assert_eq!(
            registry
                .register_trigger(resolved_trigger("t1", "webhook", "shop"))
                .await
                .unwrap(),
            RegisterTriggerOutcome::Deferred
        );

        // The fallback appears: the intent activates there.
        registry
            .register_trigger_type(make_trigger_type("webhook"))
            .await
            .unwrap();
        assert_eq!(
            registry.triggers.get("t1").unwrap().provider_namespace,
            DEFAULT_NAMESPACE
        );
        assert!(registry.pending_triggers.is_empty());
    }

    fn make_trigger_type(id: &str) -> TriggerType {
        TriggerType::new(
            id,
            format!("Test trigger type {}", id),
            Box::new(MockRegistrator::new()),
            None,
        )
    }

    #[test]
    fn test_trigger_registry_new() {
        let registry = TriggerRegistry::new();
        assert!(registry.trigger_types.is_empty());
        assert!(registry.triggers.is_empty());
    }

    #[test]
    fn test_trigger_registry_default() {
        let registry = TriggerRegistry::default();
        assert!(registry.trigger_types.is_empty());
        assert!(registry.triggers.is_empty());
    }

    #[tokio::test]
    async fn test_trigger_registry_register_trigger_type() {
        let registry = TriggerRegistry::new();
        let tt = make_trigger_type("cron");

        let result = registry.register_trigger_type(tt).await;
        assert!(result.is_ok());
        assert_eq!(registry.trigger_types.len(), 1);
        assert!(
            registry
                .trigger_types
                .contains_key(&crate::trigger::type_key(
                    crate::protocol::DEFAULT_NAMESPACE,
                    "cron"
                ))
        );
    }

    #[tokio::test]
    async fn test_trigger_registry_register_trigger_type_overwrites() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();

        // DashMap insert overwrites; there should still be exactly one entry.
        assert_eq!(registry.trigger_types.len(), 1);
    }

    #[tokio::test]
    async fn re_registering_a_type_replaces_registrator_and_replays_bindings() {
        let registry = TriggerRegistry::new();

        let a = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new("cron", "gen A", Box::new(a.clone()), None))
            .await
            .unwrap();
        registry
            .register_trigger(make_trigger("t1", "cron"))
            .await
            .unwrap();
        assert_eq!(a.register_count.load(Ordering::SeqCst), 1);

        // Provider reload / reconnect: the type re-registers with a NEW
        // registrator. The existing binding must be re-delivered to it, and
        // later registrations must route to it — never to the stale one.
        let b = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new("cron", "gen B", Box::new(b.clone()), None))
            .await
            .unwrap();
        assert_eq!(
            b.register_count.load(Ordering::SeqCst),
            1,
            "existing binding replayed to the new registrator"
        );

        registry
            .register_trigger(make_trigger("t2", "cron"))
            .await
            .unwrap();
        assert_eq!(b.register_count.load(Ordering::SeqCst), 2);
        assert_eq!(
            a.register_count.load(Ordering::SeqCst),
            1,
            "stale registrator receives nothing after replacement"
        );
    }

    #[tokio::test]
    async fn unregister_worker_reaps_only_connection_owned_triggers() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("evt"))
            .await
            .unwrap();
        let worker = Uuid::new_v4();

        // A worker's own lifecycle binding (Message::RegisterTrigger path).
        let mut owned = make_trigger("t_owned", "evt");
        owned.worker_id = Some(worker);
        registry.register_trigger(owned).await.unwrap();

        // A function-path registration (engine::register_trigger): durable,
        // no connection owner.
        registry
            .register_trigger(make_trigger("t_durable", "evt"))
            .await
            .unwrap();

        registry.unregister_worker(&worker).await;

        assert!(
            !registry.triggers.contains_key("t_owned"),
            "connection-owned binding dies with its worker"
        );
        assert!(
            registry.triggers.contains_key("t_durable"),
            "durable binding survives the owner's disconnect GC"
        );

        // Explicit unregister is the durable binding's only teardown.
        let removed = registry
            .unregister_trigger("t_durable".to_string(), None)
            .await
            .unwrap();
        assert!(removed);
        assert!(!registry.triggers.contains_key("t_durable"));
    }

    /// Provider restart where the replacement registers concurrently with the
    /// old connection's cleanup. Whatever the interleave: the replacement
    /// type entry must survive (ownership-checked removal), the binding must
    /// never be lost (it ends live or parked, in exactly one bucket), and the
    /// stale generation must receive nothing after replacement.
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn stale_cleanup_racing_a_replacement_never_clobbers_or_loses_bindings() {
        for _ in 0..100 {
            let registry = Arc::new(TriggerRegistry::new());
            let old_worker = Uuid::new_v4();

            let a = Arc::new(ControlledRegistrator::new(false, false));
            registry
                .register_trigger_type(TriggerType::new(
                    "evt",
                    "gen A",
                    Box::new(a.clone()),
                    Some(old_worker),
                ))
                .await
                .unwrap();

            let mut binding = make_trigger("t1", "evt");
            binding.worker_id = Some(Uuid::new_v4());
            registry.register_trigger(binding).await.unwrap();
            assert_eq!(a.register_count.load(Ordering::SeqCst), 1);

            let b = Arc::new(ControlledRegistrator::new(false, false));
            let new_worker = Uuid::new_v4();
            let replacement =
                TriggerType::new("evt", "gen B", Box::new(b.clone()), Some(new_worker));

            let cleanup = {
                let registry = registry.clone();
                tokio::spawn(async move { registry.unregister_worker(&old_worker).await })
            };
            let reregister = {
                let registry = registry.clone();
                tokio::spawn(
                    async move { registry.register_trigger_type(replacement).await.unwrap() },
                )
            };
            let (r1, r2) = tokio::join!(cleanup, reregister);
            r1.unwrap();
            r2.unwrap();

            let tt = registry
                .trigger_types
                .get(&crate::trigger::type_key(
                    crate::protocol::DEFAULT_NAMESPACE,
                    "evt",
                ))
                .expect("replacement type survives the stale cleanup");
            assert_eq!(tt.worker_id, Some(new_worker));
            drop(tt);

            let live = registry.triggers.contains_key("t1");
            let parked = registry.pending_triggers.contains_key("t1");
            assert!(
                live ^ parked,
                "binding must end in exactly one bucket (live: {live}, parked: {parked})"
            );
            if live {
                assert!(
                    b.register_count.load(Ordering::SeqCst) >= 1,
                    "a live binding was delivered to the replacement generation"
                );
            }
            assert_eq!(
                a.register_count.load(Ordering::SeqCst),
                1,
                "stale generation receives nothing after replacement"
            );
        }
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn replayed_binding_survives_stale_worker_cleanup() {
        // Regression guard for the reconnect kill loop (iii-hq/iii#1975),
        // binding half. When a worker's socket drops and its SDK reconnects,
        // the new connection replays its RegisterTrigger batch while the old
        // connection's `unregister_worker` cleanup runs concurrently. The
        // cleanup used to `triggers.remove(id)` unconditionally from a
        // snapshot, deleting (and provider-unregistering) the binding the new
        // connection had just re-registered — the console watcher would die
        // and never come back. Post-fix, removal is guarded by an ownership
        // CAS, mirroring the trigger-type guard in the same function.
        for _ in 0..100 {
            let registry = Arc::new(TriggerRegistry::new());

            // Trigger type owned by a separate provider worker so the stale
            // worker's cleanup never removes the type (which would orphan the
            // binding into `pending_triggers` and mask the guard we test).
            let provider = Arc::new(ControlledRegistrator::new(false, false));
            let provider_worker = Uuid::new_v4();
            registry
                .register_trigger_type(TriggerType::new(
                    "evt",
                    "provider",
                    Box::new(provider.clone()),
                    Some(provider_worker),
                ))
                .await
                .unwrap();

            let old_worker = Uuid::new_v4();
            let new_worker = Uuid::new_v4();

            // Filler bindings owned by the old worker widen the snapshot→remove
            // window: each removal awaits the provider's unregister, giving the
            // racing re-registration room to land before `t1`'s turn.
            for fid in ["f1", "f2", "f3"] {
                let mut b = make_trigger(fid, "evt");
                b.worker_id = Some(old_worker);
                registry.register_trigger(b).await.unwrap();
            }
            let mut binding = make_trigger("t1", "evt");
            binding.worker_id = Some(old_worker);
            registry.register_trigger(binding).await.unwrap();

            let cleanup = {
                let registry = registry.clone();
                tokio::spawn(async move { registry.unregister_worker(&old_worker).await })
            };
            let reregister = {
                let registry = registry.clone();
                tokio::spawn(async move {
                    let mut replay = make_trigger("t1", "evt");
                    replay.worker_id = Some(new_worker);
                    registry.register_trigger(replay).await.unwrap();
                })
            };
            let (r1, r2) = tokio::join!(cleanup, reregister);
            r1.unwrap();
            r2.unwrap();

            let t1 = registry
                .triggers
                .get("t1")
                .expect("re-registered binding must survive the stale worker's cleanup");
            assert_eq!(
                t1.worker_id,
                Some(new_worker),
                "surviving binding must be owned by the reconnected worker"
            );
            assert!(
                !registry.pending_triggers.contains_key("t1"),
                "binding must be live, not parked"
            );
        }
    }

    #[tokio::test]
    async fn test_trigger_registry_register_trigger() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();

        let trigger = make_trigger("t1", "cron");
        let result = registry.register_trigger(trigger).await;
        assert!(result.is_ok());
        assert_eq!(registry.triggers.len(), 1);
        assert!(registry.triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn test_trigger_registry_register_trigger_missing_type_defers() {
        let registry = TriggerRegistry::new();
        // No trigger type registered -- the intent is parked, not dropped.
        let trigger = make_trigger("t1", "nonexistent");
        let result = registry.register_trigger(trigger).await;
        assert!(matches!(result, Ok(RegisterTriggerOutcome::Deferred)));
        assert!(registry.triggers.is_empty());
        assert!(registry.pending_triggers.contains_key("t1"));
    }

    #[test]
    fn pending_warning_points_to_compose_workers() {
        let cases = [
            ("http", "http"),
            ("cron", "cron"),
            ("subscribe", "pubsub"),
            ("state", "state"),
            ("durable:subscriber", "queue"),
        ];

        for (trigger_type, worker_name) in cases {
            assert_eq!(known_trigger_type_provider(trigger_type), Some(worker_name));

            let msg = TriggerRegistry::pending_trigger_warning(&make_trigger("t1", trigger_type));
            let expected_hint = format!(
                "iii trigger -n <compose-daemon-namespace> compose::add worker={worker_name}"
            );
            assert!(
                msg.contains(&expected_hint),
                "Expected hint with '{expected_hint}', got: {msg}"
            );
            assert!(
                !msg.contains("iii trigger -n default"),
                "worker namespace must not be presented as the Compose daemon namespace: {msg}"
            );
            assert!(!msg.contains("iii worker"), "legacy command leaked: {msg}");
        }
    }

    #[test]
    fn pending_warning_for_unknown_type_points_to_workers_directory() {
        let msg = TriggerRegistry::pending_trigger_warning(&make_trigger("t1", "nonexistent"));
        assert!(
            msg.contains("https://workers.iii.dev/"),
            "Expected workers directory recommendation, got: {msg}"
        );
    }

    #[tokio::test]
    async fn deferred_trigger_activates_when_type_registers() {
        let registry = TriggerRegistry::new();

        let result = registry
            .register_trigger(make_trigger("t1", "webhook"))
            .await;
        assert!(matches!(result, Ok(RegisterTriggerOutcome::Deferred)));
        assert!(registry.pending_triggers.contains_key("t1"));
        assert!(!registry.triggers.contains_key("t1"));

        let registrator = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "webhook",
                "Webhook",
                Box::new(Arc::clone(&registrator)),
                None,
            ))
            .await
            .unwrap();

        assert_eq!(
            registrator.register_count.load(Ordering::SeqCst),
            1,
            "parked intent delivered to the registrator when the type arrives"
        );
        assert!(registry.pending_triggers.is_empty());
        assert!(registry.triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn pending_trigger_that_fails_activation_stays_pending_and_retries() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger(make_trigger("t1", "webhook"))
            .await
            .unwrap();

        let failing = Arc::new(ControlledRegistrator::new(true, false));
        registry
            .register_trigger_type(TriggerType::new(
                "webhook",
                "gen A",
                Box::new(Arc::clone(&failing)),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(failing.register_count.load(Ordering::SeqCst), 1);
        assert!(
            registry.pending_triggers.contains_key("t1"),
            "failed activation keeps the intent parked"
        );
        assert!(!registry.triggers.contains_key("t1"));

        // The next (re)registration of the type retries the parked intent.
        let healthy = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "webhook",
                "gen B",
                Box::new(Arc::clone(&healthy)),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(healthy.register_count.load(Ordering::SeqCst), 1);
        assert!(registry.pending_triggers.is_empty());
        assert!(registry.triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn provider_disconnect_parks_other_owners_bindings_until_type_returns() {
        let registry = TriggerRegistry::new();
        let provider = Uuid::new_v4();

        let gen_a = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "gen A",
                Box::new(Arc::clone(&gen_a)),
                Some(provider),
            ))
            .await
            .unwrap();

        // A durable binding (engine::register_trigger path) and another
        // worker's binding, both against the provider's type.
        registry
            .register_trigger(make_trigger("t_durable", "evt"))
            .await
            .unwrap();
        let other_worker = Uuid::new_v4();
        let mut other = make_trigger("t_other", "evt");
        other.worker_id = Some(other_worker);
        registry.register_trigger(other).await.unwrap();

        // Provider restarts: its type goes away, the surviving bindings are
        // parked (disabled), not dropped.
        registry.unregister_worker(&provider).await;
        assert!(registry.trigger_types.is_empty());
        assert!(registry.triggers.is_empty());
        assert!(registry.pending_triggers.contains_key("t_durable"));
        assert!(registry.pending_triggers.contains_key("t_other"));

        // Provider reconnects and re-registers the type: both bindings
        // come back to life.
        let gen_b = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "gen B",
                Box::new(Arc::clone(&gen_b)),
                Some(Uuid::new_v4()),
            ))
            .await
            .unwrap();
        assert_eq!(gen_b.register_count.load(Ordering::SeqCst), 2);
        assert!(registry.pending_triggers.is_empty());
        assert!(registry.triggers.contains_key("t_durable"));
        assert!(registry.triggers.contains_key("t_other"));
    }

    /// Recovery must preserve the namespace. A trigger registered in `orders`
    /// while its type is unavailable is parked in `pending_triggers`; when the
    /// type is (re)registered it is activated into the live `triggers` map. The
    /// recovered binding must still resolve in `orders` — every dispatch path
    /// reads `namespace_of`, so if recovery dropped the namespace the trigger
    /// would silently fire in `default` (BUG 1 via the recovery path).
    #[tokio::test]
    async fn a_recovered_pending_trigger_keeps_its_namespace() {
        let registry = TriggerRegistry::new();

        // Arrives before its type exists → parked pending.
        let mut trig = make_trigger("t_ns", "evt");
        trig.namespace = "orders".to_string();
        registry.register_trigger(trig).await.unwrap();
        assert!(registry.pending_triggers.contains_key("t_ns"));
        assert!(!registry.triggers.contains_key("t_ns"));

        // The type registers: the parked intent is activated (recovered).
        let healthy = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "gen A",
                Box::new(Arc::clone(&healthy)),
                None,
            ))
            .await
            .unwrap();

        assert!(registry.triggers.contains_key("t_ns"), "trigger recovered");
        assert!(registry.pending_triggers.is_empty());
        assert_eq!(
            registry.namespace_of("t_ns"),
            "orders",
            "a recovered trigger must still resolve in the namespace it was registered in, \
             not fall back to default"
        );
    }

    #[tokio::test]
    async fn unregister_worker_drops_its_own_pending_intents() {
        let registry = TriggerRegistry::new();
        let worker = Uuid::new_v4();

        let mut owned = make_trigger("t_owned", "missing-type");
        owned.worker_id = Some(worker);
        registry.register_trigger(owned).await.unwrap();
        registry
            .register_trigger(make_trigger("t_durable", "missing-type"))
            .await
            .unwrap();
        assert_eq!(registry.pending_triggers.len(), 2);

        registry.unregister_worker(&worker).await;

        assert!(
            !registry.pending_triggers.contains_key("t_owned"),
            "connection-owned intent dies with its worker"
        );
        assert!(
            registry.pending_triggers.contains_key("t_durable"),
            "durable intent survives another worker's disconnect"
        );

        // The type arriving later must not resurrect the dropped intent —
        // only the surviving durable one may activate.
        let registrator = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "missing-type",
                "now present",
                Box::new(Arc::clone(&registrator)),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(registrator.register_count.load(Ordering::SeqCst), 1);
        assert!(registry.triggers.contains_key("t_durable"));
        assert!(!registry.triggers.contains_key("t_owned"));
        assert!(registry.pending_triggers.is_empty());
    }

    #[tokio::test]
    async fn owner_disconnect_while_parked_drops_the_disabled_binding() {
        // Full lifecycle chain: a live binding is parked because its type's
        // provider disconnected ([DISABLED]); then the binding's OWNER
        // disconnects while it is parked. The intent must die with its owner
        // and must NOT come back when the provider returns.
        let registry = TriggerRegistry::new();
        let provider = Uuid::new_v4();
        let owner = Uuid::new_v4();

        let gen_a = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "gen A",
                Box::new(Arc::clone(&gen_a)),
                Some(provider),
            ))
            .await
            .unwrap();

        let mut owned = make_trigger("t_owned", "evt");
        owned.worker_id = Some(owner);
        registry.register_trigger(owned).await.unwrap();

        // Provider restarts: the owner's binding is parked, not dropped.
        registry.unregister_worker(&provider).await;
        assert!(registry.pending_triggers.contains_key("t_owned"));

        // The owner disconnects while its binding is still parked.
        registry.unregister_worker(&owner).await;
        assert!(
            registry.pending_triggers.is_empty(),
            "parked intent dies with its owning worker"
        );

        // Provider returns: nothing may be re-delivered.
        let gen_b = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "gen B",
                Box::new(Arc::clone(&gen_b)),
                Some(Uuid::new_v4()),
            ))
            .await
            .unwrap();
        assert_eq!(
            gen_b.register_count.load(Ordering::SeqCst),
            0,
            "dead owner's binding must not be resurrected"
        );
        assert!(registry.triggers.is_empty());
        assert!(registry.pending_triggers.is_empty());
    }

    #[tokio::test]
    async fn unregister_trigger_drops_pending_intent() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger(make_trigger("t1", "missing-type"))
            .await
            .unwrap();
        assert!(registry.pending_triggers.contains_key("t1"));

        let removed = registry.unregister_trigger("t1".to_string(), None).await;
        assert!(matches!(removed, Ok(true)));
        assert!(registry.pending_triggers.is_empty());

        // Its type arriving later must not resurrect the dropped intent.
        let registrator = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "missing-type",
                "now present",
                Box::new(Arc::clone(&registrator)),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(registrator.register_count.load(Ordering::SeqCst), 0);
        assert!(registry.triggers.is_empty());
    }

    #[tokio::test]
    async fn live_registration_supersedes_parked_intent_with_same_id() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger(make_trigger("t1", "webhook"))
            .await
            .unwrap();
        assert!(registry.pending_triggers.contains_key("t1"));

        let registrator = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "evt",
                "other type",
                Box::new(Arc::clone(&registrator)),
                None,
            ))
            .await
            .unwrap();

        // Re-registering the same id against an available type replaces the
        // parked intent instead of leaving a stale duplicate behind.
        registry
            .register_trigger(make_trigger("t1", "evt"))
            .await
            .unwrap();
        assert!(registry.pending_triggers.is_empty());
        assert_eq!(registry.triggers.get("t1").unwrap().trigger_type, "evt");
    }

    #[tokio::test]
    async fn test_trigger_registry_unregister_trigger() {
        let registry = TriggerRegistry::new();
        registry
            .register_trigger_type(make_trigger_type("cron"))
            .await
            .unwrap();
        registry
            .register_trigger(make_trigger("t1", "cron"))
            .await
            .unwrap();

        let result = registry
            .unregister_trigger("t1".to_string(), Some("cron".to_string()))
            .await;
        assert!(matches!(result, Ok(true)));
        assert!(registry.triggers.is_empty());
    }

    #[tokio::test]
    async fn test_trigger_registry_unregister_trigger_not_found() {
        let registry = TriggerRegistry::new();
        let result = registry
            .unregister_trigger("nonexistent".to_string(), None)
            .await;
        // Idempotent: unregistering an unknown id is a no-op, not an error.
        assert!(matches!(result, Ok(false)));
    }

    #[tokio::test]
    async fn test_trigger_registry_register_type_auto_registers_existing_triggers() {
        // When a trigger type is registered, any triggers already stored that
        // reference that type should be forwarded to the registrator.
        let registry = TriggerRegistry::new();

        // Insert a trigger manually before its type exists.
        let trigger = make_trigger("t1", "webhook");
        registry.triggers.insert(trigger.id.clone(), trigger);

        let registrator = Arc::new(MockRegistrator::new());
        let tt = TriggerType::new(
            "webhook",
            "Webhook type",
            Box::new(MockRegistrator::new()),
            None,
        );

        // We cannot easily inspect the boxed registrator, but the call should
        // succeed and not panic.
        let result = registry.register_trigger_type(tt).await;
        assert!(result.is_ok());
        // The trigger type was inserted.
        assert!(
            registry
                .trigger_types
                .contains_key(&crate::trigger::type_key(
                    crate::protocol::DEFAULT_NAMESPACE,
                    "webhook"
                ))
        );
        // A trigger for this type was already registered explicitly, so
        // the registrator's register_trigger should have been called
        // (tested implicitly -- no panic means success).
        drop(registrator);
    }

    #[tokio::test]
    async fn test_unregister_worker_removes_triggers_and_types() {
        let registry = TriggerRegistry::new();
        let worker_id = Uuid::new_v4();

        // Register a trigger type owned by the worker.
        let tt = TriggerType::new(
            "cron",
            "Cron",
            Box::new(MockRegistrator::new()),
            Some(worker_id),
        );
        registry.register_trigger_type(tt).await.unwrap();

        // Register a trigger owned by the worker.
        let mut trigger = make_trigger("t1", "cron");
        trigger.worker_id = Some(worker_id);
        registry.register_trigger(trigger).await.unwrap();

        assert_eq!(registry.triggers.len(), 1);
        assert_eq!(registry.trigger_types.len(), 1);

        registry.unregister_worker(&worker_id).await;

        assert!(registry.triggers.is_empty());
        assert!(registry.trigger_types.is_empty());
    }

    #[tokio::test]
    async fn test_unregister_worker_does_not_affect_other_workers() {
        let registry = TriggerRegistry::new();
        let worker_a = Uuid::new_v4();
        let worker_b = Uuid::new_v4();

        let tt = TriggerType::new(
            "cron",
            "Cron",
            Box::new(MockRegistrator::new()),
            Some(worker_a),
        );
        registry.register_trigger_type(tt).await.unwrap();

        let mut trigger_a = make_trigger("ta", "cron");
        trigger_a.worker_id = Some(worker_a);
        registry.register_trigger(trigger_a).await.unwrap();

        let mut trigger_b = make_trigger("tb", "cron");
        trigger_b.worker_id = Some(worker_b);
        registry.register_trigger(trigger_b).await.unwrap();

        registry.unregister_worker(&worker_b).await;

        // Only worker_b's trigger should be removed.
        assert_eq!(registry.triggers.len(), 1);
        assert!(registry.triggers.contains_key("ta"));
        // The trigger type belongs to worker_a so it should remain.
        assert_eq!(registry.trigger_types.len(), 1);
    }

    #[tokio::test]
    async fn test_register_trigger_type_ignores_existing_trigger_registration_errors() {
        let registry = TriggerRegistry::new();
        let trigger = make_trigger("existing", "webhook");
        registry.triggers.insert(trigger.id.clone(), trigger);

        let registrator = Arc::new(ControlledRegistrator::new(true, false));
        let trigger_type = TriggerType::new(
            "webhook",
            "Webhook",
            Box::new(Arc::clone(&registrator)),
            None,
        );

        registry.register_trigger_type(trigger_type).await.unwrap();

        assert_eq!(registrator.register_count.load(Ordering::SeqCst), 1);
        assert!(
            registry
                .trigger_types
                .contains_key(&crate::trigger::type_key(
                    crate::protocol::DEFAULT_NAMESPACE,
                    "webhook"
                ))
        );
    }

    #[tokio::test]
    async fn test_register_trigger_propagates_registrator_error() {
        let registry = TriggerRegistry::new();
        let registrator = Arc::new(ControlledRegistrator::new(true, false));
        let trigger_type = TriggerType::new(
            "durable:subscriber",
            "Queue",
            Box::new(Arc::clone(&registrator)),
            None,
        );
        registry.register_trigger_type(trigger_type).await.unwrap();

        let err = registry
            .register_trigger(make_trigger("t-error", "durable:subscriber"))
            .await
            .expect_err("provider rejection should fail the registration");

        assert_eq!(err.to_string(), "register failed");
        assert_eq!(registrator.register_count.load(Ordering::SeqCst), 1);
        assert!(!registry.triggers.contains_key("t-error"));
        assert!(
            !registry.pending_triggers.contains_key("t-error"),
            "a rejected bind must not be parked"
        );
    }

    fn closed_channel_connection() -> crate::worker_connections::WorkerConnection {
        let (tx, rx) = tokio::sync::mpsc::channel::<crate::engine::Outbound>(1);
        drop(rx);
        crate::worker_connections::WorkerConnection::new(tx)
    }

    #[tokio::test]
    async fn register_trigger_transport_failure_parks_and_next_type_registration_activates() {
        let registry = TriggerRegistry::new();
        // Real provider connection whose channel is already closed: the send
        // fails, which must classify as RegistratorUnavailable and park.
        let trigger_type = TriggerType::new(
            "durable:subscriber",
            "Queue",
            Box::new(closed_channel_connection()),
            None,
        );
        registry.register_trigger_type(trigger_type).await.unwrap();

        let outcome = registry
            .register_trigger(make_trigger("t-park", "durable:subscriber"))
            .await
            .unwrap();

        assert_eq!(outcome, RegisterTriggerOutcome::Deferred);
        assert!(!registry.triggers.contains_key("t-park"));
        assert!(
            registry.pending_triggers.contains_key("t-park"),
            "undeliverable bind is parked, not dropped"
        );

        // Provider heals and re-registers the type: the parked intent activates.
        let healthy = Arc::new(ControlledRegistrator::new(false, false));
        let trigger_type = TriggerType::new(
            "durable:subscriber",
            "Queue",
            Box::new(Arc::clone(&healthy)),
            None,
        );
        registry.register_trigger_type(trigger_type).await.unwrap();

        assert_eq!(healthy.register_count.load(Ordering::SeqCst), 1);
        assert!(registry.pending_triggers.is_empty());
        assert!(registry.triggers.contains_key("t-park"));
    }

    #[tokio::test]
    async fn rejected_reregistration_keeps_existing_live_binding_tracked() {
        let registry = TriggerRegistry::new();
        let failing = Arc::new(ControlledRegistrator::new(true, false));
        registry.trigger_types.insert(
            crate::trigger::type_key(crate::protocol::DEFAULT_NAMESPACE, &"webhook".to_string()),
            TriggerType::new("webhook", "Webhook", Box::new(Arc::clone(&failing)), None),
        );
        registry
            .triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));

        let result = registry
            .register_trigger(make_trigger("t1", "webhook"))
            .await;

        assert!(result.is_err());
        assert!(
            registry.triggers.contains_key("t1"),
            "the previous live registration must stay tracked for teardown"
        );
        assert!(!registry.pending_triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn undeliverable_reregistration_of_live_binding_ends_parked_not_split() {
        let registry = TriggerRegistry::new();
        registry.trigger_types.insert(
            crate::trigger::type_key(crate::protocol::DEFAULT_NAMESPACE, &"webhook".to_string()),
            TriggerType::new(
                "webhook",
                "Webhook",
                Box::new(closed_channel_connection()),
                None,
            ),
        );
        registry
            .triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));

        let result = registry
            .register_trigger(make_trigger("t1", "webhook"))
            .await;

        assert!(matches!(result, Ok(RegisterTriggerOutcome::Deferred)));
        assert!(
            !registry.triggers.contains_key("t1"),
            "stale live entry must not survive; the dying provider's jobs die with it"
        );
        assert!(registry.pending_triggers.contains_key("t1"));
    }

    #[tokio::test]
    async fn unregister_live_trigger_clears_stale_pending_intent() {
        // Mid-unregister race state: a late async rejection re-parked the
        // binding while the registrator unregister call was in flight.
        let registry = TriggerRegistry::new();
        let registrator = Arc::new(ControlledRegistrator::new(false, false));
        registry.trigger_types.insert(
            crate::trigger::type_key(crate::protocol::DEFAULT_NAMESPACE, &"webhook".to_string()),
            TriggerType::new(
                "webhook",
                "Webhook",
                Box::new(Arc::clone(&registrator)),
                None,
            ),
        );
        registry
            .triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));
        registry
            .pending_triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));

        let removed = registry
            .unregister_trigger("t1".to_string(), None)
            .await
            .unwrap();

        assert!(removed);
        assert_eq!(registrator.unregister_count.load(Ordering::SeqCst), 1);
        assert!(!registry.triggers.contains_key("t1"));
        assert!(
            !registry.pending_triggers.contains_key("t1"),
            "explicit unregister must clear a raced re-park, or the intent replays on the next type registration"
        );
    }

    #[tokio::test]
    async fn stale_rejection_after_provider_replacement_reactivates_through_current_provider() {
        let registry = TriggerRegistry::new();
        let old_provider = Uuid::new_v4();
        let replacement = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "webhook",
                "gen B",
                Box::new(Arc::clone(&replacement)),
                Some(Uuid::new_v4()),
            ))
            .await
            .unwrap();
        registry
            .triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));

        // The rejection reporter is the replaced generation's worker, not the
        // current owner: the park must immediately re-activate through the
        // replacement instead of stranding the binding.
        registry.park_rejected_trigger("t1", old_provider).await;

        assert!(registry.triggers.contains_key("t1"));
        assert!(!registry.pending_triggers.contains_key("t1"));
        assert_eq!(replacement.register_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn rejection_from_current_owner_parks_without_replay_pingpong() {
        let registry = TriggerRegistry::new();
        let owner_worker = Uuid::new_v4();
        let owner = Arc::new(ControlledRegistrator::new(false, false));
        registry
            .register_trigger_type(TriggerType::new(
                "webhook",
                "Webhook",
                Box::new(Arc::clone(&owner)),
                Some(owner_worker),
            ))
            .await
            .unwrap();
        registry
            .triggers
            .insert("t1".to_string(), make_trigger("t1", "webhook"));

        registry.park_rejected_trigger("t1", owner_worker).await;

        assert!(!registry.triggers.contains_key("t1"));
        assert!(registry.pending_triggers.contains_key("t1"));
        assert_eq!(
            owner.register_count.load(Ordering::SeqCst),
            0,
            "no replay back to the provider that just rejected the bind"
        );
    }

    #[tokio::test]
    async fn test_unregister_trigger_propagates_registrator_error() {
        let registry = TriggerRegistry::new();
        let registrator = Arc::new(ControlledRegistrator::new(false, true));
        let trigger_type = TriggerType::new(
            "durable:subscriber",
            "Queue",
            Box::new(Arc::clone(&registrator)),
            None,
        );
        registry.register_trigger_type(trigger_type).await.unwrap();
        registry
            .register_trigger(make_trigger("t-unregister", "durable:subscriber"))
            .await
            .unwrap();

        let err = registry
            .unregister_trigger(
                "t-unregister".to_string(),
                Some("durable:subscriber".to_string()),
            )
            .await
            .expect_err("unregister should fail when registrator errors");

        assert_eq!(err.to_string(), "unregister failed");
        assert_eq!(registrator.unregister_count.load(Ordering::SeqCst), 1);
        assert!(registry.triggers.contains_key("t-unregister"));
    }

    #[tokio::test]
    async fn test_unregister_worker_continues_after_registrator_error() {
        let registry = TriggerRegistry::new();
        let worker_id = Uuid::new_v4();
        let registrator = Arc::new(ControlledRegistrator::new(false, true));
        let trigger_type = TriggerType::new(
            "durable:subscriber",
            "Queue",
            Box::new(Arc::clone(&registrator)),
            Some(worker_id),
        );
        registry.register_trigger_type(trigger_type).await.unwrap();

        let mut trigger = make_trigger("t-owned", "durable:subscriber");
        trigger.worker_id = Some(worker_id);
        registry.register_trigger(trigger).await.unwrap();

        registry.unregister_worker(&worker_id).await;

        assert_eq!(registrator.unregister_count.load(Ordering::SeqCst), 1);
        assert!(registry.triggers.is_empty());
        assert!(registry.trigger_types.is_empty());
    }

    // ---- Trigger Hash / Eq tests ----

    #[test]
    fn test_trigger_hash_and_eq_same_id() {
        let t1 = Trigger {
            id: "trigger-1".to_string(),
            trigger_type: "cron".to_string(),
            function_id: "fn_a".to_string(),
            config: serde_json::json!({"interval": 5}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };
        let t2 = Trigger {
            id: "trigger-1".to_string(),
            trigger_type: "webhook".to_string(),
            function_id: "fn_b".to_string(),
            config: serde_json::json!({"url": "https://example.com"}),
            worker_id: Some(Uuid::new_v4()),
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };

        // Same id means equal, even though other fields differ.
        assert_eq!(t1, t2);

        // HashSet should treat them as one entry.
        let mut set = HashSet::new();
        set.insert(t1);
        set.insert(t2);
        assert_eq!(set.len(), 1);
    }

    #[test]
    fn test_trigger_hash_and_eq_different_id() {
        let t1 = Trigger {
            id: "trigger-1".to_string(),
            trigger_type: "cron".to_string(),
            function_id: "fn_a".to_string(),
            config: serde_json::json!({}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };
        let t2 = Trigger {
            id: "trigger-2".to_string(),
            trigger_type: "cron".to_string(),
            function_id: "fn_a".to_string(),
            config: serde_json::json!({}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };

        assert_ne!(t1, t2);

        let mut set = HashSet::new();
        set.insert(t1);
        set.insert(t2);
        assert_eq!(set.len(), 2);
    }

    #[test]
    fn test_trigger_serialize_deserialize() {
        let trigger = make_trigger("t1", "cron");
        let json = serde_json::to_string(&trigger).unwrap();
        let deserialized: Trigger = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "t1");
        assert_eq!(deserialized.trigger_type, "cron");
        assert_eq!(deserialized.function_id, "fn_t1");
    }

    #[test]
    fn test_trigger_serialize_deserialize_with_metadata() {
        let trigger = Trigger {
            id: "t1".to_string(),
            trigger_type: "cron".to_string(),
            function_id: "fn_t1".to_string(),
            config: serde_json::json!({}),
            worker_id: None,
            metadata: Some(serde_json::json!({"team": "platform", "priority": "high"})),
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };
        let json = serde_json::to_string(&trigger).unwrap();
        let deserialized: Trigger = serde_json::from_str(&json).unwrap();
        assert_eq!(
            deserialized.metadata,
            Some(serde_json::json!({"team": "platform", "priority": "high"}))
        );
    }

    #[test]
    fn test_trigger_serialize_deserialize_without_metadata() {
        let trigger = Trigger {
            id: "t2".to_string(),
            trigger_type: "http".to_string(),
            function_id: "fn_t2".to_string(),
            config: serde_json::json!({}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };
        let json = serde_json::to_string(&trigger).unwrap();
        let deserialized: Trigger = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.metadata, None);
        assert!(!json.contains("metadata"));
    }

    fn assert_http_call_response_properties(schema: &Value) {
        let properties = schema
            .get("properties")
            .and_then(Value::as_object)
            .expect("call_response_format schema has a properties object");
        for key in ["status_code", "headers", "body"] {
            assert!(
                properties.contains_key(key),
                "expected property '{key}', got: {properties:?}"
            );
        }

        // Pin optionality: the worker (`HttpResponse::from_function_return`) treats
        // every field as optional (status_code defaults to 200, headers to empty,
        // body to {}), so none of them may appear in the schema's `required` array.
        if let Some(required) = schema.get("required").and_then(Value::as_array) {
            for key in ["status_code", "headers", "body"] {
                assert!(
                    !required.iter().any(|v| v.as_str() == Some(key)),
                    "'{key}' must not be required, got required: {required:?}"
                );
            }
        }
    }

    #[test]
    fn http_trigger_type_populates_call_response_format() {
        let tt = make_trigger_type("http");
        let schema = tt
            .call_response_format
            .expect("http trigger type sets call_response_format");
        assert_http_call_response_properties(&schema);
    }

    #[test]
    fn cron_trigger_type_has_no_call_response_format() {
        let tt = make_trigger_type("cron");
        assert!(tt.call_response_format.is_none());
    }

    #[tokio::test]
    async fn shared_trigger_identity_unregister_failure_preserves_recoverable_identity() {
        for global_removal in [false, true] {
            let registry = TriggerRegistry::new();
            registry.set_shared_namespace_ownership(true);
            let failing = Arc::new(ControlledRegistrator::new(false, true));
            registry
                .register_trigger_type(TriggerType::new(
                    "recoverable",
                    "fixture",
                    Box::new(failing.clone()),
                    None,
                ))
                .await
                .unwrap();
            let owner = Uuid::new_v4();
            let peer = Uuid::new_v4();
            let mut declaration = make_trigger("alias", "recoverable");
            declaration.worker_id = Some(owner);
            registry
                .register_trigger(declaration.clone())
                .await
                .unwrap();
            let canonical = registry.triggers.iter().next().unwrap().id.clone();

            let error = if global_removal {
                registry
                    .unregister_trigger(canonical.clone(), None)
                    .await
                    .unwrap_err()
            } else {
                registry
                    .unregister_subscriber(owner, "alias".into(), None)
                    .await
                    .unwrap_err()
            };
            assert_eq!(error.to_string(), "unregister failed");
            assert!(registry.triggers.contains_key(&canonical));
            assert_eq!(
                registry.subscriber_aliases(&canonical),
                vec![(owner, "alias".into())]
            );
            registry
                .register_trigger(declaration.clone())
                .await
                .unwrap();
            let mut replica = declaration.clone();
            replica.worker_id = Some(peer);
            replica.id = "replica".into();
            registry.register_trigger(replica).await.unwrap();
            assert_eq!(registry.triggers.len(), 1);
            assert_eq!(failing.register_count.load(Ordering::SeqCst), 1);
            assert!(
                registry
                    .unregister_subscriber(peer, "replica".into(), None)
                    .await
                    .unwrap()
            );
            assert_eq!(failing.unregister_count.load(Ordering::SeqCst), 1);
            assert!(
                registry
                    .unregister_subscriber(owner, "alias".into(), None)
                    .await
                    .is_err()
            );
            assert_eq!(failing.unregister_count.load(Ordering::SeqCst), 2);

            let recovered = Arc::new(ControlledRegistrator::new(false, false));
            registry
                .trigger_types
                .get_mut(&type_key(DEFAULT_NAMESPACE, "recoverable"))
                .unwrap()
                .registrator = Arc::new(recovered.clone());
            let removed = if global_removal {
                registry
                    .unregister_trigger(canonical.clone(), None)
                    .await
                    .unwrap()
            } else {
                registry
                    .unregister_subscriber(owner, "alias".into(), None)
                    .await
                    .unwrap()
            };
            assert!(removed);
            assert!(registry.triggers.is_empty());
            assert!(registry.pending_triggers.is_empty());
            assert!(registry.subscriber_aliases(&canonical).is_empty());
            assert_eq!(recovered.unregister_count.load(Ordering::SeqCst), 1);
            assert!(
                !registry
                    .unregister_subscriber(owner, "alias".into(), None)
                    .await
                    .unwrap()
            );
            assert!(!registry.unregister_trigger(canonical, None).await.unwrap());
        }
    }

    // Contract tests use existing registrators and production entry points. No
    // assignment/ack activation or firing policy is asserted in this phase.
    mod shared_identity {
        use super::*;
        use crate::{
            engine::{Engine, Outbound},
            protocol::Message,
            worker_connections::WorkerConnection,
        };
        use serde_json::json;
        use tokio::sync::mpsc;

        fn engine(enabled: bool) -> Engine {
            crate::workers::observability::metrics::ensure_default_meter();
            let engine = Engine::new();
            engine.set_shared_namespace_ownership(enabled);
            engine
        }

        async fn connection(
            engine: &Engine,
            namespace: &str,
        ) -> (WorkerConnection, mpsc::Receiver<Outbound>) {
            let (tx, rx) = mpsc::channel(32);
            let worker = WorkerConnection::new(tx);
            engine.worker_registry.register_worker(worker.clone());
            engine.begin_namespace_resolution(&worker);
            engine
                .resolve_connection_namespace(&worker, namespace)
                .await;
            (worker, rx)
        }

        async fn fixture(enabled: bool) -> (Engine, Arc<ControlledRegistrator>) {
            let engine = engine(enabled);
            let registrator = Arc::new(ControlledRegistrator::new(false, false));
            engine
                .trigger_registry
                .register_trigger_type(TriggerType::new_ns(
                    "orders",
                    "identity:event",
                    "identity fixture",
                    Box::new(registrator.clone()),
                    None,
                ))
                .await
                .unwrap();
            (engine, registrator)
        }

        fn binding(alias: &str, owner: Option<Uuid>) -> Trigger {
            let mut trigger = make_trigger(alias, "identity:event");
            trigger.function_id = "svc::handle".into();
            trigger.config = json!({"filter": {"a": 1, "b": 2}, "order": [1, 2]});
            trigger.metadata = Some(json!({"team": "orders"}));
            trigger.worker_id = owner;
            trigger.home_namespace = "orders".into();
            trigger.namespace = "orders".into();
            trigger
        }

        fn declaration(mode: Option<&str>, contract: Option<&str>) -> Value {
            let mut value = json!({
                "type": "registertriggertype", "id": "identity:event", "description": "identity fixture",
                "trigger_request_format": {"type": "object"}, "call_request_format": {"type": "object"}
            });
            if let Some(mode) = mode {
                value["delivery_mode"] = json!(mode);
            }
            if let Some(contract) = contract {
                value["delivery_contract"] = json!(contract);
            }
            value
        }

        async fn announce(engine: &Engine, worker: &WorkerConnection, value: Value) {
            let message: Message = serde_json::from_value(value).unwrap();
            engine.router_msg(worker, &message).await.unwrap();
        }

        #[test]
        fn shared_trigger_identity_wire_preserves_parallel_shared_v1() {
            let input = declaration(Some("parallel"), Some("shared_v1"));
            let message: Message = serde_json::from_value(input).unwrap();
            let output = serde_json::to_value(message).unwrap();
            assert_eq!(
                output["delivery_mode"], "parallel",
                "approved optional mode must survive decoding"
            );
            assert_eq!(output["delivery_contract"], "shared_v1");
        }

        #[test]
        fn shared_trigger_identity_wire_preserves_single_active_shared_v1() {
            let message: Message =
                serde_json::from_value(declaration(Some("single_active"), Some("shared_v1")))
                    .unwrap();
            let output = serde_json::to_value(message).unwrap();
            assert_eq!(output["delivery_mode"], "single_active");
            assert_eq!(output["delivery_contract"], "shared_v1");
        }

        #[test]
        fn shared_trigger_identity_legacy_wire_omits_optional_fields() {
            let input = declaration(None, None);
            let message: Message = serde_json::from_value(input.clone()).unwrap();
            assert_eq!(serde_json::to_value(message).unwrap(), input);
        }

        #[tokio::test]
        async fn shared_trigger_identity_default_mode_joins_explicit_single_active() {
            let engine = engine(true);
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            announce(&engine, &a, declaration(None, Some("shared_v1"))).await;
            announce(
                &engine,
                &b,
                declaration(Some("single_active"), Some("shared_v1")),
            )
            .await;
            engine.trigger_registry.unregister_worker(&b.id).await;
            assert!(
                engine
                    .trigger_registry
                    .trigger_types
                    .contains_key(&type_key("orders", "identity:event")),
                "default single_active and explicit single_active must retain both compatible provider owners"
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_compatible_provider_join_retains_first_owner() {
            let engine = engine(true);
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            announce(
                &engine,
                &a,
                declaration(Some("parallel"), Some("shared_v1")),
            )
            .await;
            announce(
                &engine,
                &b,
                declaration(Some("parallel"), Some("shared_v1")),
            )
            .await;
            engine.trigger_registry.unregister_worker(&b.id).await;
            assert!(
                engine
                    .trigger_registry
                    .trigger_types
                    .contains_key(&type_key("orders", "identity:event")),
                "removing a compatible provider must not discard its live peer"
            );
            engine.trigger_registry.unregister_worker(&a.id).await;
            assert!(
                !engine
                    .trigger_registry
                    .trigger_types
                    .contains_key(&type_key("orders", "identity:event"))
            );
        }

        async fn reject_join(first: Value, second: Value) {
            let engine = engine(true);
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            announce(&engine, &a, first).await;
            announce(&engine, &b, second).await;
            let incumbent = engine
                .trigger_registry
                .trigger_types
                .get(&type_key("orders", "identity:event"))
                .unwrap();
            assert_eq!(
                incumbent.worker_id,
                Some(a.id),
                "incompatible join must not replace the incumbent provider"
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_provider_schema_mismatch_rejected() {
            let first = declaration(Some("single_active"), Some("shared_v1"));
            let mut second = first.clone();
            second["trigger_request_format"] = json!({"type": "string"});
            reject_join(first, second).await;
        }

        #[tokio::test]
        async fn shared_trigger_identity_provider_call_schema_mismatch_rejected() {
            let first = declaration(Some("single_active"), Some("shared_v1"));
            let mut second = first.clone();
            second["call_request_format"] = json!({"type": "string"});
            reject_join(first, second).await;
        }

        #[tokio::test]
        async fn shared_trigger_identity_provider_mode_mismatch_rejected() {
            reject_join(
                declaration(Some("single_active"), Some("shared_v1")),
                declaration(Some("parallel"), Some("shared_v1")),
            )
            .await;
        }

        #[tokio::test]
        async fn shared_trigger_identity_provider_capability_mismatch_rejected() {
            reject_join(
                declaration(Some("single_active"), Some("shared_v1")),
                declaration(Some("single_active"), None),
            )
            .await;
        }

        #[tokio::test]
        async fn shared_trigger_identity_legacy_provider_cannot_form_replica_set() {
            reject_join(declaration(None, None), declaration(None, None)).await;
        }

        #[tokio::test]
        async fn shared_trigger_identity_parallel_requires_shared_v1() {
            let engine = engine(true);
            let (a, _rx) = connection(&engine, "orders").await;
            announce(&engine, &a, declaration(Some("parallel"), None)).await;
            assert!(
                !engine
                    .trigger_registry
                    .trigger_types
                    .contains_key(&type_key("orders", "identity:event")),
                "unfenced legacy providers cannot declare parallel delivery"
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_equal_replica_descriptors_coalesce() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            engine
                .trigger_registry
                .register_trigger(binding("replica-a", Some(a.id)))
                .await
                .unwrap();
            let mut second = binding("replica-b", Some(b.id));
            second.config =
                serde_json::from_str(r#"{"order":[1,2],"filter":{"b":2,"a":1}}"#).unwrap();
            engine
                .trigger_registry
                .register_trigger(second)
                .await
                .unwrap();
            assert_eq!(
                engine.trigger_registry.triggers.len(),
                1,
                "replica IDs are aliases, not logical identity"
            );
            assert_eq!(
                calls.register_count.load(Ordering::SeqCst),
                1,
                "joining a subscriber must not install another logical binding"
            );
            let canonical = engine
                .trigger_registry
                .triggers
                .iter()
                .next()
                .unwrap()
                .value()
                .id
                .clone();
            assert_ne!(canonical, "replica-a");
            assert_ne!(canonical, "replica-b");
            assert!(
                Uuid::parse_str(&canonical).is_ok(),
                "canonical identity is engine-generated"
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_same_alias_is_idempotent() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx) = connection(&engine, "orders").await;
            let trigger = binding("alias", Some(a.id));
            engine
                .trigger_registry
                .register_trigger(trigger.clone())
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(trigger)
                .await
                .unwrap();
            assert_eq!(engine.trigger_registry.triggers.len(), 1);
            assert_eq!(
                calls.register_count.load(Ordering::SeqCst),
                1,
                "same session/alias/descriptor is an idempotent declaration"
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_same_alias_conflicting_descriptor_rejected() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx) = connection(&engine, "orders").await;
            let original = binding("alias", Some(a.id));
            engine
                .trigger_registry
                .register_trigger(original.clone())
                .await
                .unwrap();
            let mut conflict = original.clone();
            conflict.config = json!({"changed": true});
            let error = engine
                .trigger_registry
                .register_trigger(conflict)
                .await
                .expect_err("same alias must not silently mutate its intent");
            assert!(
                error.to_string().contains("trigger_registration_conflict"),
                "{error}"
            );
            assert_eq!(calls.register_count.load(Ordering::SeqCst), 1);
            assert_eq!(
                engine
                    .trigger_registry
                    .triggers
                    .iter()
                    .next()
                    .unwrap()
                    .value()
                    .config,
                original.config
            );
        }

        #[tokio::test]
        async fn shared_trigger_identity_namespace_and_descriptor_fields_separate_intents() {
            for field in [
                "home",
                "target",
                "provider-selection",
                "type",
                "function",
                "config",
                "metadata",
                "array-order",
            ] {
                let (engine, _calls) = fixture(true).await;
                let (a, _rx_a) = connection(&engine, "orders").await;
                let (b, _rx_b) = connection(&engine, "orders").await;
                engine
                    .trigger_registry
                    .register_trigger(binding("a", Some(a.id)))
                    .await
                    .unwrap();
                let mut second = binding("b", Some(b.id));
                match field {
                    "home" => second.home_namespace = "other".into(),
                    "target" => second.namespace = "other".into(),
                    "provider-selection" => second.trigger_namespace = Some("orders".into()),
                    "type" => second.trigger_type = "identity:other".into(),
                    "function" => second.function_id = "svc::other".into(),
                    "config" => second.config = json!({"different": true}),
                    "metadata" => second.metadata = Some(json!({"team": "other"})),
                    "array-order" => second.config["order"] = json!([2, 1]),
                    _ => unreachable!(),
                }
                engine
                    .trigger_registry
                    .register_trigger(second)
                    .await
                    .unwrap();
                assert_eq!(
                    engine.trigger_registry.triggers.len()
                        + engine.trigger_registry.pending_triggers.len(),
                    2,
                    "distinct field: {field}"
                );
            }
        }

        #[tokio::test]
        async fn shared_trigger_identity_ownerless_durable_intents_remain_distinct() {
            let (engine, calls) = fixture(true).await;
            engine
                .trigger_registry
                .register_trigger(binding("durable-a", None))
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(binding("durable-b", None))
                .await
                .unwrap();
            assert_eq!(engine.trigger_registry.triggers.len(), 2);
            assert_eq!(calls.register_count.load(Ordering::SeqCst), 2);
            engine
                .trigger_registry
                .unregister_trigger("durable-a".into(), None)
                .await
                .unwrap();
            assert_eq!(engine.trigger_registry.triggers.len(), 1);
        }

        #[tokio::test]
        async fn shared_trigger_identity_alias_removal_preserves_other_subscriber() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            engine
                .trigger_registry
                .register_trigger(binding("a", Some(a.id)))
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(binding("b", Some(b.id)))
                .await
                .unwrap();
            engine
                .router_msg(
                    &a,
                    &Message::UnregisterTrigger {
                        assignment_id: None,
                        id: "a".into(),
                        trigger_type: None,
                    },
                )
                .await
                .unwrap();
            assert_eq!(engine.trigger_registry.triggers.len(), 1);
            assert_eq!(
                calls.unregister_count.load(Ordering::SeqCst),
                0,
                "removing one alias must not tear down a shared intent"
            );
            engine
                .router_msg(
                    &b,
                    &Message::UnregisterTrigger {
                        assignment_id: None,
                        id: "b".into(),
                        trigger_type: None,
                    },
                )
                .await
                .unwrap();
            assert!(engine.trigger_registry.triggers.is_empty());
            assert_eq!(calls.unregister_count.load(Ordering::SeqCst), 1);
        }

        #[tokio::test]
        async fn shared_trigger_identity_disconnect_preserves_peer_and_last_removes_intent() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            engine
                .trigger_registry
                .register_trigger(binding("a", Some(a.id)))
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(binding("b", Some(b.id)))
                .await
                .unwrap();
            engine.trigger_registry.unregister_worker(&a.id).await;
            assert_eq!(engine.trigger_registry.triggers.len(), 1);
            assert_eq!(
                calls.unregister_count.load(Ordering::SeqCst),
                0,
                "disconnect drops subscribers, not peer-owned intent"
            );
            engine.trigger_registry.unregister_worker(&b.id).await;
            assert!(engine.trigger_registry.triggers.is_empty());
            assert_eq!(calls.unregister_count.load(Ordering::SeqCst), 1);
        }

        #[tokio::test]
        async fn shared_trigger_identity_foreign_session_cannot_remove_alias() {
            let (engine, calls) = fixture(true).await;
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (foreign, _rx_b) = connection(&engine, "other").await;
            engine
                .trigger_registry
                .register_trigger(binding("private-alias", Some(a.id)))
                .await
                .unwrap();
            engine
                .router_msg(
                    &foreign,
                    &Message::UnregisterTrigger {
                        assignment_id: None,
                        id: "private-alias".into(),
                        trigger_type: None,
                    },
                )
                .await
                .unwrap();
            assert_eq!(
                engine.trigger_registry.triggers.len(),
                1,
                "aliases are scoped to the origin connection"
            );
            assert_eq!(calls.unregister_count.load(Ordering::SeqCst), 0);
        }

        #[tokio::test]
        async fn shared_trigger_identity_disabled_keeps_legacy_ids_and_repeated_registration() {
            let (engine, calls) = fixture(false).await;
            let (a, _rx_a) = connection(&engine, "orders").await;
            let (b, _rx_b) = connection(&engine, "orders").await;
            let first = binding("a", Some(a.id));
            engine
                .trigger_registry
                .register_trigger(first.clone())
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(first)
                .await
                .unwrap();
            engine
                .trigger_registry
                .register_trigger(binding("b", Some(b.id)))
                .await
                .unwrap();
            assert_eq!(engine.trigger_registry.triggers.len(), 2);
            assert!(engine.trigger_registry.triggers.contains_key("a"));
            assert!(engine.trigger_registry.triggers.contains_key("b"));
            assert_eq!(calls.register_count.load(Ordering::SeqCst), 3);
        }

        #[tokio::test]
        async fn shared_trigger_identity_provider_namespaces_remain_isolated() {
            let engine = engine(true);
            for namespace in ["orders", "other"] {
                engine
                    .trigger_registry
                    .register_trigger_type(TriggerType::new_ns(
                        namespace,
                        "identity:event",
                        "namespace fixture",
                        Box::new(MockRegistrator::new()),
                        None,
                    ))
                    .await
                    .unwrap();
            }
            assert_eq!(engine.trigger_registry.trigger_types.len(), 2);
            let (a, _rx) = connection(&engine, "orders").await;
            let trigger = binding("home", Some(a.id));
            assert_eq!(
                engine.trigger_registry.resolve_provider_key(&trigger),
                Some(type_key("orders", "identity:event"))
            );
            let mut explicit = trigger;
            explicit.trigger_namespace = Some("missing".into());
            assert!(
                engine
                    .trigger_registry
                    .resolve_provider_key(&explicit)
                    .is_none(),
                "explicit provider selection never broadens lookup"
            );
        }
    }

    #[test]
    fn with_call_response_format_sets_schema() {
        use crate::trigger_formats::HttpCallResponse;

        let tt = make_trigger_type("cron").with_call_response_format::<HttpCallResponse>();
        let schema = tt
            .call_response_format
            .expect("with_call_response_format sets call_response_format");
        assert_http_call_response_properties(&schema);
    }
}
