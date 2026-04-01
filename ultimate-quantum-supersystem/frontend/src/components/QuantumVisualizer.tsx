import React from 'react'
export const BlochSphere: React.FC<{theta:number,phi:number,size?:number}> = ({theta,phi,size=160})=> (
  <canvas width={size} height={size} style={{borderRadius:'50%'}} />
)
export const EnergySpectrumChart: React.FC<{data:any[]}> = ()=> (<div style={{height:160}}>Spectrum</div>)
export const ProcessorRadar: React.FC<any> = ()=> (<div style={{height:200}}>Radar</div>)
export const VQEConvergenceChart: React.FC<any> = ()=> (<div style={{height:160}}>VQE</div>)

export default {} as any
