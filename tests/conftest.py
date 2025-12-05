"""Test configuration and shared fixtures."""

from __future__ import annotations

import pytest

from core.config import settings


@pytest.fixture(autouse=True, scope="session")
def reset_demo_mode():
    settings.DEMO_MODE = False
    yield
