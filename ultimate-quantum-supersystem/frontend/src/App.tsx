import React, { Suspense } from 'react'
const Dashboard = React.lazy(() => import('./components/Dashboard'))

const Loader: React.FC = () => (
  <div style={{width: '100vw', height: '100vh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffff'}}>
    <div>تهيئة Ultimate Quantum SuperSystem v5.0...</div>
  </div>
)

const App: React.FC = () => (
  <Suspense fallback={<Loader />}>
    <Dashboard />
  </Suspense>
)

export default App
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
