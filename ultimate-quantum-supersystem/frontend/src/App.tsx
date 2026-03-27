import React from 'react'
import './components/styles/dashboard.css'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div className="app-root" dir="rtl">
      <header className="app-header">منصة Ultimate Quantum SuperSystem</header>
      <main>
        <Dashboard />
      </main>
    </div>
  )
}
