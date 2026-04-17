/**
 * LiveMetricsGraph — رسوم بيانية حية متقدمة
 * QURABIA Platform
 *
 * مكون رسوم بيانية مع:
 * - تحديث في الوقت الفعلي
 * - تأثيرات Gradient متقدمة
 * - تفاعل Tooltip ذكي
 * - دعم أنواع مختلفة من المخططات
 */

import React, { useEffect, useRef, useState } from 'react';

export type GraphType = 'line' | 'area' | 'bar';

interface DataPoint {
  label: string;
  value: number;
  timestamp?: number;
}

interface LiveMetricsGraphProps {
  data: DataPoint[];
  type?: GraphType;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  gradientIntensity?: number;
}

const LiveMetricsGraph: React.FC<LiveMetricsGraphProps> = ({
  data,
  type = 'area',
  color = '#00d4ff',
  height = 200,
  showGrid = true,
  showTooltip = true,
  animated = true,
  gradientIntensity = 0.6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!animated) {
      setAnimationProgress(1);
      return;
    }

    let startTime: number | null = null;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animated, data]);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // رسم الشبكة
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        // قيم المحور Y
        const value = maxValue - (valueRange / 5) * i;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px var(--font-mono)';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
      }
    }

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const normalizedValue = (d.value - minValue) / valueRange;
      const y = padding.top + chartHeight - normalizedValue * chartHeight * animationProgress;
      return { x, y, value: d.value };
    });

    if (type === 'area' || type === 'line') {
      // رسم المنطقة المملوءة
      if (type === 'area') {
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
        ctx.lineTo(lastPoint.x, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, color + Math.round(gradientIntensity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '08');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

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
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // رسم النقاط
      points.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // تسليط الضوء على النقطة عند Hover
        if (hoveredPoint && hoveredPoint.index === i) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = color + '40';
          ctx.fill();
        }
      });
    } else if (type === 'bar') {
      const barWidth = chartWidth / data.length * 0.7;
      const barGap = chartWidth / data.length * 0.3;

      points.forEach((point, i) => {
        const barHeight = (point.value - minValue) / valueRange * chartHeight * animationProgress;
        const x = point.x - barWidth / 2;
        const y = padding.top + chartHeight - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // حد البار
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
      });
    }

    // التسميات على المحور X
    data.forEach((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x, height - 10);
    });
  }, [data, type, color, height, showGrid, animationProgress, hoveredPoint, gradientIntensity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !showTooltip) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { left: 50, right: 20 };
    const chartWidth = rect.width - padding.left - padding.right;
    const pointX = padding.left;

    let closestIndex = -1;
    let closestDistance = Infinity;

    data.forEach((_, i) => {
      const px = pointX + (i / (data.length - 1)) * chartWidth;
      const distance = Math.abs(x - px);
      if (distance < closestDistance && distance < 20) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    if (closestIndex >= 0) {
      const px = pointX + (closestIndex / (data.length - 1)) * chartWidth;
      setHoveredPoint({ index: closestIndex, x: px, y });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          cursor: showTooltip ? 'crosshair' : 'default',
        }}
      />

      {/* Tooltip */}
      {showTooltip && hoveredPoint !== null && (
        <div
          style={{
            position: 'absolute',
            left: hoveredPoint.x,
            top: hoveredPoint.y - 60,
            transform: 'translateX(-50%)',
            background: 'rgba(10,12,18,0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}60`,
            borderRadius: 12,
            padding: '8px 12px',
            boxShadow: `0 8px 24px ${color}30`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 2 }}>
            {data[hoveredPoint.index].label}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color }}>
            {data[hoveredPoint.index].value.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMetricsGraph;
