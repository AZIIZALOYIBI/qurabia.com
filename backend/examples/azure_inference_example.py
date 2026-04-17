#!/usr/bin/env python3
"""
Example: Using Azure AI Inference with GitHub Models API

This script demonstrates how to use the new LLMClient abstraction
to switch between OpenAI and GitHub Models API.

Prerequisites:
- pip install azure-ai-inference openai
- Set GITHUB_TOKEN environment variable for GitHub Models
- Or set OPENAI_API_KEY for OpenAI
"""

import os
import sys

# Example setup
os.environ["USE_GITHUB_MODELS"] = "true"  # Switch to GitHub Models
os.environ["GITHUB_MODEL"] = "gpt-4o"     # Model to use
# os.environ["GITHUB_TOKEN"] = "ghp_your_token_here"  # Set your token

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sentient_core.core_brain.llm_client import LLMClient


def main():
    print("🤖 Azure AI Inference Client Example")
    print("=" * 50)

    # Initialize client
    client = LLMClient()

    if not client.is_available():
        print("❌ No LLM client available!")
        print("   Please set GITHUB_TOKEN (for GitHub Models)")
        print("   or OPENAI_API_KEY (for OpenAI)")
        return

    print(f"✅ Client initialized: {client.client_type}")
    print(f"📦 Using model: {client.model}\n")

    # Example 1: Simple completion
    print("Example 1: Simple question")
    print("-" * 50)

    try:
        response = client.complete(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the capital of France?"},
            ],
            temperature=0.2,
            max_tokens=100,
        )
        print(f"Response: {response}\n")
    except Exception as e:
        print(f"Error: {e}\n")

    # Example 2: Code generation
    print("Example 2: Code generation")
    print("-" * 50)

    try:
        response = client.complete(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Python programmer. "
                    "Write clean, well-documented code.",
                },
                {
                    "role": "user",
                    "content": "Write a Python function to calculate fibonacci numbers.",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )
        print(f"Generated code:\n{response}\n")
    except Exception as e:
        print(f"Error: {e}\n")


if __name__ == "__main__":
    main()
