import numpy as np

h = 6.62607015e-34
hbar = 1.054571817e-34
c = 299_792_458.0
kB = 1.380649e-23
alpha_em = 7.2973525693e-3
m_e = 9.1093837015e-31
l_P = np.sqrt(hbar * 6.67430e-11 / c**3)
T_e = m_e * c**2 / kB

class BlackbodyEngine:
    def __init__(self) -> None:
        self.enable_qed = True
        self.enable_sz = False
        self.enable_fs = False
        self.enable_lqg = True
        self.enable_gup = True
        self.sz_y_param = 1e-4
        self.cavity_radius_m = 0.02
        self.gup_beta0 = 1.0
        self.lqg_C2 = 1.0

    def planck(self, nu: float, T: float) -> float:
        if T <= 0 or nu <= 0:
            return 0.0
        x = h * nu / (kB * T)
        if x > 500:
            return 0.0
        pref = 2 * h * nu**3 / c**2
        return pref / (np.exp(x) - 1)

    def n0(self, nu: float, T: float) -> float:
        if T <= 0 or nu <= 0:
            return 0.0
        x = h * nu / (kB * T)
        if x > 500:
            return 0.0
        return 1.0 / (np.exp(x) - 1)

    def cr_qed(self, nu: float, T: float) -> float:
        if T <= 0 or nu <= 0:
            return 0.0
        n = self.n0(nu, T)
        coeff = 44 * np.pi**2 * alpha_em**2 / 2025
        r = (1 + n) * coeff * (h * nu / (m_e * c**2)) * (T / T_e) ** 3
        return r

    def cr_gup(self, nu: float) -> float:
        if nu <= 0:
            return 0.0
        k = 2 * np.pi * nu / c
        return -2 * self.gup_beta0 * (l_P * k) ** 2

    def cr_lqg(self, nu: float, T: float) -> float:
        if T <= 0 or nu <= 0:
            return 0.0
        x = h * nu / (kB * T)
        C2_eff = self.lqg_C2 * (kB * T * l_P / (hbar * c)) ** 2
        return C2_eff * x ** 2

    def total_delta(self, nu: float, T: float) -> float:
        d = 0.0
        if self.enable_qed:
            d += self.cr_qed(nu, T)
        if self.enable_lqg:
            d += self.cr_lqg(nu, T)
        if self.enable_gup:
            d += self.cr_gup(nu)
        return d

    def point(self, nu: float, T: float) -> dict:
        B0 = self.planck(nu, T)
        d = self.total_delta(nu, T)
        return {
            "freq_Hz": float(nu),
            "wavelength_m": float(c / nu) if nu > 0 else float("inf"),
            "B_planck": float(B0),
            "delta_total": float(d),
            "B_corrected": float(B0 * (1 + d)),
        }

    def spectrum(self, T: float, nu_min: float, nu_max: float, n_points: int) -> dict:
        freqs = np.geomspace(nu_min, nu_max, int(n_points))
        spec = [self.point(nu, T) for nu in freqs]
        peak_idx = int(np.argmax([p["B_planck"] for p in spec])) if spec else 0
        peak_freq = spec[peak_idx]["freq_Hz"] if spec else 0.0
        return {
            "temperature_K": float(T),
            "num_points": int(n_points),
            "freq_range_Hz": [float(nu_min), float(nu_max)],
            "peak_frequency_Hz": float(peak_freq),
            "peak_wavelength_nm": float(c / peak_freq * 1e9) if peak_freq > 0 else 0.0,
            "spectrum": spec,
        }
