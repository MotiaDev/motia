// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

//! Which containers need the sandbox adapter, the generated container that
//! installs it, and the start order that puts the adapter ahead of them.

use std::{
    collections::{BTreeMap, BTreeSet},
    path::Path,
};

use iii_sandbox_contract::{CONTRACT_MAJOR, DEFAULT_ADAPTER};
use sha2::{Digest, Sha256};

use crate::{
    config::{ComposeFile, WorkerSource},
    edit::{self, NewContainer, Source},
    error::Result,
    lockfile::PreparedLock,
    manifest::read_manifest,
};

/// Why a project needs the sandbox adapter.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Need {
    /// A registry bundle container, by key.
    VmBundle(String),
    /// A `path://` container whose manifest sets `runtime.base_image`, by key.
    VmLocal(String),
    /// The file sets `engine.sandbox`.
    Explicit,
}

/// The VM containers in declaration order, then `engine.sandbox`. Only a
/// lock-attached package is known to be a bundle, so call it after
/// `lockfile::attach` or `prepare`.
pub fn needs(file: &ComposeFile) -> Vec<Need> {
    let mut needs: Vec<Need> = file
        .containers
        .iter()
        .filter_map(|(key, container)| match &container.worker {
            WorkerSource::Package { .. } => container
                .resolved_package
                .as_ref()
                .is_some_and(|package| package.kind == "bundle")
                .then(|| Need::VmBundle(key.clone())),
            // A broken manifest is `validate_offline`'s to report.
            WorkerSource::Path { dir, .. } => read_manifest(dir)
                .ok()
                .flatten()
                .is_some_and(|manifest| manifest.base_image.is_some())
                .then(|| Need::VmLocal(key.clone())),
        })
        .collect();
    if file
        .engine
        .as_ref()
        .is_some_and(|engine| engine.sandbox.is_some())
    {
        needs.push(Need::Explicit);
    }
    needs
}

/// The VM container keys in `needs`, or `engine.sandbox` when the section is
/// the only need: what a message names as needing the adapter.
pub(crate) fn needed_by(needs: &[Need]) -> Vec<&str> {
    let keys: Vec<&str> = needs
        .iter()
        .filter_map(|need| match need {
            Need::VmBundle(key) | Need::VmLocal(key) => Some(key.as_str()),
            Need::Explicit => None,
        })
        .collect();
    if keys.is_empty() {
        vec!["engine.sandbox"]
    } else {
        keys
    }
}

/// `engine.sandbox.adapter`, else [`DEFAULT_ADAPTER`]. An attached project has
/// no `engine:`, so its VMs go through the default adapter.
pub fn adapter_name(file: &ComposeFile) -> &str {
    file.engine
        .as_ref()
        .and_then(|engine| engine.sandbox.as_ref())
        .map_or(DEFAULT_ADAPTER, |sandbox| sandbox.adapter.as_str())
}

/// The first container that runs `adapter`, known by its package or manifest
/// name, never by its key: the key only becomes `III_WORKER_NAME`.
pub fn adapter_key(file: &ComposeFile, adapter: &str) -> Result<Option<String>> {
    for (key, container) in &file.containers {
        let name = match &container.worker {
            WorkerSource::Package { reference } => Some(match &container.resolved_package {
                Some(package) => package
                    .alias_of
                    .clone()
                    .unwrap_or_else(|| package.name.clone()),
                None => crate::registry::split_reference(reference).1,
            }),
            WorkerSource::Path { dir, .. } => {
                read_manifest(dir)?.and_then(|manifest| manifest.name)
            }
        };
        if name.as_deref() == Some(adapter) {
            return Ok(Some(key.clone()));
        }
    }
    Ok(None)
}

/// Starts every VM container after `adapter_key`. The edge lives in memory
/// only, so an operator's container is never rewritten. An adapter that is
/// itself a VM container is a `DEPENDENCY_CYCLE`.
pub fn wire(file: &mut ComposeFile, adapter_key: &str) -> Result<()> {
    for need in needs(file) {
        let (Need::VmBundle(key) | Need::VmLocal(key)) = need else {
            continue;
        };
        let start_after = &mut file.containers[&key].start_after;
        if !start_after
            .iter()
            .any(|dependency| dependency == adapter_key)
        {
            start_after.push(adapter_key.to_string());
        }
    }
    crate::dag::validate_dependencies(file)
}

/// [`wire`] to this project's adapter container; no adapter, no change.
pub(crate) fn wire_adapter(file: &mut ComposeFile) -> Result<()> {
    match adapter_key(file, adapter_name(file))? {
        Some(key) => wire(file, &key),
        None => Ok(()),
    }
}

/// `package://<adapter>` at the newest release within this engine's contract
/// major, pinned to that exact version.
pub(crate) async fn adapter_request(adapter: &str) -> Result<NewContainer> {
    let mut request = edit::parse_worker(adapter)?;
    if let Source::Package { reference, version } = &mut request.source {
        let node =
            crate::registry::resolve_node(&request.key, reference, &format!("^{CONTRACT_MAJOR}"))
                .await?;
        *version = Some(node.version);
    }
    Ok(request)
}

/// What the sandbox step does to the file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum AdapterChange {
    Upsert(NewContainer),
    Remove(String),
}

/// Adds the adapter a VM needs, re-resolves (`refresh`) or removes
/// (`allow_remove`) the one Compose generated. An operator's adapter, of any
/// key, version or source, is never touched. `file` must be lock-attached.
pub(crate) async fn adapter_change(
    text: &str,
    file: &ComposeFile,
    refresh: bool,
    allow_remove: bool,
) -> Result<Option<AdapterChange>> {
    let adapter = adapter_name(file);
    let needed = !needs(file).is_empty();
    let Some(key) = adapter_key(file, adapter)? else {
        if !needed {
            return Ok(None);
        }
        return Ok(Some(AdapterChange::Upsert(adapter_request(adapter).await?)));
    };
    let container = &file.containers[&key];
    // `compose::add` marks a `path://` request too; only a package is ours.
    if !matches!(container.worker, WorkerSource::Package { .. })
        || !edit::is_generated_container(text, &key)?
    {
        return Ok(None);
    }
    if !needed {
        return Ok(allow_remove.then_some(AdapterChange::Remove(key)));
    }
    if !refresh {
        return Ok(None);
    }
    let mut request = adapter_request(adapter).await?;
    let unchanged = matches!(&request.source, Source::Package { version, .. }
        if version.as_deref() == container.version.as_deref());
    request.key = key;
    Ok((!unchanged).then_some(AdapterChange::Upsert(request)))
}

/// `compose::add iii-sandbox`: the engine's router is built in, so the request
/// means its adapter.
pub(crate) fn is_iii_sandbox(worker: &NewContainer) -> bool {
    worker.key == "iii-sandbox" && matches!(worker.source, Source::Package { .. })
}

/// What `compose::add iii-sandbox` asks for: the declared adapter as it is
/// declared, else a new one.
pub(crate) async fn iii_sandbox_request(file: &ComposeFile) -> Result<NewContainer> {
    let adapter = adapter_name(file);
    let Some(key) = adapter_key(file, adapter)? else {
        return adapter_request(adapter).await;
    };
    let container = &file.containers[&key];
    let mut request = edit::parse_worker(&match &container.worker {
        WorkerSource::Package { reference } => format!("package://{reference}"),
        WorkerSource::Path { declared, .. } => declared.clone(),
    })?;
    request.key = key;
    if let Source::Package { version, .. } = &mut request.source {
        version.clone_from(&container.version);
    }
    Ok(request)
}

/// Applies [`adapter_change`] to `edited` and `current`, then prepares the lock
/// again: the adapter at its exact version, every other entry at the version
/// the first pass chose, so nothing else resolves differently.
#[allow(clippy::too_many_arguments)]
pub(crate) async fn apply_adapter_change(
    path: &Path,
    edited: &mut String,
    current: &mut ComposeFile,
    prepared: &mut PreparedLock,
    force: &mut BTreeSet<String>,
    selected: &mut BTreeMap<String, String>,
    refresh: bool,
    allow_remove: bool,
) -> Result<Option<AdapterChange>> {
    let Some(change) = adapter_change(edited, current, refresh, allow_remove).await? else {
        return Ok(None);
    };
    let next = match &change {
        AdapterChange::Upsert(request) => {
            if let Source::Package {
                version: Some(version),
                ..
            } = &request.source
            {
                force.insert(request.key.clone());
                selected.insert(request.key.clone(), version.clone());
            }
            match edit::upsert_container(edited, request)? {
                edit::Outcome::Added(text) | edit::Outcome::Replaced { text, .. } => Some(text),
                edit::Outcome::Unchanged => None,
            }
        }
        AdapterChange::Remove(key) => edit::remove_container(edited, key)?,
    };
    if let Some(next) = next {
        *edited = next;
    }
    *current = ComposeFile::parse(edited, path)?;
    let mut versions = selected.clone();
    for key in current.containers.keys() {
        if let Some(version) = prepared.resolved_version(key) {
            versions
                .entry(key.clone())
                .or_insert_with(|| version.to_string());
        }
    }
    *prepared = crate::lockfile::prepare_metadata_with_versions(current, force, &versions).await?;
    Ok(Some(change))
}

/// The VM's identity at the adapter: hex SHA-256 over the project's state
/// directory, a NUL, then the container key.
pub fn state_key(state_dir: &Path, key: &str) -> String {
    let mut digest = Sha256::new();
    digest.update(state_dir.as_os_str().as_encoded_bytes());
    digest.update([0]);
    digest.update(key.as_bytes());
    hex::encode(digest.finalize())
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;

    fn parse(dir: &Path, text: &str) -> ComposeFile {
        ComposeFile::parse(text, dir.join("worker-compose.yaml")).unwrap()
    }

    fn manifest(dir: &Path, worker: &str, text: &str) {
        std::fs::create_dir_all(dir.join(worker)).unwrap();
        std::fs::write(dir.join(worker).join("iii.worker.yaml"), text).unwrap();
    }

    fn package(fields: &str) -> crate::registry::ResolvedPackage {
        serde_yaml::from_str(&format!("{{version: 1.0.0, artifacts: {{}}, {fields}}}")).unwrap()
    }

    fn vm_project(dir: &Path) -> ComposeFile {
        manifest(
            dir,
            "local",
            "runtime: {base_image: python}\nscripts: {start: run}\n",
        );
        let mut file = parse(
            dir,
            "engine: {sandbox: {}}\ncontainers:\n  sb: {worker: package://sandbox-builtin, version: 1.0.0}\n  app: {worker: package://app, version: 1.0.0}\n  bin: {worker: package://bin, version: 1.0.0}\n  local: {worker: path://./local}\n",
        );
        file.containers["app"].resolved_package = Some(package("name: app, type: bundle"));
        file.containers["bin"].resolved_package = Some(package("name: bin, type: binary"));
        file
    }

    #[test]
    fn needs_lists_bundles_base_images_and_the_section() {
        let dir = tempfile::tempdir().unwrap();
        let file = vm_project(dir.path());
        assert_eq!(
            needs(&file),
            vec![
                Need::VmBundle("app".into()),
                Need::VmLocal("local".into()),
                Need::Explicit
            ]
        );
    }

    #[test]
    fn the_adapter_is_found_by_manifest_name_not_by_key() {
        let dir = tempfile::tempdir().unwrap();
        let dir = dir.path();
        manifest(dir, "other", "name: other\n");
        manifest(dir, "dev", "name: sandbox-builtin\n");
        let adapter = |text: &str| adapter_key(&parse(dir, text), "sandbox-builtin").unwrap();
        assert_eq!(
            adapter("containers:\n  sb: {worker: package://sandbox-builtin, version: 1.0.0}\n"),
            Some("sb".into())
        );
        assert_eq!(
            adapter("containers:\n  sandbox-builtin: {worker: path://./other}\n"),
            None
        );
        assert_eq!(
            adapter("containers:\n  dev: {worker: path://./dev}\n"),
            Some("dev".into())
        );
        // A resolved alias is known by the package it stands for.
        let mut file = parse(
            dir,
            "containers:\n  sb: {worker: package://my-sandbox, version: 1.0.0}\n",
        );
        file.containers["sb"].resolved_package = Some(package(
            "name: my-sandbox, alias_of: sandbox-builtin, type: binary",
        ));
        assert_eq!(
            adapter_key(&file, "sandbox-builtin").unwrap(),
            Some("sb".into())
        );
    }

    #[test]
    fn wire_starts_every_vm_after_the_adapter_in_memory() {
        let dir = tempfile::tempdir().unwrap();
        let mut file = vm_project(dir.path());
        wire(&mut file, "sb").unwrap();
        assert!(file.containers["app"].start_after.contains(&"sb".into()));
        assert!(file.containers["local"].start_after.contains(&"sb".into()));
        assert!(!file.containers["bin"].start_after.contains(&"sb".into()));
        wire(&mut file, "sb").unwrap();
        assert_eq!(file.containers["app"].start_after, vec!["sb".to_string()]);
        assert_eq!(file.start_order().unwrap()[0], "sb");
    }

    #[test]
    fn an_adapter_that_is_a_vm_container_is_a_dependency_cycle() {
        let dir = tempfile::tempdir().unwrap();
        let dir = dir.path();
        manifest(
            dir,
            "dev",
            "name: sandbox-builtin\nruntime: {base_image: python}\nscripts: {start: x}\n",
        );
        let mut file = parse(dir, "containers:\n  dev: {worker: path://./dev}\n");
        assert_eq!(
            wire_adapter(&mut file).unwrap_err().code(),
            "DEPENDENCY_CYCLE"
        );

        // No declared adapter: nothing to order after.
        let mut file = parse(
            dir,
            "engine: {sandbox: {adapter: sandbox-docker}}\ncontainers:\n  dev: {worker: path://./dev}\n",
        );
        wire_adapter(&mut file).unwrap();
        assert!(file.containers["dev"].start_after.is_empty());
    }

    /// A registry whose `/resolve` answers `sandbox-builtin` 1.2.3 for this
    /// host, and serves `archive` as its artifact.
    pub(crate) async fn adapter_registry(archive: &[u8]) -> wiremock::MockServer {
        use wiremock::{Mock, MockServer, ResponseTemplate, matchers};
        let server = MockServer::start().await;
        Mock::given(matchers::method("POST"))
            .and(matchers::path("/resolve"))
            .and(matchers::body_partial_json(
                serde_json::json!({ "worker": "sandbox-builtin" }),
            ))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "graph": [{
                    "name": "sandbox-builtin",
                    "version": "1.2.3",
                    "type": "binary",
                    "binaries": { (crate::registry::host_targets()[0]): {
                        "sha256": hex::encode(Sha256::digest(archive)),
                        "url": format!("{}/artifact", server.uri()),
                    }},
                }]
            })))
            .mount(&server)
            .await;
        Mock::given(matchers::method("GET"))
            .and(matchers::path("/artifact"))
            .respond_with(ResponseTemplate::new(200).set_body_bytes(archive.to_vec()))
            .mount(&server)
            .await;
        server
    }

    /// `text` with a generated `sandbox-builtin` 1.2.3 appended.
    fn with_generated_adapter(text: &str) -> String {
        let request = edit::parse_worker("sandbox-builtin@1.2.3").unwrap();
        let edit::Outcome::Added(text) = edit::upsert_container(text, &request).unwrap() else {
            panic!("the adapter is new");
        };
        text
    }

    #[tokio::test]
    async fn the_adapter_resolves_within_the_contract_major_and_pins_the_exact_release() {
        let server = adapter_registry(b"").await;
        let request = crate::registry::TEST_REGISTRY
            .scope(server.uri(), adapter_request("sandbox-builtin"))
            .await
            .unwrap();
        assert_eq!(
            request.source,
            edit::Source::Package {
                reference: "api.workers.iii.dev/sandbox-builtin".into(),
                version: Some("1.2.3".into())
            }
        );
        let asked: serde_json::Value =
            serde_json::from_slice(&server.received_requests().await.unwrap()[0].body).unwrap();
        assert_eq!(asked["version"], "^1");
        let edit::Outcome::Added(text) =
            edit::upsert_container("containers: {}\n", &request).unwrap()
        else {
            panic!("the adapter is new");
        };
        assert!(edit::is_generated_container(&text, "sandbox-builtin").unwrap());
    }

    #[tokio::test]
    async fn a_generated_adapter_goes_with_its_last_vm() {
        let dir = tempfile::tempdir().unwrap();
        let text = with_generated_adapter("containers: {}\n");
        let file = parse(dir.path(), &text);
        assert_eq!(
            adapter_change(&text, &file, false, true).await.unwrap(),
            Some(AdapterChange::Remove("sandbox-builtin".into()))
        );
        // up, build and add never remove it, so up leaves the file as it is.
        assert_eq!(
            adapter_change(&text, &file, false, false).await.unwrap(),
            None
        );
    }

    #[tokio::test]
    async fn an_operator_adapter_is_never_added_twice_refreshed_or_removed() {
        let dir = tempfile::tempdir().unwrap();
        let dir = dir.path();
        // No mock: any registry call fails the test instead of leaving the host.
        let registry = wiremock::MockServer::start().await;
        let change = |text: String, bundle: bool| {
            let mut file = parse(dir, &text);
            if bundle {
                file.containers["app"].resolved_package = Some(package("name: app, type: bundle"));
            }
            crate::registry::TEST_REGISTRY.scope(registry.uri(), async move {
                adapter_change(&text, &file, true, true).await.unwrap()
            })
        };
        let pinned = "containers:\n  sb: {worker: package://sandbox-builtin, version: 1.0.0}\n";
        let app = "  app: {worker: package://app, version: 1.0.0}\n";
        assert_eq!(change(format!("{pinned}{app}"), true).await, None);
        assert_eq!(change(pinned.to_string(), false).await, None);

        manifest(dir, "dev", "name: sandbox-builtin\n");
        let checkout = "containers:\n  sandbox-builtin: {worker: path://./dev}\n";
        assert_eq!(change(format!("{checkout}{app}"), true).await, None);
    }

    #[test]
    fn compose_add_iii_sandbox_names_the_adapter() {
        assert!(is_iii_sandbox(&edit::parse_worker("iii-sandbox").unwrap()));
        assert!(!is_iii_sandbox(
            &edit::parse_worker("./iii-sandbox").unwrap()
        ));
    }

    #[test]
    fn state_key_is_stable_per_state_dir_and_container() {
        let key = state_key(Path::new("/srv/app/.iii/compose/shop"), "web");
        assert_eq!(key.len(), 64);
        assert!(key.bytes().all(|b| b.is_ascii_hexdigit()));
        assert_eq!(
            key,
            state_key(Path::new("/srv/app/.iii/compose/shop"), "web")
        );
        assert_ne!(
            key,
            state_key(Path::new("/srv/app/.iii/compose/shop"), "api")
        );
        assert_ne!(
            key,
            state_key(Path::new("/srv/other/.iii/compose/shop"), "web")
        );
    }
}
