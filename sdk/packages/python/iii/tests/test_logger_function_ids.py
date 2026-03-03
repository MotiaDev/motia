import logging

from iii.logger import Logger


def test_logger_uses_function_name() -> None:
    """Logger stores function_name for use in log records."""
    logger = Logger(function_name="my.function")
    assert logger._function_name == "my.function"


def test_logger_default_function_name() -> None:
    """Logger defaults function_name to empty string."""
    logger = Logger()
    assert logger._function_name == ""


def test_logger_falls_back_to_python_logging_when_otel_not_initialized(
    caplog: logging.LogRecord,
) -> None:
    """When OTel is not initialized Logger falls back to Python logging."""
    logger = Logger(function_name="step.fn")

    with caplog.at_level(logging.DEBUG, logger="iii.logger"):
        logger.info("info message")
        logger.warn("warn message")
        logger.error("error message")
        logger.debug("debug message")

    messages = [r.message for r in caplog.records]
    assert any("info message" in m for m in messages)
    assert any("warn message" in m for m in messages)
    assert any("error message" in m for m in messages)
    assert any("debug message" in m for m in messages)
