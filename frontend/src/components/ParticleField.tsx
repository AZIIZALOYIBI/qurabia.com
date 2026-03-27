/**
 * ParticleField.tsx – حقل الجسيمات الكمية التفاعلي
 * يرسم شبكة جسيمات متحركة مترابطة بخطوط تمثل التشابك الكمي
 */

import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulsePhase: number;
}

interface ParticleFieldProps {
  width?:         number;
  height?:        number;
  count?:         number;
  className?:     string;
  interactive?:   boolean;
  colorScheme?:   'cyan' | 'gold' | 'purple' | 'mixed';
}

const COLOR_SCHEMES = {
  cyan:   ['#00ffff', '#0088ff', '#00ccaa'],
  gold:   ['#ffd700', '#ffaa00', '#ff8800'],
  purple: ['#9d00ff', '#cc00ff', '#6600cc'],
  mixed:  ['#00ffff', '#ffd700', '#9d00ff', '#00ff88'],
};

export const ParticleField: React.FC<ParticleFieldProps> = ({
  width        = 800,
  height       = 400,
  count        = 80,
  className    = '',
  interactive  = true,
  colorScheme  = 'mixed',
}) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const mousePos   = useRef({ x: -1000, y: -1000 });
  const rafId      = useRef<number>(0);
  const frameCount = useRef<number>(0);

  // تهيئة الجسيمات
  const initParticles = useCallback((w: number, h: number) => {
    const colors = COLOR_SCHEMES[colorScheme];
    particles.current = Array.from({ length: count }, () => ({
      x:          Math.random() * w,
      y:          Math.random() * h,
      vx:         (Math.random() - 0.5) * 0.4,
      vy:         (Math.random() - 0.5) * 0.4,
      radius:     Math.random() * 2 + 1,
      opacity:    Math.random() * 0.6 + 0.2,
      color:      colors[Math.floor(Math.random() * colors.length)],
      pulsePhase: Math.random() * Math.PI * 2,
    }));
  }, [count, colorScheme]);

  // حلقة الرسم الرئيسية
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    frameCount.current++;

    // مسح التدريجي (Fade Trail)
    ctx.fillStyle = 'rgba(2, 4, 8, 0.18)';
    ctx.fillRect(0, 0, w, h);

    const ps = particles.current;
    const time = frameCount.current * 0.02;

    // تحديث مواضع الجسيمات
    ps.forEach(p => {
      // تأثير الجاذبية نحو مؤشر الفأرة
      if (interactive) {
        const dx = mousePos.current.x - p.x;
        const dy = mousePos.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120 * 0.003;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // تحديث الموضع مع كبح السرعة
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;

      // الارتداد عند الحواف
      if (p.x < 0)  { p.x = 0;  p.vx *= -1; }
      if (p.x > w)  { p.x = w;  p.vx *= -1; }
      if (p.y < 0)  { p.y = 0;  p.vy *= -1; }
      if (p.y > h)  { p.y = h;  p.vy *= -1; }
    });

    // رسم الخطوط بين الجسيمات المتقاربة
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const dx   = ps[i].x - ps[j].x;
        const dy   = ps[i].y - ps[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxD = 100;

        if (dist < maxD) {
          const alpha = (1 - dist / maxD) * 0.25;
          const pulse = 0.5 + 0.5 * Math.sin(time + ps[i].pulsePhase);

          // لون الخط: مزيج بين لوني الجسيمين
          ctx.beginPath();
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * (0.5 + pulse * 0.5)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // رسم الجسيمات
    ps.forEach(p => {
      const pulse  = 0.5 + 0.5 * Math.sin(time * 2 + p.pulsePhase);
      const radius = p.radius * (1 + pulse * 0.3);

      // هالة خارجية
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
      glow.addColorStop(0, p.color.replace(')', `, ${p.opacity * 0.8})`).replace('rgb', 'rgba'));
      glow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // نواة الجسيم
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    rafId.current = requestAnimationFrame(draw);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        canvas.width  = w;
        canvas.height = h || height;
        initParticles(canvas.width, canvas.height);
      }
    });

    resizeObserver.observe(canvas.parentElement || canvas);
    canvas.width  = width;
    canvas.height = height;
    initParticles(width, height);
    rafId.current = requestAnimationFrame(draw);

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(rafId.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [width, height, draw, initParticles, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
