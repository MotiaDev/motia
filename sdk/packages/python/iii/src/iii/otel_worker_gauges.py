"""Observable OTel gauges for worker metrics in the III Python SDK.

Registers observable gauges with the OTel meter for:
  - iii.worker.cpu.percent
  - iii.worker.memory.rss
  - iii.worker.memory.vms
  - iii.worker.uptime_seconds

Uses a batch observable callback for efficient single-collection-per-cycle.
"""
from __future__ import annotations

from typing import Any, Optional

from .worker_metrics import WorkerMetricsCollector

_registered: bool = False
_collector: Optional[WorkerMetricsCollector] = None


def register_worker_gauges(
    meter: Any,
    worker_id: str,
    worker_name: Optional[str] = None,
) -> None:
    """Register observable gauges for worker metrics with the given meter.

    Args:
        meter: An opentelemetry.metrics.Meter instance.
        worker_id: Unique identifier for the worker.
        worker_name: Optional human-readable worker name.
    """
    global _registered, _collector

    if _registered:
        return

    _collector = WorkerMetricsCollector()

    base_attributes: dict[str, str] = {"worker.id": worker_id}
    if worker_name:
        base_attributes["worker.name"] = worker_name

    cpu_percent = meter.create_observable_gauge(
        name="iii.worker.cpu.percent",
        description="Worker CPU usage percentage",
        unit="%",
    )

    memory_rss = meter.create_observable_gauge(
        name="iii.worker.memory.rss",
        description="Worker resident set size in bytes",
        unit="By",
    )

    memory_vms = meter.create_observable_gauge(
        name="iii.worker.memory.vms",
        description="Worker virtual memory in bytes",
        unit="By",
    )

    uptime_seconds = meter.create_observable_gauge(
        name="iii.worker.uptime_seconds",
        description="Worker uptime in seconds",
        unit="s",
    )

    def _batch_callback(batch_result: Any) -> None:
        if _collector is None:
            return

        metrics = _collector.collect_cached()

        batch_result.observe(cpu_percent, metrics.cpu_percent, base_attributes)
        batch_result.observe(memory_rss, metrics.memory_rss, base_attributes)
        batch_result.observe(memory_vms, metrics.memory_vms, base_attributes)
        batch_result.observe(uptime_seconds, metrics.uptime_seconds, base_attributes)

    meter.add_batch_observable_callback(
        _batch_callback,
        [cpu_percent, memory_rss, memory_vms, uptime_seconds],
    )

    _registered = True


def stop_worker_gauges() -> None:
    """Stop worker gauge collection and release resources."""
    global _registered, _collector
    _collector = None
    _registered = False
