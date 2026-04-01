import { PHYSICAL_CONSTANTS, ALOTAIBI_CONSTANTS, type SimulationInput, type AlOtaibiResult } from '../types/quantum.types'

export const computePhotonEnergy = (frequency:number)=> PHYSICAL_CONSTANTS.PLANCK_H * frequency

export const computeQuantumAmplification = ()=>{
  const { ALPHA, BETA } = ALOTAIBI_CONSTANTS
  return ALPHA * (ALPHA + BETA * BETA)
}

export const computeDarkSectorFactor = (omegaDM:number, omegaDE:number)=> 1 + ALOTAIBI_CONSTANTS.K_DARK_MATTER * omegaDM + ALOTAIBI_CONSTANTS.K_DARK_ENERGY * omegaDE

export const computeWaveBridge = (psiReal:number, psiImag:number, spherical:number)=> Math.sqrt(psiReal*psiReal + psiImag*psiImag) * Math.abs(spherical)

export function calculateAlOtaibiUnified(input: SimulationInput): AlOtaibiResult {
  const E1 = computePhotonEnergy(input.frequency)
  const E2 = computeQuantumAmplification()
  const E3 = computeDarkSectorFactor(input.darkMatterDensity ?? ALOTAIBI_CONSTANTS.OMEGA_DM, input.darkEnergyDensity ?? ALOTAIBI_CONSTANTS.OMEGA_DE)
  const E4 = computeWaveBridge(input.waveFunctionReal, input.waveFunctionImag, input.sphericalHarmonic)
  let total = E1 * E2 * E3 * E4 * input.fineTuning
  if (!isFinite(total) || total > PHYSICAL_CONSTANTS.PLANCK_ENERGY) { total = PHYSICAL_CONSTANTS.PLANCK_ENERGY }
  return { totalEnergyJoules: total, totalEnergyEV: total * PHYSICAL_CONSTANTS.JOULE_TO_EV, photonEnergyJ: E1, quantumAmplification: E2, darkSectorFactor: E3, waveBridgeFactor: E4, fineTuningFactor: input.fineTuning, singularitySuppressed: total===PHYSICAL_CONSTANTS.PLANCK_ENERGY, log:[] }
}
// Placeholder for quantum core algorithms and helpers
export function computeQubitState(sample: number) {
  // مؤقت: إرجاع حالة تتناسب مع العينة المدخلة
  return { amplitude: Math.sin(sample), phase: Math.cos(sample) }
}
