/**
 * AGIConsole.tsx – وحدة تحكم AGI التفاعلية
 * Ultimate Quantum SuperSystem v5.0
 *
 * واجهة طرفية (terminal-style) تتيح:
 * - إدخال أوامر نصية للـ AGI
 * - عرض سجل المحادثة مع الردود
 * - مؤشرات مستوى الوعي والإحصاءات
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { agiBridge, type AGIDecision } from '../agi/QuantumAGIBridge';

// ================================================================
// الأنواع
// ================================================================

interface ConsoleLine {
  id:        number;
  type:      'input' | 'output' | 'error' | 'system';
  text:      string;
  timestamp: number;
}

const PROMPT_SYMBOL = 'ψ >';

// ================================================================
// ألوان الأسطر
// ================================================================
const LINE_COLORS: Record<ConsoleLine['type'], string> = {
  input:  'var(--quantum-cyan)',
  output: 'var(--text-primary)',
  error:  'var(--quantum-red, #ff3366)',
  system: 'var(--quantum-gold, #ffd700)',
};

// ================================================================
// عرض قرار واحد كحزمة نصية
// ================================================================
function formatDecision(d: AGIDecision): string[] {
  const lines: string[] = [];
  lines.push(`[${d.intent}] ثقة=${(d.confidence * 100).toFixed(1)}%  أخلاق=${(d.ethicsScore * 100).toFixed(1)}%  ${d.isAllowed ? '✓ مسموح' : '✗ مرفوض'}`);
  lines.push(`↳ ${d.recommendedAction}`);
  if (d.preloadedModules.length > 0) {
    lines.push(`   وحدات: ${d.preloadedModules.join(', ')}`);
  }
  lines.push(`   معالجة: ${d.processingTimeMs.toFixed(2)} ms  [${d.decisionId}]`);
  return lines;
}

// ================================================================
// أوامر مدمجة
// ================================================================
type BuiltinCommand = (args: string[]) => string[];

const BUILTIN_COMMANDS: Record<string, BuiltinCommand> = {
  help: () => [
    'الأوامر المتاحة:',
    '  help          – عرض هذه المساعدة',
    '  status        – حالة AGI وإحصاءات الجلسة',
    '  clear         – مسح الشاشة',
    '  <أي نص>       – إرسال النص كطلب لـ AGI Bridge',
  ],
  status: () => {
    const session      = agiBridge.getSession();
    const approvalRate = agiBridge.getApprovalRate();
    const level        = agiBridge.getConsciousnessLevel();
    return [
      `مستوى الوعي  : ${level}`,
      `معدل الموافقة: ${(approvalRate * 100).toFixed(1)}%`,
      `طلبات المعالجة: ${session.totalQueries}`,
      `الجلسة: ${session.sessionId}`,
    ];
  },
};

// ================================================================
// المكوّن الرئيسي
// ================================================================

export interface AGIConsoleProps {
  maxLines?: number;
  height?:   number | string;
  onDecision?: (d: AGIDecision) => void;
}

export const AGIConsole: React.FC<AGIConsoleProps> = ({
  maxLines   = 200,
  height     = 340,
  onDecision,
}) => {
  const [lines,  setLines]  = useState<ConsoleLine[]>([
    { id: 0, type: 'system', text: 'Ultimate Quantum SuperSystem v5.0 – AGI Console', timestamp: Date.now() },
    { id: 1, type: 'system', text: 'اكتب "help" للمساعدة أو أدخل طلبك مباشرة...', timestamp: Date.now() },
  ]);
  const [input,  setInput]  = useState('');
  const [loading, setLoading] = useState(false);
  const idRef   = useRef(2);
  const bodyRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on new lines
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  const appendLines = useCallback((newLines: Omit<ConsoleLine, 'id'>[], replace = false) => {
    setLines(prev => {
      const appended = newLines.map(l => ({ ...l, id: idRef.current++ }));
      const next = replace ? appended : [...prev, ...appended];
      return next.slice(-maxLines);
    });
  }, [maxLines]);

  const handleSubmit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || loading) return;
    setInput('');

    // echo input line
    appendLines([{ type: 'input', text: `${PROMPT_SYMBOL} ${cmd}`, timestamp: Date.now() }]);

    // built-in clear
    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    // other builtins
    const builtin = BUILTIN_COMMANDS[cmd.toLowerCase()];
    if (builtin) {
      const out = builtin(cmd.split(' ').slice(1));
      appendLines(out.map(text => ({ type: 'output' as const, text, timestamp: Date.now() })));
      return;
    }

    // AGI Bridge
    setLoading(true);
    try {
      const decision = await agiBridge.processIntent(cmd);
      const outputs  = formatDecision(decision);
      appendLines(outputs.map(text => ({
        type: 'output' as const,
        text,
        timestamp: Date.now(),
      })));
      onDecision?.(decision);
    } catch (err) {
      appendLines([{
        type: 'error',
        text: `خطأ: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, appendLines, onDecision]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  }, [handleSubmit]);

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height,
      background:    'rgba(0,0,0,0.6)',
      border:        '1px solid rgba(0,255,255,0.15)',
      borderRadius:  8,
      overflow:      'hidden',
      fontFamily:    'var(--font-mono)',
      fontSize:      11,
    }}>
      {/* Header */}
      <div style={{
        padding:    '6px 12px',
        background: 'rgba(0,255,255,0.05)',
        borderBottom: '1px solid rgba(0,255,255,0.1)',
        display:    'flex',
        justifyContent: 'space-between',
        color:      'var(--quantum-cyan)',
        fontSize:   10,
        flexShrink: 0,
      }}>
        <span>AGI CONSOLE</span>
        <span style={{ color: loading ? 'var(--quantum-gold)' : 'var(--quantum-green)' }}>
          {loading ? '⏳ معالجة...' : '● جاهز'}
        </span>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '8px 12px',
          display:    'flex',
          flexDirection: 'column',
          gap:        2,
        }}
      >
        {lines.map(line => (
          <div
            key={line.id}
            style={{
              color:       LINE_COLORS[line.type],
              whiteSpace:  'pre-wrap',
              wordBreak:   'break-all',
              lineHeight:  1.5,
              opacity:     line.type === 'system' ? 0.75 : 1,
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Input Row */}
      <div style={{
        display:     'flex',
        padding:     '6px 10px',
        borderTop:   '1px solid rgba(0,255,255,0.1)',
        gap:         6,
        flexShrink:  0,
        background:  'rgba(0,0,0,0.4)',
      }}>
        <span style={{ color: 'var(--quantum-cyan)', alignSelf: 'center' }}>{PROMPT_SYMBOL}</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          dir="rtl"
          style={{
            flex:       1,
            background: 'transparent',
            border:     'none',
            outline:    'none',
            color:      'var(--quantum-cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize:   11,
          }}
          autoFocus
          aria-label="AGI command input"
        />
      </div>
    </div>
  );
};

export default AGIConsole;
