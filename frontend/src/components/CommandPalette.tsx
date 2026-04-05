/**
 * CommandPalette — لوحة الأوامر الكمومية
 *
 * نظام تنقل سريع يُفعَّل بـ Ctrl+K / ⌘K
 * يعرض جميع وجهات التنقل في المنصة مع بحث فوري
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Search, Layers, Atom, FlaskConical, BrainCircuit, Terminal,
  Home, Sparkles, ArrowLeft,
} from 'lucide-react';

// ─── أنواع ─────────────────────────────────────────────────────
export interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  shortcut?: string[];
  action: () => void;
  /** كلمات البحث الإضافية */
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandItem[];
  open: boolean;
  onClose: () => void;
}

// ─── المكون ─────────────────────────────────────────────────────
const CommandPalette: React.FC<CommandPaletteProps> = ({ items, open, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // تصفية حسب البحث
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [items, query]);

  // إعادة ضبط الفهرس عند تغيير النتائج
  useEffect(() => { setActiveIndex(0); }, [filtered.length]);

  // فتح/إغلاق: تركيز على حقل الإدخال
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // تأخير قصير لضمان ظهور العنصر
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // التنقل بلوحة المفاتيح
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        filtered[activeIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filtered, activeIndex, onClose]
  );

  // التمرير التلقائي للعنصر النشط
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="q-cmd-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="q-cmd-panel"
        role="dialog"
        aria-modal="true"
        aria-label="لوحة الأوامر السريعة"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* حقل البحث */}
        <div className="q-cmd-input-wrap">
          <Search size={20} style={{ color: 'var(--fg-3)', flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            className="q-cmd-input"
            type="text"
            dir="rtl"
            placeholder="ابحث أو انتقل... (اكتب اسم القسم)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في الأوامر"
            autoComplete="off"
          />
          <kbd className="ui-kbd" style={{ fontSize: 10 }}>Esc</kbd>
        </div>

        {/* قائمة النتائج */}
        <div className="q-cmd-list" ref={listRef} role="listbox" aria-label="نتائج البحث">
          {filtered.length === 0 && (
            <div style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: 'var(--font-ar)',
              fontSize: 14,
              color: 'var(--fg-3)',
            }}>
              لا توجد نتائج لـ &quot;{query}&quot;
            </div>
          )}
          {filtered.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="q-cmd-item"
                role="option"
                aria-selected={index === activeIndex}
                data-active={index === activeIndex ? 'true' : undefined}
                data-index={index}
                onClick={() => { item.action(); onClose(); }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div
                  className="q-cmd-item-icon"
                  style={{ background: `${item.iconColor}18`, color: item.iconColor }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="q-cmd-item-label">{item.label}</div>
                  <div className="q-cmd-item-desc">{item.description}</div>
                </div>
                {item.shortcut && (
                  <div className="q-cmd-kbd">
                    {item.shortcut.map((k) => (
                      <kbd key={k} className="ui-kbd" style={{ fontSize: 10 }}>{k}</kbd>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* التذييل */}
        <div className="q-cmd-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd className="ui-kbd" style={{ fontSize: 9 }}>↑↓</kbd>
              <span>تنقل</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd className="ui-kbd" style={{ fontSize: 9 }}>Enter</kbd>
              <span>تأكيد</span>
            </span>
          </div>
          <span>QURABIA Command Palette</span>
        </div>
      </div>
    </div>
  );
};

// ─── Hook لتفعيل لوحة الأوامر ─────────────────────────────────
export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen, toggle: () => setOpen((v) => !v) };
};

// ─── أوامر التنقل الافتراضية (لصفحة Landing) ─────────────────
export const buildLandingCommands = (
  onEnterPlatform: () => void,
  onEnterForge: () => void,
  scrollToForge: () => void,
  scrollToServices: () => void,
): CommandItem[] => [
  {
    id: 'platform',
    label: 'المنصة الكمومية',
    description: 'ادخل منصة QURABIA الموحدة — المحاكاة والتحليل',
    icon: Layers,
    iconColor: '#C6FF2E',
    action: onEnterPlatform,
    keywords: ['منصة', 'platform', 'دخول'],
  },
  {
    id: 'forge',
    label: 'المصهر الكمي',
    description: 'حوّل النص العربي إلى كيوبتات وبصمة كمية',
    icon: Sparkles,
    iconColor: '#00D4FF',
    action: onEnterForge,
    keywords: ['مصهر', 'forge', 'تكميم', 'نص'],
  },
  {
    id: 'forge-section',
    label: 'جرّب المصهر الآن',
    description: 'انتقل إلى قسم المصهر الكمي في هذه الصفحة',
    icon: Atom,
    iconColor: '#FFB000',
    action: scrollToForge,
    keywords: ['تجربة', 'scroll'],
  },
  {
    id: 'services',
    label: 'خدماتنا',
    description: 'استعرض الخدمات الستة — AI، كم، أمن، تحليل، رقمي، برمجيات',
    icon: BrainCircuit,
    iconColor: '#A78BFA',
    action: scrollToServices,
    keywords: ['خدمات', 'services'],
  },
];

// ─── أوامر التنقل للمنصة الموحدة ─────────────────────────────
export const buildPlatformCommands = (
  setActiveTab: (tab: string) => void,
  onBackToLanding?: () => void,
): CommandItem[] => {
  const cmds: CommandItem[] = [
    {
      id: 'tab-overview',
      label: 'نظرة عامة',
      description: 'المؤشرات الحية وكرة بلوخ والنتائج',
      icon: Layers,
      iconColor: '#C6FF2E',
      shortcut: ['1'],
      action: () => setActiveTab('overview'),
      keywords: ['overview', 'عامة', 'مؤشرات'],
    },
    {
      id: 'tab-strategic',
      label: 'المحركات الكمومية',
      description: 'معادلات العتيبي، بحث Grover، التشفير، QNN',
      icon: Atom,
      iconColor: '#00D4FF',
      shortcut: ['2'],
      action: () => setActiveTab('strategic'),
      keywords: ['strategic', 'محركات', 'كمومية', 'عتيبي'],
    },
    {
      id: 'tab-simulation',
      label: 'مختبر المحاكاة',
      description: 'اختر نوع المحاكاة وشغّل التجربة',
      icon: FlaskConical,
      iconColor: '#FFB000',
      shortcut: ['3'],
      action: () => setActiveTab('simulation'),
      keywords: ['simulation', 'محاكاة', 'مختبر'],
    },
    {
      id: 'tab-analytics',
      label: 'التحليل الذكي',
      description: 'تحليل AI متقدم للنتائج',
      icon: BrainCircuit,
      iconColor: '#A78BFA',
      shortcut: ['4'],
      action: () => setActiveTab('analytics'),
      keywords: ['analytics', 'تحليل', 'ذكي'],
    },
    {
      id: 'tab-terminal',
      label: 'الطرفية',
      description: 'الطرفية الافتراضية ومخرجات النظام',
      icon: Terminal,
      iconColor: '#10B981',
      shortcut: ['5'],
      action: () => setActiveTab('terminal'),
      keywords: ['terminal', 'طرفية'],
    },
  ];

  if (onBackToLanding) {
    cmds.push({
      id: 'back-landing',
      label: 'العودة للرئيسية',
      description: 'العودة إلى صفحة الهبوط الرئيسية',
      icon: Home,
      iconColor: '#EF4444',
      action: onBackToLanding,
      keywords: ['رئيسية', 'landing', 'عودة', 'home'],
    });
  }

  return cmds;
};

export default CommandPalette;
