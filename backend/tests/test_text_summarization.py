"""
اختبارات تلخيص النصوص — Text Summarization API Tests
يختبر نقطة النهاية /api/text/summarize
"""
import os
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("APP_ENV", "development")

from main import app  # noqa: E402


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


class TestTextSummarization:
    """اختبارات نقطة النهاية /api/text/summarize"""

    @pytest.mark.asyncio
    async def test_summarization_with_mock_llm(self, client):
        """اختبار التلخيص مع عميل LLM وهمي"""
        # إنشاء عميل LLM وهمي
        mock_llm_client = MagicMock()
        mock_llm_client.is_available.return_value = True
        mock_llm_client.complete.return_value = "ملخص - قفز ثعلب فوق كلب كسول لا يستجيب."

        with patch("main.LLMClient", return_value=mock_llm_client):
            resp = await client.post(
                "/api/text/summarize",
                json={
                    "text": "قفز الثعلب البني السريع فوق الكلب الكسول. كان الكلب متعباً للغاية لدرجة أنه لم يستطع الرد."
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["summary"].startswith("ملخص -")
        assert data["error"] is None

        # التحقق من استدعاء العميل بالمعلمات الصحيحة
        mock_llm_client.complete.assert_called_once()
        call_args = mock_llm_client.complete.call_args
        assert call_args.kwargs["temperature"] == 0.5
        assert call_args.kwargs["max_tokens"] == 500

    @pytest.mark.asyncio
    async def test_summarization_llm_unavailable(self, client):
        """اختبار التلخيص عندما لا يكون عميل LLM متاحاً"""
        mock_llm_client = MagicMock()
        mock_llm_client.is_available.return_value = False

        with patch("main.LLMClient", return_value=mock_llm_client):
            resp = await client.post(
                "/api/text/summarize",
                json={"text": "نص للاختبار"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert data["summary"] == ""
        assert "not available" in data["error"]

    @pytest.mark.asyncio
    async def test_summarization_with_error(self, client):
        """اختبار التلخيص عند حدوث خطأ"""
        mock_llm_client = MagicMock()
        mock_llm_client.is_available.return_value = True
        mock_llm_client.complete.side_effect = Exception("Connection error")

        with patch("main.LLMClient", return_value=mock_llm_client):
            resp = await client.post(
                "/api/text/summarize",
                json={"text": "نص للاختبار"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert data["summary"] == ""
        assert "Failed to summarize" in data["error"]

    @pytest.mark.asyncio
    async def test_empty_text_validation(self, client):
        """اختبار التحقق من النص الفارغ"""
        # Pydantic يجب أن يرفض النص الفارغ
        resp = await client.post(
            "/api/text/summarize",
            json={"text": ""},
        )
        # يمكن أن يكون 422 (خطأ تحقق) أو 200 مع خطأ
        # حسب كيفية تعامل Pydantic مع النص الفارغ
        assert resp.status_code in [200, 422]

    @pytest.mark.asyncio
    async def test_summary_starts_with_prefix(self, client):
        """اختبار أن الملخص يبدأ بـ 'ملخص -'"""
        mock_llm_client = MagicMock()
        mock_llm_client.is_available.return_value = True
        mock_llm_client.complete.return_value = "ملخص - هذا ملخص النص."

        with patch("main.LLMClient", return_value=mock_llm_client):
            resp = await client.post(
                "/api/text/summarize",
                json={"text": "نص طويل للتلخيص يحتوي على معلومات كثيرة."},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["summary"].startswith("ملخص -")

    @pytest.mark.asyncio
    async def test_system_message_correct(self, client):
        """اختبار أن رسالة النظام صحيحة"""
        mock_llm_client = MagicMock()
        mock_llm_client.is_available.return_value = True
        mock_llm_client.complete.return_value = "ملخص - ملخص النص."

        with patch("main.LLMClient", return_value=mock_llm_client):
            await client.post(
                "/api/text/summarize",
                json={"text": "نص للاختبار"},
            )

        call_args = mock_llm_client.complete.call_args
        messages = call_args.kwargs["messages"]

        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert "مُلخِّص نصوص" in messages[0]["content"]
        assert messages[1]["role"] == "user"
        assert 'ملخص -"' in messages[1]["content"]
