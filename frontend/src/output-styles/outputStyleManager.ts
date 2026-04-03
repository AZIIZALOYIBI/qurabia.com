/**
 * ============================================================
 * output-styles/outputStyleManager.ts - مدير انماط المخرجات
 * Output Styles System
 * ============================================================
 */

import type { OutputStyleConfig } from './types';
import { BUILT_IN_STYLES } from './types';

const STORAGE_KEY = 'qurabia-output-style';
const CUSTOM_STYLES_KEY = 'qurabia-custom-output-styles';

/**
 * الحصول على النمط النشط.
 */
export function getActiveStyle(): string {
  if (typeof window === 'undefined') return 'technical';
  return window.localStorage.getItem(STORAGE_KEY) || 'technical';
}

/**
 * تعيين النمط النشط.
 */
export function setActiveStyle(name: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, name);
  }
}

/**
 * الحصول على جميع الانماط (مدمجة + مخصصة).
 */
export function getAllStyles(): OutputStyleConfig[] {
  return [...BUILT_IN_STYLES, ...getCustomStyles()];
}

/**
 * الحصول على الانماط المخصصة.
 */
export function getCustomStyles(): OutputStyleConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_STYLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * اضافة نمط مخصص.
 */
export function addCustomStyle(style: OutputStyleConfig): void {
  const customs = getCustomStyles();
  const idx = customs.findIndex((s) => s.name === style.name);
  if (idx >= 0) {
    customs[idx] = style;
  } else {
    customs.push(style);
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_STYLES_KEY, JSON.stringify(customs));
  }
}

/**
 * حذف نمط مخصص.
 */
export function removeCustomStyle(name: string): boolean {
  const customs = getCustomStyles();
  const idx = customs.findIndex((s) => s.name === name);
  if (idx < 0) return false;
  customs.splice(idx, 1);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_STYLES_KEY, JSON.stringify(customs));
  }
  return true;
}

/**
 * الحصول على تعليمات النمط النشط.
 */
export function getActiveStylePrompt(): string {
  const activeName = getActiveStyle();
  const all = getAllStyles();
  const style = all.find((s) => s.name === activeName);
  return style?.prompt || '';
}

/**
 * البحث عن نمط بالاسم.
 */
export function getStyleByName(name: string): OutputStyleConfig | undefined {
  return getAllStyles().find((s) => s.name === name);
}
