export const PHYSICAL_CONSTANTS = {
  PLANCK_H: 6.62607015e-34,
  HBAR: 1.054571817e-34,
  SPEED_OF_LIGHT: 2.99792458e8,
  GRAVITATIONAL_G: 6.67430e-11,
  PLANCK_ENERGY: 1.956e9,
  HARTREE_TO_EV: 27.211396,
  JOULE_TO_EV: 6.241509074e18,
} as const

export const ALOTAIBI_CONSTANTS = {
  ALPHA: 25.3,
  BETA: 0.9985,
  K_DARK_MATTER: 0.26,
  K_DARK_ENERGY: 0.70,
  OMEGA_DM: 0.2589,
  OMEGA_DE: 0.6847,
} as const

export interface Complex { real:number; imag:number }
export interface QubitState { alpha: Complex; beta: Complex }
export interface AlOtaibiResult { totalEnergyJoules:number; totalEnergyEV:number; photonEnergyJ:number; quantumAmplification:number; darkSectorFactor:number; waveBridgeFactor:number; fineTuningFactor:number; singularitySuppressed:boolean; log:string[] }
export interface ProcessorState { numQubits:number; coherenceTimeMs:number; errorRate:number; qopsPerSecond:number; temperature:number; toricCodeActive:boolean }
export interface SimulationInput { frequency:number; waveFunctionReal:number; waveFunctionImag:number; sphericalHarmonic:number; fineTuning:number; darkMatterDensity?:number; darkEnergyDensity?:number }
export interface QubitState {
  amplitude: number
  phase: number
}

export type ToricGrid = number[][]
