"""
اختبارات تحليل الصرف العربي — Arabic Morphological Analysis API Tests
مستوحى من pysarf/Rashidbm
"""
import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("APP_ENV", "development")

from main import app  # noqa: E402


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


class TestArabicAnalysis:
    """اختبارات نقطة النهاية /api/arabic/analyze"""

    @pytest.mark.asyncio
    async def test_simple_analysis(self, client):
        """تحليل جملة عربية بسيطة"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "كتب العالم كتاباً"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["text"] == "كتب العالم كتاباً"
        assert len(data["words"]) > 0
        assert data["unique_roots"] > 0
        assert data["roots_db_size"] > 0
        assert data["processing_time_ms"] >= 0

    @pytest.mark.asyncio
    async def test_root_extraction(self, client):
        """التحقق من استخراج الجذور"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "كتاب"
        })
        assert resp.status_code == 200
        data = resp.json()
        words = data["words"]
        assert len(words) == 1
        assert words[0]["root"] == "كتب"
        assert words[0]["confidence"] == 1.0

    @pytest.mark.asyncio
    async def test_definite_detection(self, client):
        """كشف التعريف بأل"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "العلم نور"
        })
        assert resp.status_code == 200
        words = resp.json()["words"]
        # الكلمة الأولى (العلم) معرّفة
        definite_words = [w for w in words if w["is_definite"]]
        assert len(definite_words) >= 1

    @pytest.mark.asyncio
    async def test_semantic_fields(self, client):
        """التحقق من الحقول الدلالية"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "كتب العالم في المكتبة"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["semantic_fields"]) > 0

    @pytest.mark.asyncio
    async def test_empty_text_rejected(self, client):
        """النص الفارغ مرفوض"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": ""
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_non_arabic_text(self, client):
        """النص غير العربي ينتج كلمات فارغة"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "Hello World"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["words"]) == 0

    @pytest.mark.asyncio
    async def test_mixed_text(self, client):
        """النص المختلط يحلل العربي فقط"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "QURABIA كتاب العلم"
        })
        assert resp.status_code == 200
        data = resp.json()
        # فقط الكلمات العربية تُحلَّل
        assert len(data["words"]) >= 2

    @pytest.mark.asyncio
    async def test_coherence_calculation(self, client):
        """التماسك الدلالي يُحسب بشكل صحيح"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "كتب كتاباً في المكتبة"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert 0 <= data["semantic_coherence"] <= 1

    @pytest.mark.asyncio
    async def test_particles_detected(self, client):
        """الأدوات والحروف مكتشفة"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "في العلم نور"
        })
        assert resp.status_code == 200
        words = resp.json()["words"]
        particles = [w for w in words if w["word_type"] == "particle"]
        assert len(particles) >= 1

    @pytest.mark.asyncio
    async def test_derivatives_returned(self, client):
        """المشتقات تُعاد مع النتيجة"""
        resp = await client.post("/api/arabic/analyze", json={
            "text": "كتاب"
        })
        assert resp.status_code == 200
        words = resp.json()["words"]
        assert len(words[0]["derivatives"]) > 0
        assert "كاتب" in words[0]["derivatives"]
