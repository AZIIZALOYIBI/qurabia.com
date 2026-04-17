# Azure AI Inference Integration

This document explains how QURABIA's Sentient Core now supports Azure AI Inference client for accessing GitHub Models API.

## Overview

The Sentient Core can now use GitHub's free Models API as an alternative to OpenAI. This is powered by the Azure AI Inference SDK, which provides a unified interface for multiple AI models hosted on GitHub.

## Architecture

```
┌─────────────────────────────────────────┐
│         Sentient Core                    │
│  ┌───────────────────────────────────┐  │
│  │       LLMClient (New)             │  │
│  │  Unified abstraction layer        │  │
│  └─────┬──────────────────────┬──────┘  │
│        │                      │          │
│   ┌────▼────┐           ┌────▼────┐     │
│   │ OpenAI  │           │  Azure  │     │
│   │ Client  │           │   AI    │     │
│   │         │           │Inference│     │
│   └─────────┘           └─────────┘     │
│                              │           │
│                         ┌────▼────┐      │
│                         │ GitHub  │      │
│                         │ Models  │      │
│                         │   API   │      │
│                         └─────────┘      │
└─────────────────────────────────────────┘
```

## Features

1. **Automatic Fallback**: If GitHub Models API is unavailable, automatically falls back to OpenAI
2. **Unified Interface**: Same API for both providers
3. **Environment-based Configuration**: Easy switching via environment variables
4. **Zero Breaking Changes**: Existing code continues to work without modification

## Configuration

### Using GitHub Models API

```bash
# Required
export GITHUB_TOKEN="ghp_your_personal_access_token"
export USE_GITHUB_MODELS="true"

# Optional (with defaults)
export GITHUB_MODEL="gpt-4o"  # Default model
export AZURE_INFERENCE_ENDPOINT="https://models.github.ai/inference"
```

### Using OpenAI (Fallback)

```bash
export OPENAI_API_KEY="sk-your-api-key"
export OPENAI_MODEL="gpt-4o-mini"  # Default model
```

### GitHub Actions Workflow

The Sentient Core workflow now includes a toggle:

```yaml
workflow_dispatch:
  inputs:
    use_github_models:
      description: 'Use GitHub Models API (Azure AI Inference)'
      type: boolean
      default: false
```

When enabled, the workflow will use GitHub's GITHUB_TOKEN to access the Models API.

## Usage Examples

### Example 1: Basic Usage

```python
from core_brain.llm_client import LLMClient

# Initialize (automatically selects provider based on env vars)
client = LLMClient()

if client.is_available():
    response = client.complete(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"},
        ],
        temperature=0.2,
        max_tokens=100,
    )
    print(response)
```

### Example 2: In Architect Module

```python
from core_brain.architect import Architect

architect = Architect()
# Architect now uses LLMClient internally
blueprint = architect.design_solution(
    task="Add user authentication",
    project_context="..."
)
```

### Example 3: In Coder Module

```python
from core_brain.coder import Coder

coder = Coder()
# Coder now uses LLMClient internally
coder.implement_blueprint(blueprint, branch_name, repo_path)
```

## Available Models

When using GitHub Models API, you have access to:

- `gpt-4o` (default)
- `gpt-4o-mini`
- `gpt-3.5-turbo`
- And other models available on GitHub Models

Check [GitHub Models documentation](https://github.com/marketplace/models) for the latest list.

## Benefits

1. **Cost Savings**: GitHub Models API is free for GitHub users
2. **Rate Limits**: More generous rate limits compared to OpenAI free tier
3. **Integration**: Seamless integration with GitHub Actions
4. **Flexibility**: Easy switching between providers without code changes

## Migration Guide

### For Existing Code

No changes needed! The new LLMClient is backward compatible:

- `Architect` class automatically uses the new client
- `Coder` class automatically uses the new client
- Environment variables control which provider is used

### For New Code

Use the new LLMClient directly:

```python
from core_brain.llm_client import LLMClient

client = LLMClient()
response = client.complete(messages=[...])
```

## Troubleshooting

### Issue: "No LLM client available"

**Solution**: Set either `GITHUB_TOKEN` + `USE_GITHUB_MODELS=true` or `OPENAI_API_KEY`

### Issue: "azure-ai-inference not installed"

**Solution**: Install the package:
```bash
pip install azure-ai-inference>=1.0.0b1
```

### Issue: Authentication failed with GitHub Models

**Solution**: Ensure your GITHUB_TOKEN has the necessary permissions. Generate a new token at https://github.com/settings/tokens

## Dependencies

Added to `backend/requirements.txt`:
```
azure-ai-inference>=1.0.0b1
```

## Security Considerations

1. **Token Security**: Never commit `GITHUB_TOKEN` or `OPENAI_API_KEY` to version control
2. **Environment Variables**: Store sensitive tokens in GitHub Secrets or `.env` files (gitignored)
3. **Rate Limiting**: Implement appropriate rate limiting for production use
4. **Error Handling**: The client handles authentication errors gracefully with fallback

## Testing

Run the test suite:

```bash
cd backend/sentient_core
python test_llm_client.py
```

Run the example:

```bash
cd backend
python examples/azure_inference_example.py
```

## References

- [Azure AI Inference SDK](https://learn.microsoft.com/en-us/python/api/overview/azure/ai-inference-readme)
- [GitHub Models Documentation](https://github.com/marketplace/models)
- [OpenAI Python SDK](https://github.com/openai/openai-python)

## Future Enhancements

1. **Streaming Support**: Add streaming completions
2. **Model Comparison**: A/B testing between providers
3. **Cost Tracking**: Track usage and costs per provider
4. **Advanced Features**: Function calling, embeddings, etc.

---

*Implemented by Sentient Core Team • 2026-04-17*
