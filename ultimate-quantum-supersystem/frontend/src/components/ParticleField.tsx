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
