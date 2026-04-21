import { Search, Shield, TrendingUp, Zap } from 'lucide-react';
/**
 * QuantumClassicalComparison — مقارنة الأداء الكمومي والكلاسيكي
 * يعرض مقارنات لثلاث مهام: البحث، التشفير، التحسين
 */
import type React from 'react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ═══════════════════════════════════════════════════════════════
// البيانات المدمجة (محاكاة)
// ═══════════════════════════════════════════════════════════════

/** نوع المهمة المقارنة */
type TaskType = 'search' | 'crypto' | 'optimization';

/** بيانات نقطة مقارنة */
interface ComparisonPoint {
  name: string;
  quantum: number;
  classical: number;
  unit: string;
  description: string;
}

/** بيانات مهمة مقارنة */
interface ComparisonTask {
  id: TaskType;
  label: string;
  icon: React.ElementType;
  color: string;
  quantumAdvantage: string;
  advantageMultiple: number;
  data: ComparisonPoint[];
  notes: string;
}

const COMPARISON_TASKS: ComparisonTask[] = [
  {
    id: 'search',
    label: 'البحث',
    icon: Search,
    color: '#3b82f6',
    quantumAdvantage: 'تسريع تربيعي',
    advantageMultiple: 31.6,
    notes: 'خوارزمية Grover: O(√N) مقارنة بـ O(N) الكلاسيكية',
    data: [
      {
        name: 'N=1K',
        quantum: 32,
        classical: 1000,
        unit: 'عملية',
        description: 'عمليات البحث في قائمة 1000 عنصر',
      },
      {
        name: 'N=1M',
        quantum: 1000,
        classical: 1000000,
        unit: 'عملية',
        description: 'عمليات البحث في قائمة مليون عنصر',
      },
      {
        name: 'N=1B',
        quantum: 31623,
        classical: 1000000000,
        unit: 'عملية',
        description: 'عمليات البحث في قائمة مليار عنصر',
      },
    ],
  },
  {
    id: 'crypto',
    label: 'التشفير',
    icon: Shield,
    color: '#8b5cf6',
    quantumAdvantage: 'أمان أفضل × حجم أصغر',
    advantageMultiple: 3.2,
    notes: 'Kyber-768 vs RSA-2048: أمان أعلى (192 بت) مع مفتاح أصغر',
    data: [
      {
        name: 'حجم المفتاح (KB)',
        quantum: 1.16,
        classical: 0.25,
        unit: 'KB',
        description: 'حجم المفتاح العام — Kyber-768 vs RSA-2048',
      },
      {
        name: 'مستوى الأمان (بت)',
        quantum: 192,
        classical: 112,
        unit: 'بت',
        description: 'مستوى الأمان الفعلي بالبتات',
      },
      {
        name: 'سرعة التوليد (×)',
        quantum: 13.1,
        classical: 1.0,
        unit: '× أسرع',
        description: 'سرعة توليد المفاتيح النسبية',
      },
    ],
  },
  {
    id: 'optimization',
    label: 'التحسين',
    icon: TrendingUp,
    color: '#10b981',
    quantumAdvantage: 'تحسين تقريبي أسرع',
    advantageMultiple: 4.8,
    notes: 'QAOA vs Simulated Annealing لمسائل التحسين التوافقي',
    data: [
      {
        name: 'N=20 (جودة)',
        quantum: 94,
        classical: 87,
        unit: '%',
        description: 'جودة الحل لـ 20 متغيراً',
      },
      {
        name: 'N=50 (جودة)',
        quantum: 88,
        classical: 74,
        unit: '%',
        description: 'جودة الحل لـ 50 متغيراً',
      },
      {
        name: 'وقت التقارب (×)',
        quantum: 4.8,
        classical: 1.0,
        unit: '× أسرع',
        description: 'سرعة التقارب إلى الحل',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// tooltip مخصص
// ═══════════════════════════════════════════════════════════════

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-lg p-3 text-xs font-mono shadow-xl" dir="rtl">
      <p className="text-slate-300 mb-2 font-semibold">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('ar-SA') : entry.value}
          {unit ? ` ${unit}` : ''}
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// مكوّن QuantumClassicalComparison
// ═══════════════════════════════════════════════════════════════

/**
 * لوحة مقارنة الأداء الكمومي والكلاسيكي
 */
export const QuantumClassicalComparison: React.FC = () => {
  const [activeTask, setActiveTask] = useState<TaskType>('search');
  const task = COMPARISON_TASKS.find((t) => t.id === activeTask)!;
  const Icon = task.icon;

  return (
    <div
      className="bg-slate-900/80 rounded-xl border border-white/10 p-5"
      dir="rtl"
      role="region"
      aria-label="مقارنة الأداء الكمومي والكلاسيكي"
    >
      {/* ─── الرأس ─── */}
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-yellow-400" />
        <h2 className="text-sm font-semibold text-white">الأفضلية الكمومية</h2>
        <span className="text-[10px] font-mono text-slate-500">Quantum vs Classical</span>
      </div>

      {/* ─── اختيار المهمة ─── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {COMPARISON_TASKS.map((t) => {
          const TIcon = t.icon;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setActiveTask(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                activeTask === t.id
                  ? 'text-white border-transparent'
                  : 'text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
              style={activeTask === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}
            >
              <TIcon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── مؤشر الأفضلية ─── */}
      <div
        className="flex items-center gap-3 mb-4 p-3 rounded-lg border"
        style={{ borderColor: `${task.color}30`, backgroundColor: `${task.color}10` }}
      >
        <Icon size={20} style={{ color: task.color }} />
        <div>
          <div className="text-xs font-semibold text-white">{task.quantumAdvantage}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{task.notes}</div>
        </div>
        <div className="mr-auto text-center">
          <div className="text-xl font-mono font-bold" style={{ color: task.color }}>
            {task.advantageMultiple}×
          </div>
          <div className="text-[9px] text-slate-500 font-mono">الأفضلية</div>
        </div>
      </div>

      {/* ─── الرسم البياني ─── */}
      <div className="h-52 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={task.data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d36" horizontal={false} />
            <XAxis
              type="number"
              stroke="#8E9299"
              fontSize={9}
              tick={{ fontFamily: 'monospace' }}
              tickFormatter={(v) => v.toLocaleString('ar-SA')}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#8E9299"
              fontSize={9}
              width={80}
              tick={{ fontFamily: 'monospace', fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#8E9299' }} />
            {/* الشريط الكمومي */}
            <Bar dataKey="quantum" name="كمومي" fill={task.color} radius={[0, 4, 4, 0]} maxBarSize={20} />
            {/* الشريط الكلاسيكي */}
            <Bar dataKey="classical" name="كلاسيكي" fill="#475569" radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── جدول التفاصيل ─── */}
      <div className="overflow-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-1.5 text-right text-slate-500 font-semibold">المعيار</th>
              <th className="py-1.5 text-center font-semibold" style={{ color: task.color }}>
                كمومي
              </th>
              <th className="py-1.5 text-center text-slate-500 font-semibold">كلاسيكي</th>
              <th className="py-1.5 text-right text-slate-500 font-semibold">الوصف</th>
            </tr>
          </thead>
          <tbody>
            {task.data.map((point) => (
              <tr key={point.name} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-2 text-slate-300">{point.name}</td>
                <td className="py-2 text-center font-bold" style={{ color: task.color }}>
                  {point.quantum.toLocaleString('ar-SA')} {point.unit}
                </td>
                <td className="py-2 text-center text-slate-500">
                  {point.classical.toLocaleString('ar-SA')} {point.unit}
                </td>
                <td className="py-2 text-slate-600 text-[9px]">{point.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuantumClassicalComparison;
