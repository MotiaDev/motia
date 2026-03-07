// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

use std::{
    collections::HashMap,
    pin::Pin,
    sync::{Arc, RwLock},
};

use async_trait::async_trait;
use colored::Colorize;
use function_macros::{function, service};
use futures::Future;
use once_cell::sync::Lazy;
use serde::Deserialize;
use serde_json::Value;

use super::{
    config::CronModuleConfig,
    structs::{CronAdapter, CronSchedulerAdapter},
};
use crate::{
    engine::{Engine, EngineTrait, Handler, RegisterFunctionRequest},
    function::FunctionResult,
    modules::module::{AdapterFactory, ConfigurableModule, Module},
    protocol::ErrorBody,
    trigger::{Trigger, TriggerRegistrator},
};

#[derive(Clone)]
pub struct CronCoreModule {
    adapter: Arc<CronAdapter>,
    engine: Arc<Engine>,
    _config: CronModuleConfig,
}

#[derive(Deserialize)]
pub struct CronJobIdInput {
    /// The trigger ID of the cron job to target.
    id: String,
}

#[service(name = "cron")]
impl CronCoreModule {
    #[function(id = "pause_cron", description = "Pause a cron job by trigger ID")]
    pub async fn pause_cron(
        &self,
        input: CronJobIdInput,
    ) -> FunctionResult<Option<Value>, ErrorBody> {
        match self.adapter.pause(&input.id).await {
            Ok(_) => FunctionResult::Success(Some(
                serde_json::json!({ "status": "paused", "id": input.id }),
            )),
            Err(e) => FunctionResult::Failure(ErrorBody {
                code: "cron_pause_failed".into(),
                message: e.to_string(),
            }),
        }
    }

    #[function(
        id = "resume_cron",
        description = "Resume a paused cron job by trigger ID"
    )]
    pub async fn resume_cron(
        &self,
        input: CronJobIdInput,
    ) -> FunctionResult<Option<Value>, ErrorBody> {
        match self.adapter.resume(&input.id).await {
            Ok(_) => FunctionResult::Success(Some(
                serde_json::json!({ "status": "resumed", "id": input.id }),
            )),
            Err(e) => FunctionResult::Failure(ErrorBody {
                code: "cron_resume_failed".into(),
                message: e.to_string(),
            }),
        }
    }

    #[function(
        id = "list_cron_jobs",
        description = "List all cron jobs with their status"
    )]
    pub async fn list_cron_jobs(&self, _input: Value) -> FunctionResult<Option<Value>, ErrorBody> {
        let jobs = self.adapter.list_jobs().await;
        let result: Vec<Value> = jobs
            .into_iter()
            .map(|(id, function_id, paused)| {
                serde_json::json!({
                    "id": id,
                    "function_id": function_id,
                    "paused": paused,
                })
            })
            .collect();
        FunctionResult::Success(Some(serde_json::json!(result)))
    }
}

#[async_trait]
impl Module for CronCoreModule {
    fn name(&self) -> &'static str {
        "CronModule"
    }

    async fn create(engine: Arc<Engine>, config: Option<Value>) -> anyhow::Result<Box<dyn Module>> {
        Self::create_with_adapters(engine, config).await
    }

    fn register_functions(&self, engine: Arc<Engine>) {
        self.register_functions(engine);
    }

    async fn initialize(&self) -> anyhow::Result<()> {
        tracing::info!("Initializing CronModule");

        use crate::trigger::TriggerType;

        let trigger_type = TriggerType {
            id: "cron".to_string(),
            _description: "Cron-based scheduled triggers".to_string(),
            registrator: Box::new(self.clone()),
            worker_id: None,
        };

        self.engine.register_trigger_type(trigger_type).await;

        tracing::info!("{} Cron trigger type initialized", "[READY]".green());
        Ok(())
    }

    async fn start_background_tasks(
        &self,
        mut shutdown: tokio::sync::watch::Receiver<bool>,
    ) -> anyhow::Result<()> {
        let adapter = Arc::clone(&self.adapter);

        tokio::spawn(async move {
            let _ = shutdown.changed().await;
            tracing::info!("CronModule received shutdown signal, stopping cron jobs");
            adapter.shutdown().await;
        });

        Ok(())
    }

    async fn destroy(&self) -> anyhow::Result<()> {
        tracing::info!("Destroying CronModule");
        self.adapter.shutdown().await;
        Ok(())
    }
}

impl TriggerRegistrator for CronCoreModule {
    fn register_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        let cron_expression = trigger
            .config
            .get("expression")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Box::pin(async move {
            if cron_expression.is_empty() {
                tracing::error!(
                    "Cron expression is not set for trigger {}",
                    trigger.id.purple()
                );
                return Err(anyhow::anyhow!("Cron expression is required"));
            }

            let condition_function_id = trigger
                .config
                .get("_condition_path")
                .and_then(|v| v.as_str())
                .map(|v| v.to_string());

            self.adapter
                .register(
                    &trigger.id,
                    &cron_expression,
                    &trigger.function_id,
                    condition_function_id,
                )
                .await
        })
    }

    fn unregister_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        Box::pin(async move {
            tracing::debug!(trigger_id = %trigger.id, "Unregistering cron trigger");
            self.adapter.unregister(&trigger.id).await
        })
    }
}

#[async_trait]
impl ConfigurableModule for CronCoreModule {
    type Config = CronModuleConfig;
    type Adapter = dyn CronSchedulerAdapter;
    type AdapterRegistration = super::registry::CronAdapterRegistration;
    const DEFAULT_ADAPTER_CLASS: &'static str = "modules::cron::KvCronAdapter";

    async fn registry() -> &'static RwLock<HashMap<String, AdapterFactory<Self::Adapter>>> {
        static REGISTRY: Lazy<RwLock<HashMap<String, AdapterFactory<dyn CronSchedulerAdapter>>>> =
            Lazy::new(|| RwLock::new(CronCoreModule::build_registry()));
        &REGISTRY
    }

    fn build(engine: Arc<Engine>, config: Self::Config, adapter: Arc<Self::Adapter>) -> Self {
        let cron_adapter = CronAdapter::new(adapter, engine.clone());
        Self {
            engine,
            _config: config,
            adapter: Arc::new(cron_adapter),
        }
    }

    fn adapter_class_from_config(config: &Self::Config) -> Option<String> {
        config.adapter.as_ref().map(|a| a.class.clone())
    }

    fn adapter_config_from_config(config: &Self::Config) -> Option<Value> {
        config.adapter.as_ref().and_then(|a| a.config.clone())
    }
}

crate::register_module!(
    "modules::cron::CronModule",
    CronCoreModule,
    enabled_by_default = true
);
