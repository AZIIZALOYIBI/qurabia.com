import React, { useState, useMemo } from 'react'
import ParticleField from './ParticleField'
import { EnergySpectrumChart } from './QuantumVisualizer'
import '../components/styles/dashboard.css'

const Dashboard: React.FC = ()=>{
  const spectrum = useMemo(()=>[],[])
  return (
    <div className="quantum-dashboard">
      <header className="quantum-header">QUANTUM OS</header>
      <main style={{padding:20}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 400px',gap:16}}>
          <div>
            <div className="quantum-panel"><ParticleField height={220} count={80} /></div>
            <div className="quantum-panel" style={{marginTop:12}}><EnergySpectrumChart data={spectrum} /></div>
          </div>
          <aside>
            <div className="quantum-panel">Sidebar</div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
import React from 'react'
import ParticleField from './ParticleField'

export default function Dashboard() {
  return (
    <section className="dashboard">
      <h2>لوحة التحكم التجريبية</h2>
      <p>مرحباً — هذا مُكون تجريبي للمرئيات الكمية.</p>
      <ParticleField />
    </section>
  )
}
