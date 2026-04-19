"""
Test suite for LingBot-Map service
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health and status endpoints"""

    def test_health_check(self):
        """Test /health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "lingbot-map"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data

    def test_root_endpoint(self):
        """Test / endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "QURABIA LingBot-Map"
        assert data["status"] == "operational"
        assert "endpoints" in data


class TestNLPEndpoints:
    """Test NLP analysis endpoints"""

    def test_analyze_text_basic(self):
        """Test basic text analysis"""
        payload = {
            "text": "مرحباً بكم في قرابيا، منصة الذكاء الاصطناعي العربية",
            "include_sentiment": True,
            "include_entities": True,
            "include_topics": False,
        }
        response = client.post("/api/lingbot/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "ar"
        assert data["text_length"] > 0
        assert data["sentiment"] is not None
        assert data["entities"] is not None
        assert "processing_time_ms" in data

    def test_analyze_text_minimal(self):
        """Test text analysis with minimal options"""
        payload = {
            "text": "نص تجريبي",
            "include_sentiment": False,
            "include_entities": False,
            "include_topics": False,
        }
        response = client.post("/api/lingbot/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["sentiment"] is None
        assert data["entities"] is None
        assert data["topics"] is None

    def test_analyze_text_empty(self):
        """Test text analysis with empty text"""
        payload = {"text": ""}
        response = client.post("/api/lingbot/analyze", json=payload)
        assert response.status_code == 422  # Validation error

    def test_summarize_text_basic(self):
        """Test basic text summarization"""
        payload = {
            "text": "هذا نص طويل يحتاج إلى تلخيص. " * 20,
            "max_length": 100,
            "style": "extractive",
        }
        response = client.post("/api/lingbot/summarize", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert data["original_length"] > 0
        assert data["summary_length"] > 0
        assert data["compression_ratio"] > 0
        assert "processing_time_ms" in data

    def test_summarize_text_too_short(self):
        """Test summarization with text that's too short"""
        payload = {"text": "نص قصير", "max_length": 100}
        response = client.post("/api/lingbot/summarize", json=payload)
        assert response.status_code == 422  # Validation error


class TestErrorHandling:
    """Test error handling"""

    def test_invalid_endpoint(self):
        """Test accessing invalid endpoint"""
        response = client.get("/invalid/endpoint")
        assert response.status_code == 404

    def test_invalid_method(self):
        """Test using invalid HTTP method"""
        response = client.get("/api/lingbot/analyze")  # Should be POST
        assert response.status_code == 405


@pytest.mark.asyncio
class TestAsyncBehavior:
    """Test async behavior"""

    async def test_concurrent_requests(self):
        """Test handling concurrent requests"""
        import asyncio

        async def make_request():
            return client.get("/health")

        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)

        assert all(r.status_code == 200 for r in responses)
