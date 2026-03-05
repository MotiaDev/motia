// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

use serde_json::Value;

use crate::{engine::EngineTrait, protocol::ErrorBody};

/// Evaluates a condition function against the provided data.
///
/// Returns:
/// - `Ok(true)` — proceed with the handler (condition passed or returned no value)
/// - `Ok(false)` — skip the handler (condition explicitly returned `false`)
/// - `Err(ErrorBody)` — condition function invocation failed
pub async fn check_condition<E: EngineTrait>(
    engine: &E,
    condition_function_id: &str,
    data: Value,
) -> Result<bool, ErrorBody> {
    match engine.call(condition_function_id, data).await {
        Ok(Some(result)) => Ok(result.as_bool() != Some(false)),
        Ok(None) => {
            tracing::warn!(
                condition_function_id = %condition_function_id,
                "Condition function returned no result"
            );
            Ok(true)
        }
        Err(e) => Err(e),
    }
}
