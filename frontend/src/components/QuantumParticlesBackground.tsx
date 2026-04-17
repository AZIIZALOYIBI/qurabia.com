/**
 * QuantumParticlesBackground — خلفية جسيمات تفاعلية بألوان Claude
 *
 * نظام جسيمات ديناميكي يتفاعل مع الماوس ويستخدم ألوان Claude الدافئة
 * (Copper, Amber, Sand) لإنشاء تجربة بصرية ساحرة
 */

import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  pulsePhase: number;
}

interface QuantumParticlesBackgroundProps {
  particleCount?: number;
  interactive?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  claudeTheme?: boolean;
}

const QuantumParticlesBackground: React.FC<QuantumParticlesBackgroundProps> = ({
  particleCount = 60,
  interactive = true,
  intensity = 'medium',
  claudeTheme = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  // ألوان Claude الدافئة
  const CLAUDE_COLORS = claudeTheme
    ? ['#CC785C', '#D4A574', '#E8DCC8', '#BF9B6E']  // Claude copper, amber, sand, amber-brown
    : ['#C6FF2E', '#00D4FF', '#FFB000', '#10B981']; // Default QURABIA colors

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: CLAUDE_COLORS[Math.floor(Math.random() * CLAUDE_COLORS.length)],
        opacity: Math.random() * 0.5 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, [particleCount, CLAUDE_COLORS]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with fade effect
    ctx.fillStyle = 'rgba(7, 10, 15, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    const intensityFactor = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.5 : 1;

    particles.forEach((particle, i) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Mouse interaction
      if (interactive) {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150 * intensityFactor;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          particle.vx -= (dx / distance) * force * 0.02;
          particle.vy -= (dy / distance) * force * 0.02;
        }
      }

      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Pulse effect
      particle.pulsePhase += 0.02;
      const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;

      // Draw particle with glow
      ctx.save();
      ctx.globalAlpha = particle.opacity * pulse;

      // Glow effect
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 3 * intensityFactor
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * 3 * intensityFactor, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw connections (only for nearby particles)
      particles.slice(i + 1).forEach((otherParticle) => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxConnectionDistance = 120 * intensityFactor;

        if (distance < maxConnectionDistance) {
          ctx.save();
          ctx.globalAlpha = ((maxConnectionDistance - distance) / maxConnectionDistance) * 0.15 * pulse;
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [interactive, intensity]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  }, [initParticles]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleResize, handleMouseMove, animate, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.4,
      }}
      aria-hidden="true"
    />
  );
};

export default QuantumParticlesBackground;
