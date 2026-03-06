import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = REPO_ROOT / ".github" / "scripts" / "release_versioning.py"


def load_module():
    spec = importlib.util.spec_from_file_location("release_versioning", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class ReleaseVersioningTests(unittest.TestCase):
    def test_compute_iii_patch_release_metadata(self) -> None:
        module = load_module()

        release = module.compute_release_metadata(
            target="iii",
            current_version="0.7.0",
            bump="patch",
            prerelease="none",
            existing_tags=[],
        )

        self.assertEqual(release.version, "0.7.1")
        self.assertEqual(release.python_version, "0.7.1")
        self.assertFalse(release.is_prerelease)
        self.assertEqual(release.npm_tag, "latest")
        self.assertEqual(release.tag, "iii/v0.7.1")

    def test_compute_motia_prerelease_reuses_real_tag_sequence(self) -> None:
        module = load_module()

        release = module.compute_release_metadata(
            target="motia",
            current_version="1.0.0-rc.26",
            bump="patch",
            prerelease="rc",
            existing_tags=[
                "motia/v1.0.1-rc.1",
                "motia/v1.0.1-rc.2",
            ],
        )

        self.assertEqual(release.version, "1.0.1-rc.3")
        self.assertEqual(release.python_version, "1.0.1rc3")
        self.assertTrue(release.is_prerelease)
        self.assertEqual(release.npm_tag, "rc")
        self.assertEqual(release.tag, "motia/v1.0.1-rc.3")

    def test_stage_iii_versions_updates_all_release_manifests(self) -> None:
        module = load_module()

        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_text(root / "engine" / "Cargo.toml", '[package]\nversion = "0.7.0"\n')
            write_text(root / "sdk" / "packages" / "rust" / "iii" / "Cargo.toml", '[package]\nversion = "0.7.0"\n')
            write_text(
                root / "sdk" / "packages" / "node" / "iii" / "package.json",
                json.dumps({"name": "iii-sdk", "version": "0.7.0"}, indent=2) + "\n",
            )
            write_text(
                root / "sdk" / "packages" / "python" / "iii" / "pyproject.toml",
                '[project]\nname = "iii-sdk"\nversion = "0.7.0"\n',
            )
            write_text(
                root / "console" / "packages" / "console-rust" / "Cargo.toml",
                '[package]\nversion = "0.7.0"\n',
            )

            module.stage_release_manifests(
                repo_root=root,
                target="iii",
                version="0.7.1",
                python_version="0.7.1",
            )

            self.assertIn('version = "0.7.1"', (root / "engine" / "Cargo.toml").read_text(encoding="utf-8"))
            self.assertIn(
                'version = "0.7.1"',
                (root / "sdk" / "packages" / "rust" / "iii" / "Cargo.toml").read_text(encoding="utf-8"),
            )
            self.assertEqual(
                json.loads((root / "sdk" / "packages" / "node" / "iii" / "package.json").read_text(encoding="utf-8"))[
                    "version"
                ],
                "0.7.1",
            )
            self.assertIn(
                'version = "0.7.1"',
                (root / "sdk" / "packages" / "python" / "iii" / "pyproject.toml").read_text(encoding="utf-8"),
            )
            self.assertIn(
                'version = "0.7.1"',
                (root / "console" / "packages" / "console-rust" / "Cargo.toml").read_text(encoding="utf-8"),
            )

    def test_stage_motia_versions_updates_js_and_python_manifests(self) -> None:
        module = load_module()

        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_text(
                root / "frameworks" / "motia" / "motia-js" / "packages" / "motia" / "package.json",
                json.dumps({"name": "motia", "version": "1.0.0-rc.26"}, indent=2) + "\n",
            )
            write_text(
                root / "frameworks" / "motia" / "motia-py" / "packages" / "motia" / "pyproject.toml",
                '[project]\nname = "motia"\nversion = "1.0.0rc26"\n',
            )

            module.stage_release_manifests(
                repo_root=root,
                target="motia",
                version="1.0.1-rc.3",
                python_version="1.0.1rc3",
            )

            self.assertEqual(
                json.loads(
                    (root / "frameworks" / "motia" / "motia-js" / "packages" / "motia" / "package.json").read_text(
                        encoding="utf-8"
                    )
                )["version"],
                "1.0.1-rc.3",
            )
            self.assertIn(
                'version = "1.0.1rc3"',
                (
                    root / "frameworks" / "motia" / "motia-py" / "packages" / "motia" / "pyproject.toml"
                ).read_text(encoding="utf-8"),
            )


if __name__ == "__main__":
    unittest.main()
