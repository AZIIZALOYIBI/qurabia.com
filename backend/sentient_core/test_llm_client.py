#!/usr/bin/env python3
"""
Test script to verify LLMClient works with both OpenAI and Azure AI Inference
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core_brain.llm_client import LLMClient


def test_client_initialization():
    """Test that LLMClient initializes correctly"""
    print("🧪 Testing LLMClient initialization...")

    # Test 1: No credentials (should still initialize but not be available)
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("GITHUB_TOKEN", None)
    os.environ["USE_GITHUB_MODELS"] = "false"

    client = LLMClient()
    print(f"  ✓ Client initialized without credentials")
    print(f"    - Type: {client.client_type}")
    print(f"    - Available: {client.is_available()}")
    print(f"    - Model: {client.model}")

    assert client.client_type in ["none", "openai", "azure"], \
        f"Unexpected client type: {client.client_type}"

    # Test 2: GitHub Models mode (with mock token)
    os.environ["GITHUB_TOKEN"] = "ghp_test_token_123"
    os.environ["USE_GITHUB_MODELS"] = "true"
    os.environ["GITHUB_MODEL"] = "gpt-4o"

    client_github = LLMClient()
    print(f"\n  ✓ Client initialized with GitHub Models enabled")
    print(f"    - Type: {client_github.client_type}")
    print(f"    - Model: {client_github.model}")

    assert client_github.model == "gpt-4o", \
        f"Expected model 'gpt-4o', got '{client_github.model}'"

    # Test 3: OpenAI mode (with mock key)
    os.environ.pop("GITHUB_TOKEN", None)
    os.environ["USE_GITHUB_MODELS"] = "false"
    os.environ["OPENAI_API_KEY"] = "sk-test-key-123"
    os.environ["OPENAI_MODEL"] = "gpt-4o-mini"

    client_openai = LLMClient()
    print(f"\n  ✓ Client initialized with OpenAI")
    print(f"    - Type: {client_openai.client_type}")
    print(f"    - Model: {client_openai.model}")

    assert client_openai.model == "gpt-4o-mini", \
        f"Expected model 'gpt-4o-mini', got '{client_openai.model}'"

    print("\n✅ All tests passed!")


if __name__ == "__main__":
    test_client_initialization()
