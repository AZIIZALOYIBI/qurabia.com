/**
 * ============================================================
 * companion/CompanionSprite.tsx – مكوّن عرض الرفيق الكمي
 * Quantum Companion System
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { companionUserId, roll } from './companion';
import { IDLE_SEQUENCE, TICK_MS, renderSprite } from './sprites';
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from './types';
import type { Companion, StoredCompanion } from './types';

// ─── أسماء تلقائية للرفيق ────────────────────────────────────
const AUTO_NAMES: string[] = [
  'كيوبي',
  'فوتونة',
  'نيوترينا',
  'بوزونا',
  'كواركي',
  'فيرمي',
  'غلوني',
  'ميزونا',
  'لبتونا',
  'بلازمي',
  'هادرونا',
  'تاكيونا',
  'غرافي',
  'إلكترونا',
  'بوزيترونا',
  'بروتونا',
  'نيوترونا',
  'ميوونا',
];

const AUTO_PERSONALITIES: string[] = [
  'فضولي ويحب استكشاف الفضاء الكمي',
  'هادئ ومتأمل في حالات التراكب',
  'نشيط ويقفز بين مستويات الطاقة',
  'حكيم ويفهم أسرار التشابك الكمي',
  'مرح ويحب التداخل الموجي',
];

/**
 * الحصول على أو إنشاء الروح المحفوظة للرفيق.
 */
function getOrCreateSoul(inspirationSeed: number): StoredCompanion {
  const storageKey = 'qurabia-companion-soul';
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as StoredCompanion;
      } catch {
        /* إعادة إنشاء */
      }
    }
  }

  const nameIdx = inspirationSeed % AUTO_NAMES.length;
  const persIdx = Math.floor(inspirationSeed / AUTO_NAMES.length) % AUTO_PERSONALITIES.length;

  const soul: StoredCompanion = {
    name: AUTO_NAMES[nameIdx],
    personality: AUTO_PERSONALITIES[persIdx],
    hatchedAt: Date.now(),
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(storageKey, JSON.stringify(soul));
  }
  return soul;
}

/**
 * مكوّن عرض الرفيق الكمي المتحرك.
 */
export default function CompanionSprite() {
  const [tick, setTick] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const companion: Companion | null = useMemo(() => {
    const userId = companionUserId();
    const { bones, inspirationSeed } = roll(userId);
    const soul = getOrCreateSoul(inspirationSeed);
    return { ...bones, ...soul };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % IDLE_SEQUENCE.length);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const toggleStats = useCallback(() => setShowStats((s) => !s), []);

  if (!companion) return null;

  const frameIdx = IDLE_SEQUENCE[tick];
  const lines = renderSprite(companion, frameIdx);
  const color = RARITY_COLORS[companion.rarity];
  const stars = RARITY_STARS[companion.rarity];

  return (
    <div
      onClick={toggleStats}
      style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '12px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        border: `1px solid ${color}40`,
        background: `${color}10`,
        maxWidth: '200px',
        userSelect: 'none',
      }}
      title={`${companion.name} — ${companion.personality}`}
    >
      {/* رأس الرفيق */}
      <div style={{ textAlign: 'center', marginBottom: '4px', color }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{companion.name}</span>
        <span style={{ marginRight: '4px', fontSize: '9px', opacity: 0.7 }}> {stars}</span>
      </div>

      {/* الرسم المتحرك */}
      <pre
        style={{
          margin: 0,
          color: companion.shiny ? '#ffd700' : color,
          textAlign: 'center',
          textShadow: companion.shiny ? '0 0 4px #ffd70066' : 'none',
        }}
      >
        {lines.join('\n')}
      </pre>

      {/* معلومات النوع */}
      <div style={{ textAlign: 'center', fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>
        {companion.species} • {companion.rarity}
        {companion.shiny && ' ✧shiny✧'}
      </div>

      {/* الإحصائيات (تظهر بالنقر) */}
      {showStats && (
        <div style={{ marginTop: '6px', fontSize: '9px' }}>
          {STAT_NAMES.map((stat) => (
            <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <span style={{ width: '80px', textAlign: 'left', opacity: 0.7 }}>{stat}</span>
              <div style={{ flex: 1, height: '4px', background: '#333', borderRadius: '2px' }}>
                <div
                  style={{
                    width: `${companion.stats[stat]}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span style={{ width: '24px', textAlign: 'left', fontSize: '8px' }}>{companion.stats[stat]}</span>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '4px', opacity: 0.5, fontSize: '8px' }}>
            {companion.personality}
          </div>
        </div>
      )}
    </div>
  );
}
