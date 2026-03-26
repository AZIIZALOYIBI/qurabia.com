/**
 * ============================================================
 * Dashboard.tsx – لوحة التحكم المرئية الفائقة
 * Ultimate Quantum SuperSystem v5.0
 *
 * تضم: مقاييس حية، مرئيات كمية، ترمينال AGI،
 *       مراقب أخلاقيات، شبكة كيوبتات، طيف طاقة
 * ============================================================
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';

import { ParticleField }        from './ParticleField';
import {
  BlochSphere,
  EnergySpectrumChart,
  ProcessorRadar,
  VQEConvergenceChart,
} from './QuantumVisualizer';

import { calculateAlOtaibiUnified } from '../core/quantum-core';
import { EthicalGovernanceSystem }  from '../ethics/EthicalGovernance';
import './styles/dashboard.css';

// ...existing code... (full Dashboard.tsx content as provided above) ...
