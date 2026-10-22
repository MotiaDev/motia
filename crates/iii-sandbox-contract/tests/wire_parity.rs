use iii_sandbox_contract::{DOCS_BASE, SandboxErrorCode, code_of, error_payload};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::BTreeSet;

use SandboxErrorCode::*;

const FIXTURE: &str = include_str!("fixtures/sandbox_error_codes.json");

#[derive(Deserialize)]
struct Fixture {
    docs_base: String,
    codes: Vec<Row>,
}

#[derive(Deserialize)]
struct Row {
    code: String,
    #[serde(rename = "type")]
    error_type: String,
    retryable: bool,
}

fn fixture() -> Fixture {
    serde_json::from_str(FIXTURE).expect("fixture parses")
}

/// Compile-time exhaustiveness guard: adding a `SandboxErrorCode` variant breaks this
/// match, forcing `ALL` and the fixture to be extended in lockstep.
fn enforce_exhaustive(c: SandboxErrorCode) -> SandboxErrorCode {
    match c {
        S001 | S002 | S003 | S004 | S100 | S101 | S102 | S200 | S210 | S211 | S212 | S213
        | S214 | S215 | S216 | S217 | S218 | S219 | S300 | S301 | S302 | S303 | S304 | S400
        | S501 | S502 | S503 | S504 | S505 | S506 => c,
    }
}

const ALL: [SandboxErrorCode; 30] = [
    S001, S002, S003, S004, S100, S101, S102, S200, S210, S211, S212, S213, S214, S215, S216, S217,
    S218, S219, S300, S301, S302, S303, S304, S400, S501, S502, S503, S504, S505, S506,
];

#[test]
fn fixture_rows_match_error_payload() {
    let f = fixture();
    assert_eq!(f.docs_base, DOCS_BASE);
    assert_eq!(f.codes.len(), 30);
    for row in &f.codes {
        let code: SandboxErrorCode =
            serde_json::from_value(Value::String(row.code.clone())).expect("row code is a variant");
        let p = error_payload(code, "x", None, None);
        assert_eq!(p["type"], row.error_type, "{}", row.code);
        assert_eq!(p["retryable"], row.retryable, "{}", row.code);
        assert_eq!(
            p["docs_url"],
            format!("{DOCS_BASE}{}", row.code),
            "{}",
            row.code
        );
    }
}

#[test]
fn every_code_has_a_fixture_row() {
    let rows: BTreeSet<String> = fixture().codes.into_iter().map(|r| r.code).collect();
    for c in ALL {
        let c = enforce_exhaustive(c);
        assert!(
            rows.contains(c.as_str()),
            "no fixture row for {}",
            c.as_str()
        );
    }
}

#[test]
fn payload_keeps_todays_shape() {
    assert_eq!(
        error_payload(
            S211,
            "parent directory not found: /w",
            Some(json!({"parents": true})),
            Some("merge")
        ),
        json!({"type": "filesystem", "code": "S211", "message": "parent directory not found: /w",
               "docs_url": format!("{DOCS_BASE}S211"), "retryable": false,
               "fix": {"parents": true}, "fix_note": "merge"})
    );
    let p = error_payload(S301, "m", None, None);
    assert_eq!(
        (&p["type"], &p["retryable"], &p["fix"], &p["fix_note"]),
        (
            &json!("transient"),
            &json!(true),
            &Value::Null,
            &Value::Null
        )
    );
}

#[test]
fn code_of_reads_wire_messages() {
    assert_eq!(
        code_of(&error_payload(S504, "x", None, None).to_string()),
        Some(S504)
    );
    for m in ["not json", r#"{"code":"S999"}"#, r#"{"message":"x"}"#] {
        assert_eq!(code_of(m), None);
    }
}

#[test]
fn every_code_has_a_docs_anchor() {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../docs/next/creating-workers/sandboxes.mdx"
    );
    let page = std::fs::read_to_string(path).expect("sandboxes.mdx readable");
    for c in ALL {
        let anchor = format!("<a id=\"{}\"></a>", c.as_str());
        assert!(page.contains(&anchor), "sandboxes.mdx lacks {anchor}");
    }
}
