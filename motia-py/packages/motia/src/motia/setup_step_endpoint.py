"""Step endpoint for tooling integration."""

import json
import logging
from pathlib import Path
from typing import Any

from .loader import generate_step_id

log = logging.getLogger("motia.step_endpoint")


async def setup_step_endpoint(
    steps_directory: str = "steps",
) -> None:
    """Set up the step content endpoint for tooling.

    This registers a GET __motia/step/:stepId handler that allows
    developer tools, tutorials, and documentation to fetch step
    content and metadata.

    Args:
        steps_directory: The directory containing step files
    """
    from .bridge import bridge
    from .cli import discover_steps

    # Build a mapping of step IDs to file paths
    step_files = discover_steps(steps_directory, include_src=True)
    step_map: dict[str, str] = {}

    for file_path in step_files:
        step_id = generate_step_id(file_path)
        step_map[step_id] = file_path
        log.debug(f"Mapped step {step_id} -> {file_path}")

    async def get_step_handler(req: dict[str, Any]) -> dict[str, Any]:
        """Handle GET requests for step content.

        Args:
            req: The request containing path_params with stepId

        Returns:
            Response with step content or 404 error
        """
        step_id = req.get("path_params", {}).get("stepId")

        if not step_id:
            return {
                "status_code": 400,
                "body": {"error": "stepId is required"},
            }

        file_path = step_map.get(step_id)

        if not file_path:
            return {
                "status_code": 404,
                "body": {"error": "Step not found"},
            }

        try:
            content = Path(file_path).read_text()
            features_path = file_path.replace("/src/", "/tutorial/") + "-features.json"
            features = []
            if Path(features_path).exists():
                try:
                    features = json.loads(Path(features_path).read_text())
                except Exception as exc:
                    log.debug("Failed to read features file %s: %s", features_path, exc)
            return {
                "status_code": 200,
                "body": {
                    "id": step_id,
                    "content": content,
                    "features": features,
                },
            }
        except Exception as e:
            log.error(f"Error reading step file {file_path}: {e}")
            return {
                "status_code": 500,
                "body": {"error": f"Failed to read step: {e}"},
            }

    async def list_steps_handler(req: dict[str, Any]) -> dict[str, Any]:
        """Handle GET requests for listing all steps.

        Args:
            req: The request (unused)

        Returns:
            Response with list of all step IDs and paths
        """
        steps = [
            {"id": step_id, "path": file_path}
            for step_id, file_path in step_map.items()
        ]
        return {
            "status_code": 200,
            "body": {"steps": steps},
        }

    # Register the step content endpoint
    bridge.register_function("motia_step_get", get_step_handler)
    bridge.register_trigger(
        "api",
        "motia_step_get",
        {"api_path": "__motia/step/:stepId", "http_method": "GET"},
    )
    log.info("Registered step endpoint: GET __motia/step/:stepId")

    # Register the list steps endpoint
    bridge.register_function("motia_steps_list", list_steps_handler)
    bridge.register_trigger(
        "api",
        "motia_steps_list",
        {"api_path": "__motia/steps", "http_method": "GET"},
    )
    log.info("Registered steps list endpoint: GET __motia/steps")
