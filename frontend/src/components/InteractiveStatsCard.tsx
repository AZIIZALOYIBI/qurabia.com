/**
 * InteractiveStatsCard — بطاقة إحصائيات تفاعلية متقدمة
 * QURABIA Platform
 *
 * بطاقة إحصائيات مع:
 * - تأثيرات 3D عند التفاعل
 * - رسوم بيانية مدمجة
 * - أنيميش ات سلسة
 * - مؤشرات تقدم دائرية
 */

import { LucideIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface InteractiveStatsCardProps {
  title: string;
  value: number;
  target?: number;
  unit?: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  showProgress?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const InteractiveStatsCard: React.FC<InteractiveStatsCardProps> = ({
  title,
  value,
  target,
  unit = '',
  icon: Icon,
  color,
  description,
  showProgress = false,
  trend,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  // تحريك العداد
  useEffect(() => {
    let startValue = displayValue;
    const endValue = value;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateX = -(mouseY / (rect.height / 2)) * 15;
    const rotateY = (mouseX / (rect.width / 2)) * 15;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const percentage = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${color}12, ${color}06)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${color}30`,
          borderRadius: 24,
          padding: 24,
          transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: `
            rotateX(${rotation.x}deg)
            rotateY(${rotation.y}deg)
            ${isHovered ? 'translateZ(20px) scale(1.03)' : 'translateZ(0) scale(1)'}
          `,
          boxShadow: isHovered
            ? `0 30px 60px ${color}25, 0 0 0 1px ${color}30, inset 0 1px 0 ${color}20`
            : `0 10px 40px ${color}15, 0 0 0 1px ${color}20`,
        }}
      >
        {/* خلفية منقطة */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
            backgroundImage: `radial-gradient(${color}15 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            opacity: isHovered ? 0.6 : 0.3,
            transition: 'opacity 400ms',
            pointerEvents: 'none',
          }}
        />

        {/* دائرة مضيئة */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${color}25, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
            transform: isHovered ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* الرأس */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--fg-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: 6,
                }}
              >
                {title}
              </div>
              {description && (
                <div
                  style={{
                    fontFamily: 'var(--font-ar)',
                    fontSize: 12,
                    color: 'var(--fg-3)',
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </div>
              )}
            </div>

            {/* الأيقونة */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${color}18`,
                border: `1px solid ${color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                transform: isHovered ? 'rotate(15deg) scale(1.1)' : 'rotate(0) scale(1)',
                transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <Icon size={28} />
            </div>
          </div>

          {/* القيمة */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 42,
                fontWeight: 900,
                color: 'var(--fg)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {displayValue.toLocaleString('en-US', {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              })}
            </span>
            {unit && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--fg-3)',
                }}
              >
                {unit}
              </span>
            )}
          </div>

          {/* مؤشر التقدم */}
          {showProgress && target && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--fg-3)',
                }}
              >
                <span>التقدم</span>
                <span style={{ color, fontWeight: 700 }}>{percentage.toFixed(1)}%</span>
              </div>
              <div
                style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    borderRadius: 999,
                    transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 0 12px ${color}60`,
                  }}
                />
              </div>
            </div>
          )}

          {/* الاتجاه */}
          {trend && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: trend.isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: trend.isPositive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span style={{ fontSize: 16 }}>{trend.isPositive ? '↗' : '↘'}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: trend.isPositive ? '#10b981' : '#ef4444',
                }}
              >
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>
                هذا الأسبوع
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveStatsCard;
