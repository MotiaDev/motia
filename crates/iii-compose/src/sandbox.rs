// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

//! Which containers need the sandbox adapter, and the start order that puts
//! the adapter ahead of them.

use std::path::Path;

use iii_sandbox_contract::DEFAULT_ADAPTER;
use sha2::{Digest, Sha256};

use crate::{
    config::{ComposeFile, WorkerSource},
    error::Result,
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
mod tests {
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
