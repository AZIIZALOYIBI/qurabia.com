import React, { useEffect, useRef, useCallback } from 'react'

interface Particle { x:number;y:number;vx:number;vy:number;radius:number;opacity:number;color:string;pulsePhase:number }

export const ParticleField: React.FC<{height?:number,count?:number}> = ({height=200,count=60}) => {
  const canvasRef = useRef<HTMLCanvasElement|null>(null)
  const raf = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let particles = Array.from({length: count}, ()=>({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4,
      radius: Math.random()*2+1,
      opacity: Math.random()*0.6+0.2,
      color: '#00ffff',
      pulsePhase: Math.random()*Math.PI*2,
    }))

    function step(){
      ctx.fillStyle = 'rgba(2,4,8,0.18)'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; p.vy*=0.99
        if(p.x<0||p.x>canvas.width) p.vx*=-1
        if(p.y<0||p.y>canvas.height) p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.opacity; ctx.fill(); ctx.globalAlpha=1
      })
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return ()=> cancelAnimationFrame(raf.current)
  },[count])

  return <canvas ref={canvasRef} style={{width:'100%',height}} />
}

export default ParticleField
import React, { useEffect, useRef } from 'react'

export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const draw = () => {
      const w = (canvas.width = canvas.clientWidth)
      const h = (canvas.height = canvas.clientHeight)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#38f2ff'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 6, 0, Math.PI * 2)
      ctx.fill()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className="particle-canvas" style={{ width: '100%', height: 240 }} />
}
