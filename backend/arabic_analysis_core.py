"""
arabic_analysis_core — النواة المشتركة للتحليل الصرفي العربي
============================================================
يحتوي على الدوال والبيانات المشتركة بين:
- main.py (نقطة نهاية التحليل الصرفي)
- arabic_quantum_bridge.py (الجسر الكمومي-الصرفي)

مستوحى من pysarf/Rashidbm — تحليل صرفي عربي متقدم
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

# ── قاعدة بيانات الجذور العربية ───────────────────────────────────────────────

ARABIC_ROOTS: Dict[str, Dict[str, Any]] = {
    'كتب': {'meaning': 'الكتابة والتدوين', 'field': 'knowledge', 'derivatives': ['كتاب', 'كاتب', 'مكتوب', 'مكتبة', 'كتابة']},
    'علم': {'meaning': 'العلم والمعرفة', 'field': 'knowledge', 'derivatives': ['عالم', 'معلوم', 'علوم', 'تعليم', 'معلم', 'عليم']},
    'قرأ': {'meaning': 'القراءة والتلاوة', 'field': 'knowledge', 'derivatives': ['قارئ', 'قراءة', 'قرآن', 'مقروء']},
    'خلق': {'meaning': 'الخلق والإبداع', 'field': 'creation', 'derivatives': ['خالق', 'مخلوق', 'خلق', 'خليقة']},
    'بنى': {'meaning': 'البناء والتشييد', 'field': 'creation', 'derivatives': ['بناء', 'بانٍ', 'مبنى', 'بنيان']},
    'نور': {'meaning': 'النور والضياء', 'field': 'nature', 'derivatives': ['منير', 'نور', 'أنوار', 'تنوير']},
    'حكم': {'meaning': 'الحكم والقضاء', 'field': 'society', 'derivatives': ['حاكم', 'محكوم', 'حكم', 'حكمة', 'محكمة']},
    'عبد': {'meaning': 'العبادة والخضوع', 'field': 'religion', 'derivatives': ['عابد', 'معبود', 'عبادة', 'عبد', 'معبد']},
    'حبب': {'meaning': 'الحب والمودة', 'field': 'emotion', 'derivatives': ['حبيب', 'محبوب', 'حب', 'محبة']},
    'نصر': {'meaning': 'النصر والغلبة', 'field': 'warfare', 'derivatives': ['ناصر', 'منصور', 'نصر', 'انتصار']},
    'كون': {'meaning': 'الكون والوجود', 'field': 'existence', 'derivatives': ['كائن', 'مكون', 'كون', 'تكوين']},
    'حسب': {'meaning': 'الحساب والعد', 'field': 'knowledge', 'derivatives': ['حاسب', 'محسوب', 'حساب', 'حاسوب']},
    'شفر': {'meaning': 'التشفير والترميز', 'field': 'knowledge', 'derivatives': ['مشفر', 'تشفير', 'شفرة']},
    'فكر': {'meaning': 'التفكير والتأمل', 'field': 'thought', 'derivatives': ['فكرة', 'مفكر', 'تفكير', 'أفكار']},
    'ذهب': {'meaning': 'الذهاب والمسير', 'field': 'movement', 'derivatives': ['ذاهب', 'مذهب', 'ذهاب']},
    'قول': {'meaning': 'القول والكلام', 'field': 'speech', 'derivatives': ['قائل', 'مقولة', 'قول', 'أقوال']},
    'نظر': {'meaning': 'النظر والمشاهدة', 'field': 'perception', 'derivatives': ['ناظر', 'منظور', 'نظر', 'نظرية']},
    'عمل': {'meaning': 'العمل والإنتاج', 'field': 'commerce', 'derivatives': ['عامل', 'معمول', 'عمل', 'عملي']},
    'رحم': {'meaning': 'الرحمة والعطف', 'field': 'religion', 'derivatives': ['راحم', 'مرحوم', 'رحمة', 'رحيم', 'رحمن']},
    'قلب': {'meaning': 'القلب والتحول', 'field': 'body', 'derivatives': ['قلب', 'قالب', 'مقلوب', 'انقلاب']},
}

ARABIC_PREFIXES: List[str] = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل', 'س']
ARABIC_SUFFIXES: List[str] = ['ات', 'ون', 'ين', 'ان', 'هم', 'هن', 'كم', 'نا', 'ها', 'ية', 'ة', 'ي', 'ه']
ARABIC_PARTICLES: set = {'في', 'من', 'الى', 'على', 'عن', 'مع', 'بين', 'حتى', 'هل', 'ما', 'لا', 'لم',
                         'قد', 'ان', 'هذا', 'هذه', 'ذلك', 'الذي', 'التي', 'هو', 'هي', 'نحن', 'كل'}
CONSONANTS: set = set('بتثجحخدذرزسشصضطظعغفقكلمنهء')


# ── الدوال الأساسية ───────────────────────────────────────────────────────────

def normalize_arabic(text: str) -> str:
    """تطبيع النص العربي — إزالة التشكيل وتوحيد الأشكال"""
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    text = text.replace('ى', 'ي').replace('ؤ', 'و').replace('ئ', 'ي')
    text = text.replace('ـ', '')
    return text


def extract_root(word: str) -> Dict[str, Any]:
    """استخراج الجذر من كلمة عربية مع درجة الثقة"""
    normalized = normalize_arabic(word)

    # البحث المباشر في المشتقات
    for root_key, entry in ARABIC_ROOTS.items():
        normalized_root = normalize_arabic(root_key)
        for deriv in entry['derivatives']:
            if normalize_arabic(deriv) == normalized:
                return {'root': normalized_root, 'confidence': 1.0, 'entry': entry}

    # تجريد السوابق واللواحق
    stem = normalized
    for prefix in ARABIC_PREFIXES:
        if stem.startswith(prefix) and len(stem) - len(prefix) >= 2:
            stem = stem[len(prefix):]
            break

    for suffix in ARABIC_SUFFIXES:
        if stem.endswith(suffix) and len(stem) - len(suffix) >= 2:
            stem = stem[:-len(suffix)]
            break

    # البحث في الجذور بعد التجريد
    for root_key, entry in ARABIC_ROOTS.items():
        nr = normalize_arabic(root_key)
        if nr == stem:
            return {'root': nr, 'confidence': 0.9, 'entry': entry}

    # استخراج الحروف الصامتة
    consonants = [c for c in stem if c in CONSONANTS]
    if len(consonants) >= 3:
        candidate = consonants[0] + consonants[1] + consonants[2]
        for root_key, entry in ARABIC_ROOTS.items():
            nr = normalize_arabic(root_key)
            root_cons = [c for c in nr if c in CONSONANTS]
            if len(root_cons) >= 3 and root_cons[:3] == consonants[:3]:
                return {'root': nr, 'confidence': 0.7, 'entry': entry}
        return {'root': candidate, 'confidence': 0.3, 'entry': None}

    return {'root': normalized[:3] if len(normalized) >= 3 else normalized, 'confidence': 0.1, 'entry': None}


def is_arabic_word(word: str) -> bool:
    """التحقق من وجود حروف عربية في الكلمة"""
    return bool(re.search(r'[\u0600-\u06FF]', word))


def detect_pattern(word: str, root: str) -> str:
    """كشف الوزن الصرفي للكلمة بناءً على جذرها

    يُرجع الوزن الصرفي الأقرب (مثل: فَعَلَ، فَعَّلَ، أَفْعَلَ...)
    """
    normalized = normalize_arabic(word)
    norm_root = normalize_arabic(root)

    if len(norm_root) < 3:
        return 'فعل'

    r1, r2, r3 = norm_root[0], norm_root[1], norm_root[2]

    # أنماط الأوزان الشائعة
    # اِنْفَعَلَ — مطاوعة
    if normalized.startswith('ان') and len(normalized) >= 5:
        return 'اِنْفَعَلَ'

    # اِفْتَعَلَ — افتعال
    if len(normalized) >= 5 and normalized.startswith('ا') and len(normalized) > 3:
        mid = normalized[2:3]
        if mid == 'ت':
            return 'اِفْتَعَلَ'

    # تَفَاعَلَ — مشاركة
    if normalized.startswith('ت') and len(normalized) >= 5:
        # تفاعل: ت + ف + ا + ع + ل
        if len(normalized) >= 5 and 'ا' in normalized[2:4]:
            return 'تَفَاعَلَ'
        # تَفَعَّلَ
        return 'تَفَعَّلَ'

    # أَفْعَلَ — همزة التعدية
    if normalized.startswith('ا') and len(normalized) == len(norm_root) + 1:
        return 'أَفْعَلَ'

    # فَاعَلَ — مفاعلة
    if len(normalized) >= 4 and normalized[1:2] == 'ا':
        return 'فَاعَلَ'

    # فَعَّلَ — تضعيف (الحرف الأوسط مكرر)
    if len(normalized) >= 4:
        for i in range(len(normalized) - 1):
            if normalized[i] == normalized[i + 1] and normalized[i] == r2:
                return 'فَعَّلَ'

    # مَفْعُول — اسم مفعول
    if normalized.startswith('م') and len(normalized) >= 5:
        return 'مَفْعُول'

    # فَاعِل — اسم فاعل
    if len(normalized) >= 4 and normalized[1:2] == 'ا':
        return 'فَاعِل'

    # الافتراضي — فعل ثلاثي مجرد
    return 'فَعَلَ'
