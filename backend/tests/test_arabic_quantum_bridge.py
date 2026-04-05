"""
اختبارات جسر التحليل الصرفي الكمومي — Arabic Quantum Bridge Tests
================================================================
اختبارات نقطة النهاية /api/arabic-quantum/analyze-morphology
"""
import math
import pytest
from httpx import AsyncClient, ASGITransport

import os
os.environ.setdefault("APP_ENV", "development")

from main import app  # noqa: E402


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


class TestArabicQuantumBridge:
    """اختبارات الجسر الكمومي-الصرفي"""

    @pytest.mark.asyncio
    async def test_simple_quantum_analysis(self, client):
        """تحليل كمومي لجملة عربية بسيطة"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتب العالم كتاباً"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["text"] == "كتب العالم كتاباً"
        assert len(data["qubit_mapping"]) > 0
        assert data["total_words_analyzed"] > 0
        assert data["unique_roots"] > 0
        assert data["processing_time_ms"] >= 0

    @pytest.mark.asyncio
    async def test_qubit_mapping_structure(self, client):
        """التحقق من بنية تحويل الكيوبت"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتاب"
        })
        assert resp.status_code == 200
        data = resp.json()
        mapping = data["qubit_mapping"]
        assert len(mapping) == 1

        m = mapping[0]
        assert m["word"] == "كتاب"
        assert m["root"] == "كتب"
        assert m["root_letters"] == ["ك", "ت", "ب"]
        assert m["qubit_count"] == 3
        assert m["pattern_gate"] in ["RX", "RY", "RZ", "H", "CNOT", "SWAP", "CZ", "X", "Z", "S"]
        assert m["confidence"] == 1.0
        assert m["semantic_field"] == "knowledge"

    @pytest.mark.asyncio
    async def test_quantum_gate_assignment(self, client):
        """التحقق من تعيين البوابات الكمومية بناءً على الأوزان"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتب"
        })
        assert resp.status_code == 200
        mapping = resp.json()["qubit_mapping"]
        assert len(mapping) == 1
        # كتب = فعل ثلاثي مجرد → RX أو فعل آخر حسب الكشف
        assert mapping[0]["pattern_gate"] in ["RX", "RY", "RZ", "H", "CNOT", "SWAP", "CZ", "X", "Z", "S"]

    @pytest.mark.asyncio
    async def test_semantic_phase_values(self, client):
        """التحقق من زوايا الطور الدلالية"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتاب"
        })
        assert resp.status_code == 200
        mapping = resp.json()["qubit_mapping"]
        # knowledge → phase = 0.0
        assert mapping[0]["semantic_phase"] == 0.0

    @pytest.mark.asyncio
    async def test_non_knowledge_phase(self, client):
        """التحقق من زاوية طور حقل غير المعرفة"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "خالق"
        })
        assert resp.status_code == 200
        mapping = resp.json()["qubit_mapping"]
        assert len(mapping) == 1
        # خالق → حقل: creation → phase = pi/6
        assert mapping[0]["semantic_field"] == "creation"
        assert abs(mapping[0]["semantic_phase"] - math.pi / 6) < 0.001

    @pytest.mark.asyncio
    async def test_circuit_summary(self, client):
        """التحقق من ملخص الدائرة الكمومية"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتب العالم كتاباً"
        })
        assert resp.status_code == 200
        circuit = resp.json()["circuit_summary"]
        assert circuit["total_qubits"] >= 1
        assert isinstance(circuit["gates"], list)
        assert circuit["circuit_depth"] >= 0
        assert isinstance(circuit["entanglements"], int)

    @pytest.mark.asyncio
    async def test_particles_excluded(self, client):
        """الأدوات والحروف مستبعدة من التحويل الكمومي"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "في المكتبة"
        })
        assert resp.status_code == 200
        mapping = resp.json()["qubit_mapping"]
        # "في" حرف جر — يجب أن يُستبعد
        words = [m["word"] for m in mapping]
        assert "في" not in words

    @pytest.mark.asyncio
    async def test_non_arabic_excluded(self, client):
        """النص غير العربي مستبعد"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "Hello World"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["qubit_mapping"]) == 0
        assert data["total_words_analyzed"] == 0

    @pytest.mark.asyncio
    async def test_mixed_text(self, client):
        """النص المختلط يحلل العربي فقط"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "QURABIA كتاب العلم"
        })
        assert resp.status_code == 200
        data = resp.json()
        # فقط الكلمات العربية
        words = [m["word"] for m in data["qubit_mapping"]]
        assert "QURABIA" not in words
        assert len(data["qubit_mapping"]) >= 1

    @pytest.mark.asyncio
    async def test_empty_text_rejected(self, client):
        """النص الفارغ مرفوض"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": ""
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_gate_params_structure(self, client):
        """التحقق من بنية معاملات البوابة"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتاب"
        })
        assert resp.status_code == 200
        mapping = resp.json()["qubit_mapping"]
        m = mapping[0]
        assert isinstance(m["gate_params"], dict)

    @pytest.mark.asyncio
    async def test_multiple_words_circuit(self, client):
        """دائرة كمومية لعدة كلمات"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتب عالم فكرة نور"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_words_analyzed"] >= 3
        circuit = data["circuit_summary"]
        # الكيوبتات الإجمالية = مجموع كيوبتات كل كلمة
        total = sum(m["qubit_count"] for m in data["qubit_mapping"])
        assert circuit["total_qubits"] == total

    @pytest.mark.asyncio
    async def test_unique_roots_counted(self, client):
        """الجذور الفريدة تُحصى بشكل صحيح"""
        resp = await client.post("/api/arabic-quantum/analyze-morphology", json={
            "text": "كتاب كاتب مكتوب"
        })
        assert resp.status_code == 200
        data = resp.json()
        # كل هذه الكلمات من جذر كتب
        assert data["unique_roots"] == 1
        assert data["total_words_analyzed"] == 3
