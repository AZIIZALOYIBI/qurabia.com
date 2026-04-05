"""
arabic_quantum_bridge — جسر التحليل الصرفي العربي والحوسبة الكمومية
===================================================================
يربط بين التحليل الصرفي العربي والبوابات الكمومية:
  - كل جذر ثلاثي → كيوبتات
  - كل وزن صرفي → بوابة كمومية
  - كل حقل دلالي → زاوية طور

نقطة النهاية: POST /api/arabic-quantum/analyze-morphology
"""

from __future__ import annotations

import math
import time
from typing import Any

from arabic_analysis_core import (
    ARABIC_PARTICLES,
    detect_pattern,
    extract_root,
    is_arabic_word,
    normalize_arabic,
)
from fastapi import APIRouter
from pydantic import BaseModel, Field

# ── الموجّه (Router) ─────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/arabic-quantum", tags=["Arabic Quantum Bridge"])


# ── نماذج البيانات (Pydantic Models) ─────────────────────────────────────────

class ArabicQuantumRequest(BaseModel):
    """طلب تحليل صرفي كمومي"""
    text: str = Field(..., min_length=1, max_length=5000, description="النص العربي للتحليل الكمومي")


class QubitMapping(BaseModel):
    """تحويل كلمة واحدة إلى تمثيل كمومي"""
    word: str
    root: str
    root_letters: list[str]
    qubit_count: int
    pattern: str
    pattern_gate: str
    gate_params: dict[str, float]
    semantic_field: str
    semantic_phase: float
    confidence: float


class QuantumCircuitSummary(BaseModel):
    """ملخص الدائرة الكمومية المولّدة"""
    total_qubits: int
    gates: list[dict[str, Any]]
    entanglements: int
    circuit_depth: int


class ArabicQuantumResponse(BaseModel):
    """استجابة التحليل الصرفي الكمومي"""
    text: str
    qubit_mapping: list[QubitMapping]
    circuit_summary: QuantumCircuitSummary
    total_words_analyzed: int
    unique_roots: int
    processing_time_ms: float


# ── ربط الأوزان الصرفية بالبوابات الكمومية ──────────────────────────────────

PATTERN_GATE_MAP: dict[str, str] = {
    'فَعَلَ': 'RX',        # فعل ثلاثي مجرد → دوران حول X
    'فَعَّلَ': 'RY',       # تضعيف → دوران حول Y
    'أَفْعَلَ': 'RZ',      # همزة التعدية → دوران حول Z
    'تَفَاعَلَ': 'CNOT',   # مشاركة → تشابك
    'اِنْفَعَلَ': 'H',     # مطاوعة → تراكب (Hadamard)
    'اِفْتَعَلَ': 'SWAP',  # افتعال → تبادل
    'تَفَعَّلَ': 'S',      # تفعّل → بوابة الطور S
    'فَاعَلَ': 'CZ',       # مفاعلة → تشابك مع طور
    'مَفْعُول': 'X',       # اسم مفعول → قلب (NOT)
    'فَاعِل': 'Z',         # اسم فاعل → بوابة Z
}

# ── ربط الحقول الدلالية بزوايا الطور ─────────────────────────────────────────

SEMANTIC_PHASE_MAP: dict[str, float] = {
    'knowledge': 0.0,               # المعرفة → الحالة الأساسية
    'creation': math.pi / 6,        # الخلق → 30°
    'nature': math.pi / 4,          # الطبيعة → 45°
    'society': math.pi / 3,         # المجتمع → 60°
    'religion': math.pi / 2,        # الدين → 90°
    'emotion': 2 * math.pi / 3,     # العاطفة → 120°
    'warfare': 3 * math.pi / 4,     # الحرب → 135°
    'existence': 5 * math.pi / 6,   # الوجود → 150°
    'movement': math.pi,            # الحركة → 180°
    'speech': 7 * math.pi / 6,      # الكلام → 210°
    'perception': 4 * math.pi / 3,  # الإدراك → 240°
    'thought': 3 * math.pi / 2,     # الفكر → 270°
    'commerce': 5 * math.pi / 3,    # التجارة → 300°
    'body': 11 * math.pi / 6,       # الجسد → 330°
    'unknown': 0.0,
    'particle': 0.0,
}


def _pattern_to_gate(pattern: str) -> str:
    """ربط الوزن الصرفي ببوابة كمومية"""
    return PATTERN_GATE_MAP.get(pattern, 'H')


def _gate_params(gate: str, phase: float) -> dict[str, float]:
    """حساب معاملات البوابة الكمومية"""
    if gate in ('RX', 'RY', 'RZ'):
        return {'theta': round(phase if phase != 0.0 else math.pi / 4, 6)}
    if gate == 'H':
        return {'theta': round(math.pi / 2, 6), 'phi': 0.0}
    if gate in ('CNOT', 'CZ', 'SWAP'):
        return {'control': 0, 'target': 1}
    if gate in ('X', 'Y', 'Z', 'S', 'T'):
        return {}
    return {}


def _build_circuit_summary(mappings: list[QubitMapping]) -> QuantumCircuitSummary:
    """بناء ملخص الدائرة الكمومية من تحويلات الكلمات"""
    total_qubits = sum(m.qubit_count for m in mappings)
    gates: list[dict[str, Any]] = []
    entanglements = 0
    qubit_offset = 0

    for m in mappings:
        gate_entry: dict[str, Any] = {
            'gate': m.pattern_gate,
            'qubits': list(range(qubit_offset, qubit_offset + m.qubit_count)),
            'word': m.word,
            'root': m.root,
        }

        # البوابات ثنائية الكيوبت تحتاج تشابكاً
        if m.pattern_gate in ('CNOT', 'CZ', 'SWAP') and m.qubit_count >= 2:
            entanglements += 1
            gate_entry['control'] = qubit_offset
            gate_entry['target'] = qubit_offset + 1

        # إضافة بوابة طور دلالية إذا كان الحقل معروفاً
        if m.semantic_phase != 0.0:
            gates.append({
                'gate': 'Phase',
                'qubits': [qubit_offset],
                'angle': round(m.semantic_phase, 6),
                'semantic_field': m.semantic_field,
            })

        gates.append(gate_entry)
        qubit_offset += m.qubit_count

    # عمق الدائرة = عدد البوابات (تقريب بسيط)
    circuit_depth = len(gates) if gates else 0

    return QuantumCircuitSummary(
        total_qubits=max(total_qubits, 1),
        gates=gates,
        entanglements=entanglements,
        circuit_depth=circuit_depth,
    )


# ── نقطة النهاية ─────────────────────────────────────────────────────────────

@router.post("/analyze-morphology", response_model=ArabicQuantumResponse)
async def analyze_morphology(req: ArabicQuantumRequest) -> ArabicQuantumResponse:
    """تحليل صرفي كمومي — يحوّل النص العربي إلى دائرة كمومية

    المبدأ:
    - كل جذر ثلاثي → 3 كيوبتات (حرف = كيوبت)
    - كل وزن صرفي → بوابة كمومية (فَعَلَ→RX, فَعَّلَ→RY, ...)
    - كل حقل دلالي → زاوية طور على كرة Bloch
    """
    start_time = time.monotonic()

    words = req.text.split()
    mappings: list[QubitMapping] = []
    unique_roots: set = set()

    for word in words:
        cleaned = word.strip()
        if not cleaned or not is_arabic_word(cleaned):
            continue

        normalized = normalize_arabic(cleaned)

        # تجاوز الأدوات والحروف
        if normalized in ARABIC_PARTICLES:
            continue

        # استخراج الجذر
        extraction = extract_root(cleaned)
        root = extraction['root']
        entry = extraction.get('entry')
        confidence = extraction['confidence']

        root_letters = list(root)[:3]
        qubit_count = len(root_letters) if root_letters else 1
        unique_roots.add(root)

        # تحديد الوزن الصرفي
        pattern = detect_pattern(cleaned, root)

        # تحديد البوابة الكمومية
        gate = _pattern_to_gate(pattern)

        # تحديد الحقل الدلالي وزاوية الطور
        field = entry['field'] if entry else 'unknown'
        phase = SEMANTIC_PHASE_MAP.get(field, 0.0)

        # حساب معاملات البوابة
        params = _gate_params(gate, phase)

        mappings.append(QubitMapping(
            word=cleaned,
            root=root,
            root_letters=root_letters,
            qubit_count=qubit_count,
            pattern=pattern,
            pattern_gate=gate,
            gate_params=params,
            semantic_field=field,
            semantic_phase=round(phase, 6),
            confidence=confidence,
        ))

    # بناء ملخص الدائرة الكمومية
    circuit = _build_circuit_summary(mappings)

    processing_time = (time.monotonic() - start_time) * 1000

    return ArabicQuantumResponse(
        text=req.text,
        qubit_mapping=mappings,
        circuit_summary=circuit,
        total_words_analyzed=len(mappings),
        unique_roots=len(unique_roots),
        processing_time_ms=round(processing_time, 2),
    )
