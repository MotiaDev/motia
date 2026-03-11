// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

//! Built-in adapter implementations for the engine's module system.
//!
//! These adapters provide default, zero-configuration backends for core modules:
//!
//! - [`kv`] — In-memory key-value store adapter.
//! - [`pubsub_lite`] — Lightweight in-process pub/sub adapter.
//! - [`queue`] — In-memory queue adapter with DLQ support.
//! - [`queue_kv`] — Queue adapter backed by the KV store.

pub mod kv;
pub mod pubsub_lite;
pub mod queue;
pub mod queue_kv;
