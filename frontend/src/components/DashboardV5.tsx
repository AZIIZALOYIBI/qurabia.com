import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuantumState } from '../hooks/useQuantumState';
import { SimulationFactory, SimulationType } from '../engine/SimulationFactory';
import { TaskOrchestrator } from '../engine/TaskOrchestrator';
import { GeminiService } from '../engine/GeminiService';
import { GrokService } from '../engine/GrokService';
import ProblemConfig from './ProblemConfig';
import ResultsDisplay from './ResultsDisplay';
import InteractiveBlochSphere from '../visualizers/InteractiveBlochSphere';
import { 
  Cpu, Zap, Activity, Info, LogOut, LayoutGrid, 
  Terminal, Share2, Shield, Settings, Bell, Clock, BrainCircuit, Palette 
} from 'lucide-react';

import { InnovationTester } from '../utils/InnovationTester';
import NeuroCustomization, { ThemePreset } from './NeuroCustomization';
import QuantumNeuralOverlay from './QuantumNeuralOverlay';

const DashboardV5: React.FC = () => {
  const { 
    status, 
    progress, 
    lastResult, 
    setStatus, 
    updateProgress, 
    setLastResult 
  } = useQuantumState();

  const [simType, setSimType] = useState<SimulationType>('PHYSICS');
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; provider: string }>({ text: "", provider: "" });
  const [innovationResults, setInnovationResults] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>('QUANTUM_CYAN');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [params, setParams] = useState({
    frequency: 5.45e14,
    waveFunctionReal: 0.707,
    waveFunctionImag: 0.707,
    sphericalHarmonic: 1.0,
    fineTuning: 1.0,
    iterations: 60
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunSimulation = useCallback(async () => {
    setStatus('QUANTUM_INIT');
    updateProgress(10);
    setAiAnalysis({ text: "", provider: "" });

    // استخدام TaskOrchestrator لتنفيذ المهمة
    await TaskOrchestrator.scheduleTask({
      type: 'SIMULATION_BOOT',
      priority: 'HIGH',
      payload: { simType }
    });

    const phases = [
      { s: 'CALIBRATION', p: 30, t: 800 },
      { s: 'PROCESSING', p: 60, t: 1200 },
      { s: 'PROCESSING', p: 90, t: 1000 },
    ];

    for (const phase of phases) {
      await new Promise(r => setTimeout(r, phase.t));
      setStatus(phase.s as any);
      updateProgress(phase.p);
    }

    try {
      const result = await SimulationFactory.run(simType, params);
      setLastResult(result);
      
      // تحليل النتائج - استخدام Grok كأولوية
      let analysisText = "";
      let provider = "xAI Grok";

      try {
        analysisText = await GrokService.analyzeSimulation(result);
      } catch (err) {
        console.warn("Grok failed, using Gemini/Mock fallback");
        provider = "Gemini AI";
        analysisText = await GeminiService.analyzeSimulation(result);
      }
      setAiAnalysis({ text: analysisText, provider });
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  }, [simType, params, setStatus, updateProgress, setLastResult]);

  const handleRunInnovation = useCallback(() => {
    setStatus('PROCESSING');
    updateProgress(50);
    setTimeout(() => {
      const results = InnovationTester.runFullSuite();
      setInnovationResults(results);
      setStatus('COMPLETED');
      updateProgress(100);
    }, 1500);
  }, [setStatus, updateProgress]);

  return (
    <div id="quantum-os" className="visible" style={{
      width: '100vw', height: '100vh',
      display: 'grid',
      gridTemplateRows: '52px 1fr 32px',
      gridTemplateColumns: '72px 1fr 320px',
      gridTemplateAreas: '"titlebar titlebar titlebar" "sidebar main panel" "taskbar taskbar taskbar"',
      background: 'var(--c-void)',
      color: 'var(--t-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Layer */}
      <div className="holo-grid" />
      <div className="corner-sweep tl" style={{ position: 'fixed', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(0,245,255,0.04), transparent 70%)', zIndex: 0 }} />
      <div className="corner-sweep br" style={{ position: 'fixed', bottom: 0, left: 0, width: 400, height: 400, background: 'radial-gradient(ellipse at bottom left, rgba(180,0,255,0.06), transparent 70%)', zIndex: 0 }} />

      {/* ── Titlebar ─────────────────────────────────────────── */}
      <header id="titlebar" style={{ gridArea: 'titlebar' }}>
        <div className="tb-logo-group">
          <div className="tb-logo-atom">
            <Zap className="w-full h-full text-[var(--c-cyan)]" />
          </div>
          <div className="tb-logo-text">
            <div className="tb-logo-name">QURABIA OS</div>
            <div className="tb-logo-ver">v5.0.0-quantum</div>
          </div>
        </div>

        <div className="tb-metrics">
          <div className="tb-chip cyan">
            <div className="tb-chip-dot" />
            <span className="tb-chip-lbl">CORE:</span>
            <span className="tb-chip-val">STABLE</span>
          </div>
          <div className="tb-chip gold">
            <div className="tb-chip-dot" />
            <span className="tb-chip-lbl">CALIB:</span>
            <span className="tb-chip-val">99.8%</span>
          </div>
          <div className="tb-chip violet">
            <div className="tb-chip-dot" />
            <span className="tb-chip-lbl">LINK:</span>
            <span className="tb-chip-val">SYNCED</span>
          </div>
        </div>

        <div className="tb-clock">
          {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <div className="tb-actions">
          <button className="tb-btn" onClick={() => setShowOverlay(!showOverlay)} title="Toggle Neural Overlay">
            <Activity className={`w-3.5 h-3.5 ${showOverlay ? 'text-[var(--c-cyan)]' : 'text-slate-500'}`} />
          </button>
          <button className="tb-btn" onClick={() => setIsCustomizing(true)} title="Neuro Customization">
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button className="tb-btn"><Bell className="w-3.5 h-3.5" /></button>
          <button className="tb-btn" onClick={() => window.location.reload()}><LogOut className="w-3.5 h-3.5" /></button>
        </div>
      </header>

      {/* ── Customization & Overlays ───────────────────────── */}
      {isCustomizing && (
        <NeuroCustomization 
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          onClose={() => setIsCustomizing(false)}
        />
      )}

      {showOverlay && (
        <QuantumNeuralOverlay 
          status={status}
          progress={progress}
          onClose={() => setShowOverlay(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside id="sidebar" style={{ gridArea: 'sidebar' }}>
        <div className="nav-item active">
          <LayoutGrid className="nav-icon" />
          <span className="nav-label">Main</span>
        </div>
        <div className="nav-item">
          <Activity className="nav-icon" />
          <span className="nav-label">Sim</span>
        </div>
        <div className="nav-sep" />
        <div className="nav-item">
          <Terminal className="nav-icon" />
          <span className="nav-label">Logs</span>
        </div>
        <div className="nav-item">
          <Shield className="nav-icon" />
          <span className="nav-label">Secure</span>
        </div>
        <div className="nav-item">
          <Share2 className="nav-icon" />
          <span className="nav-label">Hub</span>
        </div>
      </aside>

      {/* ── Main Workspace ────────────────────────────────────── */}
      <main id="main" style={{ gridArea: 'main', zIndex: 10 }}>
        <div className="workspace">
          {/* Metrics Strip */}
          <div className="metrics-strip">
            {[
              { label: 'Q-VOLUME', value: '2^50', color: 'cyan', icon: Cpu },
              { label: 'FIDELITY', value: '99.85%', color: 'gold', icon: Shield },
              { label: 'COHERENCE', value: '2.5ms', color: 'violet', icon: Clock },
              { label: 'ERROR-RT', value: '0.002%', color: 'emerald', icon: Activity },
              { label: 'QOPS/SEC', value: '31.2M', color: 'plasma', icon: Zap },
              { label: 'ENTROPY', value: '0.042', color: 'azure', icon: Info },
            ].map((m, i) => (
              <div key={i} className={`mcard ${m.color}`}>
                <div className="mcard-bg" />
                <m.icon className="mcard-icon" />
                <div className="mcard-value">{m.value}</div>
                <div className="mcard-label">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Central Visualizers */}
          <div className="canvas-panel" style={{ gridColumn: '1' }}>
            <div className="cp-header">
              <div className="cp-title cyan"><Activity className="w-3 h-3" /> QUBIT STATE VECTOR</div>
              <div className="cp-badge">BLOCH SPHERE</div>
            </div>
            <div className="cp-body flex items-center justify-center">
              <InteractiveBlochSphere 
                theta={status === 'PROCESSING' ? Math.random() * Math.PI : 1.1} 
                phi={status === 'PROCESSING' ? Math.random() * Math.PI * 2 : 0.4} 
                size={340}
              />
            </div>
          </div>

          <div className="canvas-panel" style={{ gridColumn: '2' }}>
            <div className="cp-header">
              <div className="cp-title violet"><Cpu className="w-3 h-3" /> QUANTUM TELEMETRY</div>
              <div className="cp-badge">REAL-TIME</div>
            </div>
            <div className="cp-body">
              <ResultsDisplay result={lastResult} status={status} progress={progress} />
              
              {/* AI Analysis Section */}
              {aiAnalysis.text && (
                <div className="mt-6 p-5 bg-[var(--c-violet-dim)] border border-[var(--c-violet)]/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3 mb-3 text-[var(--c-violet)]">
                    <BrainCircuit className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{aiAnalysis.provider} Insights</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300 italic font-medium">
                    "{aiAnalysis.text}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="action-strip">
            <ProblemConfig 
              type={simType} params={params} 
              onTypeChange={setSimType} onChange={setParams} 
              onRun={handleRunSimulation}
              disabled={status !== 'IDLE' && status !== 'COMPLETED'}
            />
          </div>
        </div>
      </main>

      {/* ── Right Panel ───────────────────────────────────────── */}
      <aside id="panel" style={{ gridArea: 'panel' }}>
        <div className="panel-tab-bar">
          <div className="ptab active">
            <Clock className="ptab-icon" />
            <span>Lab</span>
          </div>
          <div className="ptab">
            <Shield className="ptab-icon" />
            <span>History</span>
          </div>
        </div>
        <div className="panel-content active">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-[var(--c-cyan)]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Innovation Lab</h3>
            </div>
            
            <button 
              onClick={handleRunInnovation}
              disabled={status === 'PROCESSING'}
              className="w-full py-3 bg-[var(--c-cyan)]/10 border border-[var(--c-cyan)]/30 rounded-xl text-[var(--c-cyan)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--c-cyan)]/20 transition-all disabled:opacity-50"
            >
              Run Innovation Suite
            </button>

            {innovationResults && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-[9px] text-slate-400 uppercase mb-1">Pathfinding (QRP)</div>
                  <div className="text-xs font-mono text-[var(--c-cyan)]">{innovationResults.qrp.length} Steps Found</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-[9px] text-slate-400 uppercase mb-1">Compression (EDC)</div>
                  <div className="text-xs font-mono text-[var(--c-gold)]">Ratio: {innovationResults.edc.ratio}%</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-[9px] text-slate-400 uppercase mb-1">Evolution (QAGE)</div>
                  <div className="text-xs font-mono text-[var(--c-violet)]">Fitness: {innovationResults.qage.fitness.toFixed(4)}</div>
                </div>
              </div>
            )}

            <div className="nav-sep" />
            
            <div className="text-[8px] text-slate-500 leading-relaxed uppercase tracking-tighter">
              The algorithms above leverage the Al-Otaibi unified equation to solve pathfinding, data entropy, and genetic optimization in a quantum-resonant field.
            </div>

            <div className="nav-sep" />

            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">Qubit Matrix</span>
                <span className="widget-badge">50 ACTIVE</span>
              </div>
              <div className="widget-body">
                <div className="qubit-matrix">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className={`qbit ${i % 7 === 0 ? 'active' : i % 5 === 0 ? 'entangled' : 'idle'}`}>
                      {i.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">System Load</span>
              </div>
              <div className="widget-body space-y-4">
                {[
                  { label: 'CPU Usage', val: 12, color: 'var(--c-cyan)' },
                  { label: 'QPU Stability', val: 98, color: 'var(--c-emerald)' },
                  { label: 'Thermal', val: 45, color: 'var(--c-gold)' },
                ].map((g, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase">{g.label}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: g.color }}>{g.val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Taskbar ──────────────────────────────────────────── */}
      <footer id="taskbar" style={{ 
        gridArea: 'taskbar', 
        background: 'rgba(2,4,16,0.98)', 
        borderTop: '1px solid rgba(0,245,255,0.08)',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t-muted)'
      }}>
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--c-emerald)] rounded-full shadow-[0_0_6px_var(--c-emerald)]" />
            <span>SYSTEM READY</span>
          </div>
          <div className="w-px h-3 bg-white/5" />
          <span>UPTIME: 99.99%</span>
          <div className="w-px h-3 bg-white/5" />
          <span>LATENCY: 0.04ms</span>
        </div>
      </footer>

      <style>{`
        #titlebar {
          grid-area: titlebar;
          position: relative;
          z-index: 100;
          height: 52px;
          background: rgba(2,4,16,0.98);
          border-bottom: 1px solid rgba(0,245,255,0.08);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 0;
          backdrop-filter: blur(40px) saturate(2);
          box-shadow: 0 1px 0 rgba(0,245,255,0.05), 0 4px 40px rgba(0,0,10,0.8);
        }
        #titlebar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, var(--c-violet) 20%, var(--c-cyan) 50%, var(--c-gold) 80%, transparent 100%);
          animation: titlebarFlow 4s linear infinite;
          background-size: 200% 100%;
        }
        @keyframes titlebarFlow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .tb-logo-group { display: flex; align-items: center; gap: 12px; padding-left: 8px; border-left: 1px solid rgba(0,245,255,0.1); margin-left: 16px; }
        .tb-logo-atom { width: 32px; height: 32px; position: relative; flex-shrink: 0; }
        .tb-logo-name { font-family: var(--font-display); font-size: 13px; font-weight: 900; letter-spacing: 3px; background: linear-gradient(90deg, var(--c-cyan), var(--c-gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .tb-logo-ver { font-family: var(--font-mono); font-size: 9px; color: var(--t-muted); letter-spacing: 2px; }
        .tb-metrics { display: flex; align-items: center; gap: 4px; flex: 1; padding: 0 24px; }
        .tb-chip { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 6px; border: 1px solid transparent; font-family: var(--font-mono); font-size: 10px; transition: all 0.2s var(--ease-snap); cursor: default; }
        .tb-chip.cyan { background: rgba(0,245,255,0.06); border-color: rgba(0,245,255,0.15); color: var(--c-cyan); }
        .tb-chip.gold { background: rgba(255,200,0,0.06); border-color: rgba(255,200,0,0.15); color: var(--c-gold); }
        .tb-chip.violet { background: rgba(180,0,255,0.06); border-color: rgba(180,0,255,0.15); color: var(--c-violet); }
        .tb-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; animation: chipDotPulse 2s ease-in-out infinite; }
        @keyframes chipDotPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .tb-clock { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--c-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 2px; padding: 0 16px; border-left: 1px solid rgba(0,245,255,0.08); }
        .tb-actions { display: flex; align-items: center; gap: 6px; padding: 0 12px; }
        .tb-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: var(--t-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s var(--ease-snap); }
        .tb-btn:hover { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.3); color: var(--c-cyan); box-shadow: 0 0 12px rgba(0,245,255,0.2); }
        
        #sidebar { grid-area: sidebar; position: relative; z-index: 50; width: 72px; background: rgba(2,4,14,0.96); border-left: 1px solid rgba(0,245,255,0.06); display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 6px; backdrop-filter: blur(30px); }
        .nav-item { width: 48px; height: 48px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s var(--ease-snap); border: 1px solid transparent; gap: 3px; }
        .nav-item:hover { background: rgba(0,245,255,0.06); border-color: rgba(0,245,255,0.15); transform: scale(1.05); }
        .nav-item.active { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.3); box-shadow: 0 0 20px rgba(0,245,255,0.15); }
        .nav-label { font-size: 7px; font-family: var(--font-mono); color: var(--t-muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .nav-item.active .nav-label { color: var(--c-cyan); }
        .nav-sep { width: 32px; height: 1px; background: rgba(0,245,255,0.08); margin: 4px 0; }

        .workspace { width: 100%; height: 100%; padding: 16px; display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: 1fr 1fr; gap: 12px; overflow: hidden; }
        .metrics-strip { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .mcard { background: rgba(4,8,24,0.8); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; position: relative; overflow: hidden; cursor: default; transition: all 0.25s var(--ease-snap); }
        .mcard.cyan { color: var(--c-cyan); border-color: rgba(0,245,255,0.12); }
        .mcard.gold { color: var(--c-gold); border-color: rgba(255,200,0,0.12); }
        .mcard.violet { color: var(--c-violet); border-color: rgba(180,0,255,0.12); }
        .mcard.emerald { color: var(--c-emerald); border-color: rgba(0,255,157,0.12); }
        .mcard.plasma { color: var(--c-plasma); border-color: rgba(255,45,107,0.12); }
        .mcard.azure { color: var(--c-azure); border-color: rgba(0,102,255,0.12); }
        .mcard-icon { font-size: 18px; margin-bottom: 6px; }
        .mcard-value { font-family: var(--font-mono); font-size: 20px; font-weight: 700; line-height: 1; text-shadow: 0 0 15px currentColor; margin-bottom: 3px; }
        .mcard-label { font-size: 9px; color: var(--t-muted); letter-spacing: 0.5px; }

        .canvas-panel { background: rgba(2,4,12,0.85); border: 1px solid rgba(0,245,255,0.08); border-radius: 14px; overflow: hidden; position: relative; }
        .cp-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid rgba(0,245,255,0.06); background: rgba(0,245,255,0.02); }
        .cp-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .cp-badge { font-family: var(--font-mono); font-size: 8px; padding: 2px 8px; border-radius: 10px; border: 1px solid currentColor; opacity: 0.6; }
        .cp-body { padding: 12px; height: calc(100% - 42px); position: relative; }

        .action-strip { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; }

        #panel { grid-area: panel; position: relative; z-index: 50; background: rgba(2,4,14,0.96); border-right: 1px solid rgba(0,245,255,0.06); display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(30px); }
        .panel-tab-bar { display: flex; border-bottom: 1px solid rgba(0,245,255,0.08); background: rgba(0,245,255,0.02); flex-shrink: 0; }
        .ptab { flex: 1; padding: 10px 4px; font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.5px; text-align: center; color: var(--t-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; text-transform: uppercase; display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .ptab.active { color: var(--c-cyan); border-bottom-color: var(--c-cyan); }
        .panel-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 14px; display: none; flex-direction: column; gap: 12px; }
        .panel-content.active { display: flex; }
        .widget { background: rgba(4,8,24,0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
        .widget-head { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .widget-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; }
        .widget-badge { font-family: var(--font-mono); font-size: 8px; padding: 1px 6px; border-radius: 8px; background: rgba(0,245,255,0.08); border: 1px solid rgba(0,245,255,0.15); color: var(--c-cyan); }
        .widget-body { padding: 12px; }
        .qubit-matrix { display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; }
        .qbit { aspect-ratio: 1; border-radius: 3px; border: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 7px; transition: all 0.3s var(--ease-snap); cursor: default; position: relative; overflow: hidden; }
        .qbit.idle { background: rgba(40,60,100,0.2); color: rgba(80,120,180,0.3); }
        .qbit.active { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.3); color: var(--c-cyan); animation: qbitActive 2s ease-in-out infinite; }
        .qbit.entangled { background: rgba(180,0,255,0.1); border-color: rgba(180,0,255,0.3); color: var(--c-violet); }
        @keyframes qbitActive { 0%,100% { box-shadow: 0 0 4px rgba(0,245,255,0.3); } 50% { box-shadow: 0 0 10px rgba(0,245,255,0.6); } }
      `}</style>
    </div>
  );
};

export default DashboardV5;
