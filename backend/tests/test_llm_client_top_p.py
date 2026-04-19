"""
اختبارات LLMClient المحسّن - مع دعم top_p
"""
import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("APP_ENV", "development")

# Import after setting env
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sentient_core.core_brain.llm_client import LLMClient  # noqa: E402


class TestLLMClientTopP:
    """اختبارات دعم top_p في LLMClient"""

    def test_complete_with_top_p_azure(self):
        """اختبار استخدام top_p مع Azure AI Inference"""
        # إنشاء عميل Azure وهمي
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_client.complete.return_value = mock_response

        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token", "USE_GITHUB_MODELS": "true"}):
            with patch("azure.ai.inference.ChatCompletionsClient", return_value=mock_client):
                llm = LLMClient()

                result = llm.complete(
                    messages=[{"role": "user", "content": "test"}],
                    temperature=0.7,
                    top_p=0.9,
                    max_tokens=100,
                )

                assert result == "Test response"

                # التحقق من أن top_p تم تمريره
                call_kwargs = mock_client.complete.call_args.kwargs
                assert call_kwargs["top_p"] == 0.9
                assert call_kwargs["temperature"] == 0.7
                assert call_kwargs["max_tokens"] == 100

    def test_complete_without_top_p_azure(self):
        """اختبار عدم تمرير top_p (قيمة افتراضية)"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_client.complete.return_value = mock_response

        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token", "USE_GITHUB_MODELS": "true"}):
            with patch("azure.ai.inference.ChatCompletionsClient", return_value=mock_client):
                llm = LLMClient()

                result = llm.complete(
                    messages=[{"role": "user", "content": "test"}],
                    temperature=0.5,
                    max_tokens=100,
                )

                assert result == "Test response"

                # التحقق من أن top_p لم يتم تمريره
                call_kwargs = mock_client.complete.call_args.kwargs
                assert "top_p" not in call_kwargs

    def test_complete_with_top_p_openai(self):
        """اختبار استخدام top_p مع OpenAI"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "OpenAI response"
        mock_client.chat.completions.create.return_value = mock_response

        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True):
            with patch("openai.OpenAI", return_value=mock_client):
                llm = LLMClient()

                result = llm.complete(
                    messages=[{"role": "user", "content": "test"}],
                    temperature=0.8,
                    top_p=0.95,
                    max_tokens=200,
                )

                assert result == "OpenAI response"

                # التحقق من أن top_p تم تمريره
                call_kwargs = mock_client.chat.completions.create.call_args.kwargs
                assert call_kwargs["top_p"] == 0.95
                assert call_kwargs["temperature"] == 0.8
                assert call_kwargs["max_tokens"] == 200

    def test_complete_without_top_p_openai(self):
        """اختبار عدم تمرير top_p مع OpenAI"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "OpenAI response"
        mock_client.chat.completions.create.return_value = mock_response

        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True):
            with patch("openai.OpenAI", return_value=mock_client):
                llm = LLMClient()

                result = llm.complete(
                    messages=[{"role": "user", "content": "test"}],
                    temperature=0.3,
                    max_tokens=150,
                )

                assert result == "OpenAI response"

                # التحقق من أن top_p لم يتم تمريره
                call_kwargs = mock_client.chat.completions.create.call_args.kwargs
                assert "top_p" not in call_kwargs

    def test_top_p_zero_value(self):
        """اختبار قيمة top_p = 0.0 (قيمة صالحة)"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"
        mock_client.complete.return_value = mock_response

        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token", "USE_GITHUB_MODELS": "true"}):
            with patch("azure.ai.inference.ChatCompletionsClient", return_value=mock_client):
                llm = LLMClient()

                # top_p=0.0 هي قيمة صالحة ويجب تمريرها
                result = llm.complete(
                    messages=[{"role": "user", "content": "test"}],
                    top_p=0.0,
                )

                assert result == "Response"
                call_kwargs = mock_client.complete.call_args.kwargs
                # حتى لو كانت 0، يجب تمريرها إذا تم تحديدها صراحةً
                # لكن في الكود الحالي، None فقط هو الذي لا يُمرر
                assert "top_p" in call_kwargs
                assert call_kwargs["top_p"] == 0.0
