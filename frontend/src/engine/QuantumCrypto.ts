/**
 * AUTDIE Quantum Security Function
 * دالة الأمان الكمي الموحدة وفق نظرية العتيبي
 */

export interface SecurityResult {
  S_AUTDIE: number;
  QBER_AUTDIE: number;
  secure: boolean;
}

export class AUTDIESecurityFunction {
  compute(_t = 0.0, kappa: number = Math.PI / 4, _lam = 1.0): SecurityResult {
    const V_ent = 1.0;

    const sinK = Math.sin(kappa);
    const sinKappaSq = sinK * sinK;
    const S_AUTDIE = Math.tanh(sinKappaSq * V_ent);

    const QBER_AUTDIE = 0.25 * Math.exp(-sinKappaSq * V_ent);

    return {
      S_AUTDIE,
      QBER_AUTDIE,
      secure: S_AUTDIE >= 0.35,
    };
  }
}
