/**
 * EnhancedMetricsCard — بطاقة مقاييس محسّنة مع تأثيرات Glassmorphism
 * QURABIA Platform
 *
 * تصميم عالمي احترافي مع:
 * - Glassmorphism & Backdrop Blur
 * - رسوم بيانية مصغرة (Sparklines)
 * - تأثيرات Hover متقدمة
 * - Micro-interactions
 */

import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SparklineData {
  value: number;
  timestamp: number;
}

interface EnhancedMetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  sparklineData?: SparklineData[];
  animated?: boolean;
}

const EnhancedMetricsCard: React.FC<EnhancedMetricsCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color,
  trend = 'neutral',
  trendValue,
  sparklineData = [],
  animated = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // رسم Sparkline
  useEffect(() => {
    if (!sparklineData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const values = sparklineData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = sparklineData.map((d, i) => ({
      x: (i / (sparklineData.length - 1)) * width,
      y: height - ((d.value - min) / range) * height,
    }));

    // رسم المنحنى
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }

    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);

    // التعبئة المتدرجة
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '08');

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // رسم الخط
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [sparklineData, color]);

  // تحريك العداد
  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(typeof value === 'number' ? value : 0);
      return;
    }

    let startValue = 0;
    const endValue = value;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayValue(startValue + (endValue - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animated]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'var(--p-success)';
      case 'down':
        return 'var(--p-error)';
      default:
        return 'var(--fg-3)';
    }
  };

  return (
    <div
      className="enhanced-metrics-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: isHovered
          ? `linear-gradient(135deg, ${color}15, ${color}08)`
          : `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isHovered ? color + '40' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 20px 60px ${color}30, 0 0 0 1px ${color}20`
          : '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* خلفية متحركة */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${color}20, transparent 70%)`,
          borderRadius: '50%',
          transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.5)' : 'scale(1)',
          opacity: isHovered ? 1 : 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* المحتوى */}
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 14 }}>
        {/* العنوان والأيقونة */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: 'var(--font-ar)',
                  fontSize: 10,
                  color: 'var(--fg-3)',
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${color}18`,
              border: `1px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
              transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isHovered ? 'rotate(10deg) scale(1.1)' : 'rotate(0) scale(1)',
            }}
          >
            <Icon size={22} />
          </div>
        </div>

        {/* القيمة */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 32,
              fontWeight: 900,
              color: 'var(--fg)',
              lineHeight: 1,
            }}
          >
            {typeof value === 'number'
              ? displayValue.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 0,
                })
              : value}
          </span>
          {unit && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--fg-3)',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div style={{ height: 40, marginTop: 4 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                opacity: isHovered ? 1 : 0.7,
                transition: 'opacity 300ms',
              }}
            />
          </div>
        )}

        {/* الاتجاه */}
        {trendValue && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: getTrendColor(),
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              {getTrendIcon()}
              {trendValue}
            </div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-ar)',
              }}
            >
              آخر 24 ساعة
            </span>
          </div>
        )}
      </div>

      {/* تأثير Shimmer عند Hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${color}15, transparent)`,
          transform: isHovered ? 'translateX(200%)' : 'translateX(0)',
          transition: 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default EnhancedMetricsCard;
