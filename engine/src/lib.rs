// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

//! # III Engine
//!
//! A high-performance, modular engine for orchestrating distributed function invocations,
//! event-driven workflows, and real-time communication via WebSockets.
//!
//! ## Architecture Overview
//!
//! The engine is organized into several core subsystems:
//!
//! - **[`engine`]** — Core engine that coordinates workers, functions, triggers, and services.
//! - **[`function`]** — Function registry and handler abstraction for registering callable units.
//! - **[`trigger`]** — Trigger system for event-driven function activation (cron, webhooks, queues, etc.).
//! - **[`invocation`]** — Handles function invocation lifecycle, HTTP calls, auth, and result tracking.
//! - **[`workers`]** — Worker registry managing connected SDK worker processes.
//! - **[`channels`]** — Streaming channels for real-time bidirectional data via WebSockets.
//! - **[`services`]** — Service registry grouping related functions under named services.
//! - **[`protocol`]** — Wire protocol messages exchanged between the engine and workers.
//! - **[`config`]** — Security configuration for URL validation and network policies.
//! - **[`modules`]** — Pluggable module system with adapter pattern for extensibility.
//! - **[`logging`]** — Structured logging with OpenTelemetry integration.
//! - **[`telemetry`]** — Distributed tracing via OpenTelemetry (OTLP export, W3C context propagation).
//! - **[`builtins`]** — Built-in adapter implementations (in-memory queue, KV store, pub/sub).
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use iii::{EngineBuilder, logging};
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Initialize logging (reads OTel config from the config file)
//!     logging::init_log_from_config(Some("config.yaml"));
//!
//!     // Build and start the engine from a config file
//!     EngineBuilder::new()
//!         .config_file("config.yaml")?
//!         .address("0.0.0.0:3000")
//!         .build()
//!         .await?
//!         .serve()
//!         .await?;
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Custom Modules
//!
//! The engine supports custom modules via the [`modules::module::ConfigurableModule`] trait.
//! See the `examples/custom_queue_adapter.rs` for a full walkthrough of creating a custom
//! module with pluggable adapter backends.

pub mod builtins;
pub mod channels;
pub mod condition;
pub mod config;
pub mod engine;
pub mod function;
pub mod invocation;
pub mod logging;
pub mod protocol;
pub mod services;
pub mod telemetry;
pub mod trigger;
pub mod workers;

pub mod modules {
    pub mod bridge_client;
    pub mod config;
    pub mod cron;
    pub mod http_functions;
    pub mod kv_server;
    pub mod module;
    pub mod observability;
    pub mod pubsub;
    pub mod queue;
    pub mod redis;
    pub mod registry;
    pub mod rest_api;
    pub mod shell;
    pub mod state;
    pub mod stream;
    pub mod telemetry;
    pub mod worker;
}

// Re-export commonly used types
pub use modules::config::EngineBuilder;

// todo: create a prelude module for commonly used traits and types
