# Text Summarization API

## Overview

The Text Summarization API provides an endpoint to summarize Arabic text using GPT-4o-mini with a temperature of 0.5.

## Endpoint

### POST /api/text/summarize

Summarizes the provided text and returns a summary that starts with "ملخص -".

#### Request Body

```json
{
  "text": "النص المطلوب تلخيصه"
}
```

#### Response

```json
{
  "summary": "ملخص - ملخص النص المدخل",
  "success": true,
  "error": null
}
```

#### Error Response

```json
{
  "summary": "",
  "success": false,
  "error": "رسالة الخطأ"
}
```

## Implementation Details

- **Model**: GPT-4o-mini (configurable via `OPENAI_MODEL` or `GITHUB_MODEL` environment variables)
- **Temperature**: 0.5
- **Max Tokens**: 500
- **System Prompt**: "أنت مُلخِّص نصوص. مهمتك الوحيدة هي تلخيص النص المُعطى لك."
- **User Prompt**: 'لخص النص المعطى، بدءًا بـ "ملخص -":\n\n{text}'

## Configuration

The endpoint uses the `LLMClient` from `sentient_core.core_brain.llm_client`, which supports:

1. **Azure AI Inference (GitHub Models)**:
   - Set `GITHUB_TOKEN` environment variable
   - Set `USE_GITHUB_MODELS=true`
   - Optionally set `GITHUB_MODEL` (default: gpt-4o)

2. **OpenAI API**:
   - Set `OPENAI_API_KEY` environment variable
   - Optionally set `OPENAI_MODEL` (default: gpt-4o-mini)

## Example Usage

### Using curl

```bash
curl -X POST https://api.qurabia.com/api/text/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "قفز الثعلب البني السريع فوق الكلب الكسول. كان الكلب متعباً للغاية لدرجة أنه لم يستطع الرد."
  }'
```

### Using Python

```python
import httpx

response = httpx.post(
    "https://api.qurabia.com/api/text/summarize",
    json={
        "text": "قفز الثعلب البني السريع فوق الكلب الكسول. كان الكلب متعباً للغاية لدرجة أنه لم يستطع الرد."
    }
)

data = response.json()
if data["success"]:
    print(data["summary"])
else:
    print(f"Error: {data['error']}")
```

## Testing

The endpoint is fully tested with 6 test cases covering:

1. Successful summarization with mock LLM
2. LLM unavailable scenario
3. Error handling
4. Empty text validation
5. Summary prefix verification
6. System message correctness

Run tests with:

```bash
cd backend
APP_ENV=development python -m pytest tests/test_text_summarization.py -v
```

## Notes

- The endpoint is tagged under "Text Processing" in the API documentation
- All requests are logged with text length and summary length metrics
- The endpoint gracefully handles LLM unavailability and errors
- Response always includes `success` flag to indicate operation status
