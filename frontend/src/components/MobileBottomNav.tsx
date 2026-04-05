/**
 * MobileBottomNav — شريط التنقل السفلي للجوال
 *
 * بديل مبتكر لإخفاء القائمة الجانبية على الشاشات الصغيرة.
 * يعرض التبويبات الخمسة بأيقونات مع مؤشر نشط متحرك.
 */
import React from 'react';
import {
  Layers, Atom, FlaskConical, BrainCircuit, Terminal,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'overview', label: 'عامة', icon: Layers },
  { id: 'strategic', label: 'كمومي', icon: Atom },
  { id: 'simulation', label: 'محاكاة', icon: FlaskConical },
  { id: 'analytics', label: 'تحليل', icon: BrainCircuit },
  { id: 'terminal', label: 'طرفية', icon: Terminal },
] as const;

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => (
  <nav className="q-mobile-nav" aria-label="التنقل السفلي">
    <ul className="q-mobile-nav-list" role="tablist">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <li key={tab.id} role="presentation">
            <button
              role="tab"
              aria-selected={isActive}
              className={`q-mobile-nav-item ${isActive ? 'q-mobile-nav-item--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
            >
              <Icon size={20} />
              <span className="q-mobile-nav-label">{tab.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default MobileBottomNav;
