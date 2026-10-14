// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

//! Real ingest → hot cache → SQLite coverage. Separate process because the
//! tracer provider and dynamic sampler are process-global OnceLocks.
use iii::workers::observability::{
    config::{ObservabilityWorkerConfig, OtelExporterType, TraceStorageConfig},
    otel::{self, trace_storage_test_support as archive},
};
use opentelemetry::trace::{Span as _, Tracer as _, TracerProvider as _};
use serde_json::json;

#[tokio::test]
async fn sdk_and_engine_spans_obey_live_sampling_in_memory_and_archive() {
    let directory = tempfile::tempdir().unwrap();
    let config = ObservabilityWorkerConfig {
        enabled: Some(true),
        exporter: Some(OtelExporterType::Memory),
        sampling_ratio: Some(0.0),
        live_spans: Some(true),
        memory_max_spans: Some(20_000),
        trace_storage: Some(TraceStorageConfig {
            directory: directory.path().to_string_lossy().into_owned(),
            ..Default::default()
        }),
        ..Default::default()
    };
    otel::set_otel_config(config.clone());
    let _layer = otel::init_otel::<tracing_subscriber::Registry>(&otel::OtelConfig::default());
    let hot = otel::get_span_storage().unwrap();
    let tracer = opentelemetry::global::tracer_provider().tracer("sampling-regression");

    for (ratio, expected) in [(0.0, 0), (0.1, 100), (1.0, 1000)] {
        otel::update_otel_config(ObservabilityWorkerConfig {
            sampling_ratio: Some(ratio),
            ..config.clone()
        });
        otel::refresh_sampler();
        hot.clear();
        otel::get_trace_disk_storage().unwrap().clear().unwrap();

        // Spread the lower 63 trace-id bits evenly: exactly 10% survive
        // TraceIdRatioBased(0.1), rather than a statistical assertion.
        let spans: Vec<_> = (0..1000_u128)
            .map(|i| {
                let id = ((2 * i + 1) * (1_u128 << 64)) / 2000;
                json!({
                    "traceId": format!("{id:032x}"), "spanId": "0000000000000001",
                    "name": "sdk-load", "kind": 1, "flags": 1,
                    "startTimeUnixNano": "1700000000000000000", "endTimeUnixNano": "0",
                    "attributes": [{"key":"iii.payload.json", "value":{"stringValue":"x".repeat(1024)}}]
                })
            })
            .collect();
        let mut request = json!({"resourceSpans":[{
            "resource":{"attributes":[{"key":"service.name","value":{"stringValue":"sdk-fixture"}}]},
            "scopeSpans":[{"spans":spans}]
        }]});
        otel::ingest_otlp_json(&request.to_string()).await.unwrap();
        assert_eq!(hot.len(), expected, "SDK start snapshots at ratio {ratio}");
        archive::flush().unwrap();
        assert!(
            archive::read_spans().unwrap().is_empty(),
            "pending is memory-only"
        );
        for span in request["resourceSpans"][0]["scopeSpans"][0]["spans"]
            .as_array_mut()
            .unwrap()
        {
            span["endTimeUnixNano"] = json!("1700000000100000000");
        }
        otel::ingest_otlp_json(&request.to_string()).await.unwrap();
        assert_eq!(hot.len(), expected, "SDK finals at ratio {ratio}");
        assert!(hot.get_spans().iter().all(|span| !span.pending));
        archive::flush().unwrap();
        assert_eq!(
            archive::read_spans().unwrap().len(),
            expected,
            "SQLite at ratio {ratio}"
        );

        // Engine spans use the provider's same sampler, not the ingest path.
        let mut span = tracer.start("engine-local");
        span.end();
        archive::flush().unwrap();
        let engine_count = hot
            .get_spans()
            .iter()
            .filter(|s| s.name == "engine-local")
            .count();
        if ratio == 0.0 || ratio == 1.0 {
            assert_eq!(engine_count, usize::from(ratio == 1.0));
        }
        eprintln!(
            "SAMPLING_EVIDENCE ratio={ratio} sdk_sent=1000 sdk_stored={expected} engine_stored={engine_count}"
        );
    }
    // A final dropped after a runtime sampler swap must remove its live
    // snapshot rather than leaving a permanently pending span.
    hot.clear();
    let mut request = json!({"resourceSpans":[{"scopeSpans":[{"spans":[{
        "traceId":"abcdef1234567890abcdef1234567890", "spanId":"1234567890abcdef",
        "name":"swapped", "startTimeUnixNano":"1", "endTimeUnixNano":"0"
    }]}]}]});
    otel::ingest_otlp_json(&request.to_string()).await.unwrap();
    assert_eq!(hot.len(), 1);
    otel::update_otel_config(ObservabilityWorkerConfig {
        sampling_ratio: Some(0.0),
        ..config
    });
    otel::refresh_sampler();
    request["resourceSpans"][0]["scopeSpans"][0]["spans"][0]["endTimeUnixNano"] = json!("2");
    otel::ingest_otlp_json(&request.to_string()).await.unwrap();
    assert!(hot.is_empty(), "dropped final removes its pending snapshot");
    archive::reset();
}
