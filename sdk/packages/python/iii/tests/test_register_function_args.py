"""Tests for the two-arg register_function() pattern with RegisterFunctionInput."""

import asyncio
import json
from types import SimpleNamespace
from typing import Any

import pytest

import iii.iii as iii_module
from iii import III, InitOptions
from iii.iii_types import RegisterFunctionFormat, RegisterFunctionInput


def test_register_function_input_model() -> None:
    """RegisterFunctionInput should be constructible with just an id."""
    inp = RegisterFunctionInput(id="demo.fn")
    assert inp.id == "demo.fn"
    assert inp.description is None
    assert inp.request_format is None
    assert inp.response_format is None
    assert inp.metadata is None


def test_register_function_input_with_all_fields() -> None:
    """RegisterFunctionInput should accept all optional fields."""
    req_fmt = RegisterFunctionFormat(name="input", type="object")
    res_fmt = RegisterFunctionFormat(name="output", type="string")
    inp = RegisterFunctionInput(
        id="demo.fn",
        description="A demo function",
        request_format=req_fmt,
        response_format=res_fmt,
        metadata={"version": "1.0"},
    )
    assert inp.id == "demo.fn"
    assert inp.description == "A demo function"
    assert inp.request_format is not None
    assert inp.response_format is not None
    assert inp.metadata == {"version": "1.0"}
