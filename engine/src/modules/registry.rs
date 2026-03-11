// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

//! Adapter and module registration via compile-time inventory.
//!
//! This module provides the registration infrastructure used by [`ConfigurableModule`](super::module::ConfigurableModule)
//! and the `register_adapter!` / `register_module!` macros.

use std::{future::Future, pin::Pin, sync::Arc};

use serde_json::Value;

use crate::{engine::Engine, modules::module::Module};

/// Future type returned by adapter factory functions.
pub type AdapterFuture<A> = Pin<Box<dyn Future<Output = anyhow::Result<Arc<A>>> + Send>>;

/// Compile-time adapter registration entry collected via [`inventory`].
///
/// Created by the `register_adapter!` macro. Each entry maps a class name
/// to a factory function that creates the adapter.
pub struct AdapterRegistration<A: ?Sized + Send + Sync + 'static> {
    pub class: &'static str,
    pub factory: fn(Arc<Engine>, Option<Value>) -> AdapterFuture<A>,
}

/// Trait for accessing adapter registration metadata.
pub trait AdapterRegistrationEntry<A: ?Sized + Send + Sync + 'static>:
    Send + Sync + 'static
{
    fn class(&self) -> &'static str;
    fn factory(&self) -> fn(Arc<Engine>, Option<Value>) -> AdapterFuture<A>;
}

impl<A: ?Sized + Send + Sync + 'static> AdapterRegistrationEntry<A> for AdapterRegistration<A> {
    fn class(&self) -> &'static str {
        self.class
    }

    fn factory(&self) -> fn(Arc<Engine>, Option<Value>) -> AdapterFuture<A> {
        self.factory
    }
}

/// Registers an adapter implementation at compile time using [`inventory`].
///
/// # Usage
///
/// ```rust,ignore
/// iii::register_adapter!(<MyAdapterRegistration> "my::InMemoryAdapter", make_inmemory_adapter);
/// ```
#[macro_export]
macro_rules! register_adapter {
    (<$registration:path> $class:expr, $factory:expr) => {
        ::inventory::submit! {
            $registration {
                class: $class,
                factory: $factory,
            }
        }
    };
    ($registration:path, $class:expr, $factory:expr) => {
        ::inventory::submit! {
            $registration {
                class: $class,
                factory: $factory,
            }
        }
    };
}

/// Future type returned by module factory functions.
pub type ModuleFuture = Pin<Box<dyn Future<Output = anyhow::Result<Box<dyn Module>>> + Send>>;

/// Compile-time module registration entry collected via [`inventory`].
///
/// Modules can be:
/// - **mandatory** — Always loaded regardless of config.
/// - **default** — Loaded unless explicitly excluded.
/// - **opt-in** — Only loaded if listed in config.
///
/// Created by the `register_module!` macro.
pub struct ModuleRegistration {
    pub class: &'static str,
    pub factory: fn(Arc<Engine>, Option<Value>) -> ModuleFuture,
    pub is_default: bool,
    pub mandatory: bool,
}

/// Registers a module implementation at compile time using [`inventory`].
///
/// # Variants
///
/// ```rust,ignore
/// // Mandatory module (always loaded)
/// register_module!("modules::worker::WorkerModule", WorkerModule, mandatory);
///
/// // Default-enabled module (loaded unless config says otherwise)
/// register_module!("modules::queue::QueueModule", QueueCoreModule, enabled_by_default = true);
///
/// // Opt-in module (only loaded if listed in config)
/// register_module!("modules::redis::RedisModule", RedisModule);
/// ```
#[macro_export]
macro_rules! register_module {
    ($class:expr, $module:ty, mandatory) => {
        ::inventory::submit! {
            $crate::modules::registry::ModuleRegistration {
                class: $class,
                factory: < $module as $crate::modules::module::Module >::make_module,
                is_default: true,
                mandatory: true,
            }
        }
    };
    ($class:expr, $module:ty, enabled_by_default = $enabled_by_default:expr) => {
        ::inventory::submit! {
            $crate::modules::registry::ModuleRegistration {
                class: $class,
                factory: < $module as $crate::modules::module::Module >::make_module,
                is_default: $enabled_by_default,
                mandatory: false,
            }
        }
    };
    ($class:expr, $module:ty) => {
        ::inventory::submit! {
            $crate::modules::registry::ModuleRegistration {
                class: $class,
                factory: < $module as $crate::modules::module::Module >::make_module,
                is_default: false,
                mandatory: false,
            }
        }
    };
}
inventory::collect!(ModuleRegistration);

#[cfg(test)]
mod tests {
    use super::*;

    fn dummy_adapter_factory(
        _engine: Arc<Engine>,
        _config: Option<Value>,
    ) -> AdapterFuture<dyn Send + Sync> {
        Box::pin(async { Ok(Arc::new(()) as Arc<dyn Send + Sync>) })
    }

    #[test]
    fn adapter_registration_class_and_factory() {
        let reg = AdapterRegistration::<dyn Send + Sync> {
            class: "test-adapter",
            factory: dummy_adapter_factory,
        };
        assert_eq!(
            AdapterRegistrationEntry::<dyn Send + Sync>::class(&reg),
            "test-adapter"
        );
        let _f = AdapterRegistrationEntry::<dyn Send + Sync>::factory(&reg);
    }

    fn dummy_module_factory(_engine: Arc<Engine>, _config: Option<Value>) -> ModuleFuture {
        Box::pin(async { unimplemented!() })
    }

    #[test]
    fn module_registration_fields() {
        let reg = ModuleRegistration {
            class: "test-module",
            factory: dummy_module_factory,
            is_default: true,
            mandatory: false,
        };
        assert_eq!(reg.class, "test-module");
        assert!(reg.is_default);
        assert!(!reg.mandatory);
    }
}
