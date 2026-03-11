window.BENCHMARK_DATA = {
  "lastUpdate": 1773249757784,
  "repoUrl": "https://github.com/iii-hq/iii",
  "entries": {
    "iii Engine Benchmarks": [
      {
        "commit": {
          "author": {
            "name": "Guilherme Beira",
            "username": "guibeira",
            "email": "guilherme.vieira.beira@gmail.com"
          },
          "committer": {
            "name": "Guilherme Beira",
            "username": "guibeira",
            "email": "guilherme.vieira.beira@gmail.com"
          },
          "id": "811393dfa29bfc5efebae2abb502862c7ad9e30b",
          "message": "fix: use --bench '*' instead of --benches in benchmark workflow\n\n--benches includes the lib target which uses the default test harness\nand doesn't support --output-format bencher (a Criterion flag). Using\n--bench '*' runs only the bench targets in benches/ which all use\nCriterion with harness = false.",
          "timestamp": "2026-03-11T16:57:57Z",
          "url": "https://github.com/iii-hq/iii/commit/811393dfa29bfc5efebae2abb502862c7ad9e30b"
        },
        "date": 1773249756485,
        "tool": "cargo",
        "benches": [
          {
            "name": "concurrent_invocation/1",
            "value": 2961,
            "range": "± 11",
            "unit": "ns/iter"
          },
          {
            "name": "concurrent_invocation/8",
            "value": 21559,
            "range": "± 435",
            "unit": "ns/iter"
          },
          {
            "name": "concurrent_invocation/32",
            "value": 89757,
            "range": "± 1080",
            "unit": "ns/iter"
          },
          {
            "name": "concurrent_invocation/128",
            "value": 365265,
            "range": "± 2845",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/functions_register_remove/100",
            "value": 42506,
            "range": "± 1436",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/workers_register_unregister/100",
            "value": 158887,
            "range": "± 501",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/triggers_register_unregister/100",
            "value": 85698,
            "range": "± 1009",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/functions_register_remove/1000",
            "value": 447912,
            "range": "± 5309",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/workers_register_unregister/1000",
            "value": 4395639,
            "range": "± 34957",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/triggers_register_unregister/1000",
            "value": 845987,
            "range": "± 2311",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/functions_register_remove/5000",
            "value": 2271485,
            "range": "± 12495",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/workers_register_unregister/5000",
            "value": 25572172,
            "range": "± 925926",
            "unit": "ns/iter"
          },
          {
            "name": "control_plane_churn/triggers_register_unregister/5000",
            "value": 4264016,
            "range": "± 10214",
            "unit": "ns/iter"
          },
          {
            "name": "core_runtime/engine_call_registered_handler",
            "value": 2318,
            "range": "± 41",
            "unit": "ns/iter"
          },
          {
            "name": "http_concurrency_loopback/1",
            "value": 537448,
            "range": "± 5212",
            "unit": "ns/iter"
          },
          {
            "name": "http_concurrency_loopback/8",
            "value": 42241400,
            "range": "± 308500",
            "unit": "ns/iter"
          },
          {
            "name": "http_concurrency_loopback/32",
            "value": 46536290,
            "range": "± 501009",
            "unit": "ns/iter"
          },
          {
            "name": "http_concurrency_loopback/128",
            "value": 56390284,
            "range": "± 4440483",
            "unit": "ns/iter"
          },
          {
            "name": "http_many_routes_loopback/1",
            "value": 333306,
            "range": "± 11501",
            "unit": "ns/iter"
          },
          {
            "name": "http_many_routes_loopback/10",
            "value": 352367,
            "range": "± 8348",
            "unit": "ns/iter"
          },
          {
            "name": "http_many_routes_loopback/100",
            "value": 533931,
            "range": "± 10687",
            "unit": "ns/iter"
          },
          {
            "name": "http_many_routes_loopback/1000",
            "value": 2466970,
            "range": "± 118745",
            "unit": "ns/iter"
          },
          {
            "name": "http_single_route_loopback/post_json",
            "value": 338864,
            "range": "± 12302",
            "unit": "ns/iter"
          },
          {
            "name": "invoke_function_payload_sizes/1kb",
            "value": 1916,
            "range": "± 30",
            "unit": "ns/iter"
          },
          {
            "name": "invoke_function_payload_sizes/10kb",
            "value": 2663,
            "range": "± 32",
            "unit": "ns/iter"
          },
          {
            "name": "invoke_function_payload_sizes/100kb",
            "value": 9052,
            "range": "± 63",
            "unit": "ns/iter"
          },
          {
            "name": "invoke_function_payload_sizes/1mb",
            "value": 106814,
            "range": "± 1519",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/set_overwrite",
            "value": 1132,
            "range": "± 19",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/get_hit",
            "value": 348,
            "range": "± 2",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/get_miss",
            "value": 103,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/delete",
            "value": 1017,
            "range": "± 10",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/update_set_field",
            "value": 578,
            "range": "± 19",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/update_increment",
            "value": 567,
            "range": "± 10",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/update_merge",
            "value": 1191,
            "range": "± 27",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store_contention/1",
            "value": 374,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store_contention/4",
            "value": 1471,
            "range": "± 4",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store_contention/16",
            "value": 5773,
            "range": "± 44",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store_contention/64",
            "value": 29564,
            "range": "± 457",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/list_100_items",
            "value": 38442,
            "range": "± 389",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/list_keys_with_prefix",
            "value": 433,
            "range": "± 7",
            "unit": "ns/iter"
          },
          {
            "name": "kv_store/list_groups",
            "value": 281,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/Ping",
            "value": 38,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/Pong",
            "value": 37,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/RegisterFunction",
            "value": 244,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/RegisterTrigger",
            "value": 240,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/InvokeFunction",
            "value": 435,
            "range": "± 2",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/InvocationResult",
            "value": 455,
            "range": "± 6",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/InvocationResult_Error",
            "value": 277,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_serialize/WorkerRegistered",
            "value": 91,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/Ping",
            "value": 106,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/Pong",
            "value": 105,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/RegisterFunction",
            "value": 774,
            "range": "± 3",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/RegisterTrigger",
            "value": 800,
            "range": "± 12",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/InvokeFunction",
            "value": 1387,
            "range": "± 15",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/InvocationResult",
            "value": 1514,
            "range": "± 29",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/InvocationResult_Error",
            "value": 615,
            "range": "± 16",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_deserialize/WorkerRegistered",
            "value": 221,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/Ping",
            "value": 127,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/Pong",
            "value": 126,
            "range": "± 2",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/RegisterFunction",
            "value": 1038,
            "range": "± 8",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/RegisterTrigger",
            "value": 1055,
            "range": "± 10",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/InvokeFunction",
            "value": 1838,
            "range": "± 44",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/InvocationResult",
            "value": 2046,
            "range": "± 12",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/InvocationResult_Error",
            "value": 909,
            "range": "± 5",
            "unit": "ns/iter"
          },
          {
            "name": "protocol_roundtrip/WorkerRegistered",
            "value": 283,
            "range": "± 6",
            "unit": "ns/iter"
          },
          {
            "name": "pubsub_fanout/1",
            "value": 35621,
            "range": "± 847",
            "unit": "ns/iter"
          },
          {
            "name": "pubsub_fanout/8",
            "value": 58137,
            "range": "± 588",
            "unit": "ns/iter"
          },
          {
            "name": "pubsub_fanout/32",
            "value": 110775,
            "range": "± 6820",
            "unit": "ns/iter"
          },
          {
            "name": "pubsub_fanout/128",
            "value": 328264,
            "range": "± 10470",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue/push_single",
            "value": 7317,
            "range": "± 192",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_concurrent/1",
            "value": 7282,
            "range": "± 86",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_concurrent/4",
            "value": 25041,
            "range": "± 314",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_concurrent/16",
            "value": 97996,
            "range": "± 1725",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_concurrent/64",
            "value": 394340,
            "range": "± 4955",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_payload_sizes/1kb",
            "value": 6363,
            "range": "± 48",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_payload_sizes/10kb",
            "value": 7238,
            "range": "± 106",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_payload_sizes/100kb",
            "value": 50812,
            "range": "± 230",
            "unit": "ns/iter"
          },
          {
            "name": "queue_enqueue_payload_sizes/1mb",
            "value": 152294,
            "range": "± 3188",
            "unit": "ns/iter"
          },
          {
            "name": "startup/build_and_destroy_engine_from_minimal_config",
            "value": 98748,
            "range": "± 2812",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/set_overwrite",
            "value": 1415,
            "range": "± 15",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/get_hit",
            "value": 384,
            "range": "± 2",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/get_miss",
            "value": 127,
            "range": "± 0",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/delete",
            "value": 1423,
            "range": "± 18",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/update_increment",
            "value": 431,
            "range": "± 3",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/list_100",
            "value": 38110,
            "range": "± 96",
            "unit": "ns/iter"
          },
          {
            "name": "state_adapter/list_groups",
            "value": 103,
            "range": "± 1",
            "unit": "ns/iter"
          },
          {
            "name": "trigger_fanout/1",
            "value": 35745,
            "range": "± 984",
            "unit": "ns/iter"
          },
          {
            "name": "trigger_fanout/8",
            "value": 59529,
            "range": "± 654",
            "unit": "ns/iter"
          },
          {
            "name": "trigger_fanout/32",
            "value": 122698,
            "range": "± 3094",
            "unit": "ns/iter"
          },
          {
            "name": "trigger_fanout/128",
            "value": 430949,
            "range": "± 10009",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/functions/10",
            "value": 7507,
            "range": "± 3221",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/functions/50",
            "value": 29836,
            "range": "± 1530",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/functions/200",
            "value": 111135,
            "range": "± 4342",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/invocations/10",
            "value": 2139,
            "range": "± 369",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/invocations/50",
            "value": 3173,
            "range": "± 213",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/invocations/200",
            "value": 7011,
            "range": "± 195",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/triggers/10",
            "value": 7696,
            "range": "± 445",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/triggers/50",
            "value": 27695,
            "range": "± 779",
            "unit": "ns/iter"
          },
          {
            "name": "worker_cleanup/triggers/200",
            "value": 95897,
            "range": "± 2838",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking/add_remove_sequential",
            "value": 834,
            "range": "± 7",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking_concurrent/1",
            "value": 1022,
            "range": "± 7",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking_concurrent/8",
            "value": 6959,
            "range": "± 104",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking_concurrent/32",
            "value": 33662,
            "range": "± 74",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking_concurrent/128",
            "value": 136223,
            "range": "± 520",
            "unit": "ns/iter"
          },
          {
            "name": "worker_invocation_tracking/add_with_200_existing",
            "value": 846,
            "range": "± 9",
            "unit": "ns/iter"
          },
          {
            "name": "ws_roundtrip/invoke_echo",
            "value": 178638,
            "range": "± 10055",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}