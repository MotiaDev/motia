// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

use iii_sdk::UpdateOp;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize)]
pub struct KvSetInput {
    pub index: String,
    pub key: String,
    pub value: Value,
}

#[derive(Serialize, Deserialize)]
pub struct KvDeleteInput {
    pub index: String,
    pub key: String,
}

#[derive(Serialize, Deserialize)]
pub struct KvGetInput {
    pub index: String,
    pub key: String,
}

#[derive(Serialize, Deserialize)]
pub struct KvListKeysInput {
    pub prefix: String,
}

#[derive(Serialize, Deserialize)]
pub struct KvListKeysWithPrefixInput {
    pub prefix: String,
}

#[derive(Serialize, Deserialize)]
pub struct KvListInput {
    pub index: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateResult {
    pub old_value: Option<Value>,
    pub new_value: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KvUpdateInput {
    pub index: String,
    pub key: String,
    pub ops: Vec<UpdateOp>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn kv_set_input_roundtrip() {
        let json = json!({"index": "idx", "key": "k", "value": {"nested": true}});
        let input: KvSetInput = serde_json::from_value(json).unwrap();
        assert_eq!(input.index, "idx");
        assert_eq!(input.key, "k");
        let back = serde_json::to_value(&input).unwrap();
        assert_eq!(back["value"]["nested"], true);
    }

    #[test]
    fn kv_get_delete_input_roundtrip() {
        let json = json!({"index": "i", "key": "k"});
        let _get: KvGetInput = serde_json::from_value(json.clone()).unwrap();
        let _del: KvDeleteInput = serde_json::from_value(json).unwrap();
    }

    #[test]
    fn kv_list_keys_input_roundtrip() {
        let _lk: KvListKeysInput = serde_json::from_value(json!({"prefix": "p"})).unwrap();
        let _lkp: KvListKeysWithPrefixInput =
            serde_json::from_value(json!({"prefix": "p"})).unwrap();
        let _li: KvListInput = serde_json::from_value(json!({"index": "i"})).unwrap();
    }

    #[test]
    fn update_result_roundtrip() {
        let json = json!({"old_value": null, "new_value": 42});
        let result: UpdateResult = serde_json::from_value(json).unwrap();
        assert!(result.old_value.is_none());
        assert_eq!(result.new_value, json!(42));
        let back = serde_json::to_value(&result).unwrap();
        assert_eq!(back["new_value"], 42);
    }
}
