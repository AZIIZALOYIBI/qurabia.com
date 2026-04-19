"""
Utility functions for LingBot-Map service
"""

import re
from typing import Any


def clean_arabic_text(text: str) -> str:
    """
    تنظيف النص العربي
    Clean Arabic text by removing extra spaces and normalizing

    Args:
        text: Raw Arabic text

    Returns:
        Cleaned text
    """
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove non-Arabic, non-English, non-digit, non-punctuation characters
    text = re.sub(r"[^\u0600-\u06FFa-zA-Z0-9\s\.,!?؛،]", "", text)

    return text.strip()


def normalize_arabic_text(text: str) -> str:
    """
    تطبيع النص العربي
    Normalize Arabic text (remove diacritics, normalize hamza, etc.)

    Args:
        text: Arabic text

    Returns:
        Normalized text
    """
    # Remove Arabic diacritics
    text = re.sub(r"[\u064B-\u065F]", "", text)

    # Normalize Alef
    text = re.sub(r"[أإآ]", "ا", text)

    # Normalize Teh Marbuta
    text = re.sub(r"ة", "ه", text)

    # Normalize Yeh
    text = re.sub(r"ى", "ي", text)

    return text


def is_arabic(text: str) -> bool:
    """
    Check if text is predominantly Arabic

    Args:
        text: Input text

    Returns:
        True if text is predominantly Arabic
    """
    if not text:
        return False

    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    total_chars = len(re.findall(r"[^\s]", text))

    if total_chars == 0:
        return False

    return (arabic_chars / total_chars) > 0.5


def extract_keywords(text: str, max_keywords: int = 10) -> list[str]:
    """
    Extract keywords from Arabic text

    Args:
        text: Input text
        max_keywords: Maximum number of keywords to extract

    Returns:
        List of keywords
    """
    # TODO: Implement actual keyword extraction using TF-IDF or similar
    # For now, return simple word frequency
    words = text.split()

    # Remove short words and duplicates
    words = [w for w in words if len(w) > 3]

    # Count frequency
    from collections import Counter

    word_counts = Counter(words)

    # Return top keywords
    return [word for word, _ in word_counts.most_common(max_keywords)]


def calculate_text_stats(text: str) -> dict[str, Any]:
    """
    Calculate statistics for text

    Args:
        text: Input text

    Returns:
        Dictionary with text statistics
    """
    words = text.split()
    sentences = re.split(r"[.!?؟\n]+", text)

    return {
        "char_count": len(text),
        "word_count": len(words),
        "sentence_count": len([s for s in sentences if s.strip()]),
        "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0,
        "avg_sentence_length": len(words) / len(sentences) if sentences else 0,
        "is_arabic": is_arabic(text),
    }
