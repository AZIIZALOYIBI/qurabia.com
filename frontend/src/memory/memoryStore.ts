/**
 * ============================================================
 * memory/memoryStore.ts – مخزن الذاكرة المحلي
 * Structured Memory System
 * ============================================================
 * يدير الذكريات في localStorage مع ترويسة frontmatter وحداثة.
 */

import { memoryFreshnessNote } from './memoryAge';
import type { MemoryEntry, MemoryHeader, MemoryType } from './types';
import { MEMORY_TYPES } from './types';

const STORAGE_KEY = 'qurabia-memory-store';
const MAX_MEMORIES = 200;

// ─── واجهة المخزن ────────────────────────────────────────────

/**
 * قراءة جميع الذكريات من التخزين المحلي.
 */
export function loadMemories(): MemoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * حفظ الذكريات في التخزين المحلي.
 */
function saveMemories(memories: MemoryEntry[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = memories.slice(0, MAX_MEMORIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * إضافة ذاكرة جديدة.
 */
export function addMemory(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): MemoryEntry {
  const now = Date.now();
  const newEntry: MemoryEntry = {
    ...entry,
    id: `mem-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  const memories = loadMemories();
  memories.unshift(newEntry);
  saveMemories(memories);
  return newEntry;
}

/**
 * تحديث ذاكرة موجودة.
 */
export function updateMemory(id: string, updates: Partial<Omit<MemoryEntry, 'id' | 'createdAt'>>): MemoryEntry | null {
  const memories = loadMemories();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  memories[idx] = { ...memories[idx], ...updates, updatedAt: Date.now() };
  saveMemories(memories);
  return memories[idx];
}

/**
 * حذف ذاكرة.
 */
export function deleteMemory(id: string): boolean {
  const memories = loadMemories();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  memories.splice(idx, 1);
  saveMemories(memories);
  return true;
}

/**
 * مسح جميع الذكريات.
 */
export function clearMemories(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

// ─── مسح الذكريات (فرز حسب الأحدث) ─────────────────────────

/**
 * مسح ترويسات الذكريات (مرتبة حسب الأحدث).
 */
export function scanMemoryHeaders(): MemoryHeader[] {
  const memories = loadMemories();
  return memories
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((m) => ({
      filename: `${m.id}.md`,
      filePath: m.id,
      mtimeMs: m.updatedAt,
      description: m.description,
      type: m.type,
    }));
}

/**
 * تنسيق قائمة الذكريات كنص manifest.
 */
export function formatMemoryManifest(memories: MemoryEntry[]): string {
  return memories
    .map((m) => {
      const date = new Date(m.updatedAt).toISOString();
      const freshness = memoryFreshnessNote(m.updatedAt);
      return `- [${m.type}] ${m.name} (${date}): ${m.description}${freshness ? ` ${freshness}` : ''}`;
    })
    .join('\n');
}

// ─── البحث عن ذكريات ذات صلة ─────────────────────────────────

/**
 * البحث عن ذكريات ذات صلة بالاستعلام.
 */
export function findRelevantMemories(
  query: string,
  maxResults = 5,
  excludeIds: Set<string> = new Set(),
): MemoryEntry[] {
  const memories = loadMemories().filter((m) => !excludeIds.has(m.id));
  if (!query.trim()) return memories.slice(0, maxResults);

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(Boolean);

  const scored = memories.map((m) => {
    let score = 0;
    const searchText = `${m.name} ${m.description} ${m.content} ${m.tags.join(' ')}`.toLowerCase();

    for (const word of queryWords) {
      if (searchText.includes(word)) score += 10;
      if (m.name.toLowerCase().includes(word)) score += 5;
      if (m.tags.some((t) => t.toLowerCase().includes(word))) score += 3;
    }

    return { memory: m, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.memory);
}

// ─── التحقق من نوع الذاكرة ──────────────────────────────────

/**
 * تحليل نوع الذاكرة من قيمة خام.
 */
export function parseMemoryType(raw: unknown): MemoryType | undefined {
  if (typeof raw === 'string' && MEMORY_TYPES.includes(raw as MemoryType)) {
    return raw as MemoryType;
  }
  return undefined;
}
