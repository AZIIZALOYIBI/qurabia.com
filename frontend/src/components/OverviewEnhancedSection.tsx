/**
 * OverviewEnhancedSection — قسم النظرة العامة المحسّن
 * QURABIA Platform
 *
 * قسم شامل يجمع جميع المكونات المحسّنة في واجهة موحدة
 */

import { Activity, BarChart3, Brain, Cpu, Database, FileText, Terminal, Users } from 'lucide-react';
import React, { useState } from 'react';
import AIAnalyticsDashboard from './AIAnalyticsDashboard';
import AgentsDashboard from './AgentsDashboard';
import DatasetInsightsDashboard from './DatasetInsightsDashboard';
import { SovereignDashboard } from './SovereignDashboard';

type TabId = 'engines' | 'simulation' | 'analytics' | 'datasets' | 'agents' | 'audit' | 'terminal';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  color: string;
}

const TABS: Tab[] = [
  { id: 'engines', label: 'المحركات الكمومية', icon: Cpu, color: '#00d4ff' },
  { id: 'simulation', label: 'مختبر المحاكاة', icon: Activity, color: '#10b981' },
  { id: 'analytics', label: 'التحليل الذكي', icon: Brain, color: '#a855f7' },
  { id: 'datasets', label: 'تحليل البيانات', icon: Database, color: '#f59e0b' },
  { id: 'agents', label: 'الوكلاء', icon: Users, color: '#ec4899' },
  { id: 'audit', label: 'السجل', icon: FileText, color: '#06b6d4' },
  { id: 'terminal', label: 'الطرفية', icon: Terminal, color: '#8b5cf6' },
];

const OverviewEnhancedSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('engines');

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        padding: '20px',
        display: 'grid',
        gap: 20,
      }}
      dir="rtl"
    >
      {/* رأس القسم */}
      <div
        className="ui-card"
        style={{
          padding: 24,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.10), rgba(198,255,46,0.05))',
          borderColor: 'rgba(0,212,255,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* خلفية متحركة */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            left: -150,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(0,212,255,0.15), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: -150,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(198,255,46,0.12), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #00d4ff, #c6ff2e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,212,255,0.4)',
              }}
            >
              <BarChart3 size={28} color="#000" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00d4ff, #c6ff2e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                نظرة عامة محسّنة
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontFamily: 'var(--font-ar)',
                  fontSize: 14,
                  color: 'var(--fg-3)',
                }}
              >
                لوحة تحكم شاملة بتصميم عالمي واحترافي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* شريط التبويبات */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '4px 0',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderRadius: 16,
                border: `1px solid ${isActive ? tab.color + '50' : 'var(--outline)'}`,
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color}18, ${tab.color}08)`
                  : 'var(--surface)',
                color: isActive ? tab.color : 'var(--fg-2)',
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                fontWeight: isActive ? 900 : 600,
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isActive ? `0 8px 24px ${tab.color}30` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--surface-2)';
                  e.currentTarget.style.borderColor = 'var(--outline-2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--outline)';
                }
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* محتوى التبويب النشط */}
      <div
        style={{
          animation: 'fade-in-up 400ms ease-out',
        }}
      >
        {activeTab === 'engines' && (
          <div>
            <div
              style={{
                marginBottom: 16,
                fontFamily: 'var(--font-ui)',
                fontSize: 20,
                fontWeight: 900,
                color: activeTabData?.color,
              }}
            >
              المحركات الكمومية السيادية
            </div>
            <SovereignDashboard />
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="ui-card" style={{ padding: 40, borderRadius: 24, textAlign: 'center' }}>
            <Activity size={48} style={{ margin: '0 auto 16px', color: '#10b981' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 900 }}>
              مختبر المحاكاة
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>
              قريباً - محاكاة كمومية تفاعلية متقدمة
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div
              style={{
                marginBottom: 16,
                fontFamily: 'var(--font-ui)',
                fontSize: 20,
                fontWeight: 900,
                color: activeTabData?.color,
              }}
            >
              التحليل الذكي المتقدم
            </div>
            <AIAnalyticsDashboard />
          </div>
        )}

        {activeTab === 'datasets' && (
          <div>
            <div
              style={{
                marginBottom: 16,
                fontFamily: 'var(--font-ui)',
                fontSize: 20,
                fontWeight: 900,
                color: activeTabData?.color,
              }}
            >
              تحليل البيانات الذكي
            </div>
            <DatasetInsightsDashboard />
          </div>
        )}

        {activeTab === 'agents' && (
          <div>
            <div
              style={{
                marginBottom: 16,
                fontFamily: 'var(--font-ui)',
                fontSize: 20,
                fontWeight: 900,
                color: activeTabData?.color,
              }}
            >
              الوكلاء الذكيون
            </div>
            <AgentsDashboard />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="ui-card" style={{ padding: 40, borderRadius: 24, textAlign: 'center' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', color: '#06b6d4' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 900 }}>
              سجل التدقيق
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>
              قريباً - سجل شامل لجميع العمليات
            </p>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="ui-card" style={{ padding: 40, borderRadius: 24, textAlign: 'center' }}>
            <Terminal size={48} style={{ margin: '0 auto 16px', color: '#8b5cf6' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 900 }}>
              الطرفية الافتراضية
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>
              قريباً - طرفية تفاعلية للأوامر المتقدمة
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewEnhancedSection;
