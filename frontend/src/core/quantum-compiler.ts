/**
 * quantum-compiler.ts – مصهر كمومي أولي Prototype
 *
 * يدعم ترجمة وصف بسيط للدائرة الكمومية إلى خطة تشغيل على محاكي StateVector.
 * يضيف:
 * - تحليل DSL بسيط (H, X, CNOT, RX, MEASURE...)
 * - ترجمة إلى `GateOperation[]`
 * - تحسينات أولية مثل حذف أزواج البوابات المتطابقة
 * - تخطيط تشغيل مع تقدير العمق والحسابات
 */

import {
  computeCircuitMetrics,
  measureQubit,
  runCircuit,
  type GateName,
  type GateOperation,
  type StateVectorData,
} from './statevector';

export type QuantumCompilerTarget = 'qurabia-statevector' | 'ideal-simulator';
export type QuantumInstructionKind = 'gate' | 'measurement';
export type QuantumInstructionName = GateName | 'MEASURE';

export interface QuantumInstruction {
  kind: QuantumInstructionKind;
  gate: QuantumInstructionName;
  targets: number[];
  angle?: number;
}

export interface QuantumCircuit {
  source: string;
  numQubits: number;
  instructions: QuantumInstruction[];
}

export interface CompilationPassResult {
  name: string;
  applied: boolean;
  detail?: string;
}

export interface CompiledQuantumProgram {
  target: QuantumCompilerTarget;
  circuit: QuantumCircuit;
  operations: GateOperation[];
  measurements: QuantumInstruction[];
  optimizationsApplied: CompilationPassResult[];
  estimatedDepth: number;
  gateSummary: {
    totalGates: number;
    singleQubitGates: number;
    twoQubitGates: number;
    threeQubitGates: number;
  };
}

export interface QuantumExecutionResult {
  stateVector: StateVectorData;
  measurementResults: Array<{ qubit: number; value: 0 | 1 }>;
}

export interface CompileQuantumProgramOptions {
  target?: QuantumCompilerTarget;
}

const ONE_QUBIT_GATES = new Set<GateName>(['H', 'X', 'Y', 'Z', 'S', 'T']);
const ROTATION_GATES = new Set<GateName>(['RX', 'RY', 'RZ']);
const TWO_QUBIT_GATES = new Set<GateName>(['CNOT', 'SWAP', 'CZ']);

function parseQubitToken(token: string, sourceLine: string): number {
  const normalized = token.trim().toLowerCase();
  if (!normalized) {
    throw new Error(`قيمة كيوبت غير صالحة في السطر: ${sourceLine}`);
  }
  const qubitToken = normalized.startsWith('q') ? normalized.slice(1) : normalized;
  const parsed = Number.parseInt(qubitToken, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`تعذر تحليل رقم الكيوبت '${token}' في السطر: ${sourceLine}`);
  }
  return parsed;
}

function parseInstructionLine(rawLine: string): QuantumInstruction {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) {
    throw new Error('سطر فارغ أو تعليق');
  }

  const match = line.match(/^([A-Za-z]+)(?:\(([^)]+)\))?\s*(.*)$/);
  if (!match) {
    throw new Error(`تعذر تحليل السطر: ${line}`);
  }

  const gateName = match[1].toUpperCase();
  const payload = (match[3] ?? '').trim();

  if (gateName === 'MEASURE') {
    const qubitToken = payload.split(',')[0];
    const qubit = parseQubitToken(qubitToken, line);
    return { kind: 'measurement', gate: 'MEASURE', targets: [qubit] };
  }

  if (ONE_QUBIT_GATES.has(gateName as GateName)) {
    const qubitToken = payload.split(',')[0];
    const qubit = parseQubitToken(qubitToken, line);
    return { kind: 'gate', gate: gateName as GateName, targets: [qubit] };
  }

  if (ROTATION_GATES.has(gateName as GateName)) {
    const angleText = match[2] ?? '';
    const tokens = payload.split(/\s+/).filter(Boolean);
    let angle = Number.parseFloat(angleText);
    let qubitToken = payload;

    if (Number.isNaN(angle) && tokens.length >= 2) {
      angle = Number.parseFloat(tokens[0]);
      qubitToken = tokens.slice(1).join(' ');
    }

    if (Number.isNaN(angle)) {
      throw new Error(`بوابة الدوران تحتاج زاوية في السطر: ${line}`);
    }

    const qubit = parseQubitToken(qubitToken.split(',')[0], line);
    return { kind: 'gate', gate: gateName as GateName, targets: [qubit], angle };
  }

  if (TWO_QUBIT_GATES.has(gateName as GateName)) {
    const args = payload
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (args.length !== 2) {
      throw new Error(`بوابة ${gateName} تحتاج وسيطين: ${line}`);
    }
    const targets = args.map((arg) => parseQubitToken(arg, line));
    return { kind: 'gate', gate: gateName as GateName, targets };
  }

  throw new Error(`بوابة غير مدعومة: ${gateName}`);
}

function tryOptimizePair(previous: QuantumInstruction, current: QuantumInstruction): string | null {
  if (previous.kind !== 'gate' || current.kind !== 'gate') {
    return null;
  }

  if (previous.gate !== current.gate) {
    return null;
  }

  const sameTargets = previous.targets.length === current.targets.length && previous.targets.every((value, index) => value === current.targets[index]);
  if (!sameTargets) {
    return null;
  }

  switch (previous.gate) {
    case 'H':
    case 'X':
    case 'Y':
    case 'Z':
      return `cancel-pair-${previous.gate}`;
    case 'S':
      return 'fold-ss-to-z';
    case 'T':
      return 'fold-tt-to-s';
    case 'RX':
    case 'RY':
    case 'RZ': {
      if (typeof previous.angle === 'number' && typeof current.angle === 'number') {
        if (Math.abs(previous.angle + current.angle) < 1e-12) {
          return `cancel-rotation-${previous.gate}`;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

function optimizeInstructions(instructions: QuantumInstruction[]): { instructions: QuantumInstruction[]; optimizationsApplied: CompilationPassResult[] } {
  const optimized: QuantumInstruction[] = [];
  const applied: CompilationPassResult[] = [];

  for (const instruction of instructions) {
    if (instruction.kind !== 'gate') {
      optimized.push(instruction);
      continue;
    }

    const previous = optimized[optimized.length - 1];
    const optimization = previous && tryOptimizePair(previous, instruction);

    if (optimization) {
      optimized.pop();
      if (optimization === 'fold-ss-to-z') {
        optimized.push({ kind: 'gate', gate: 'Z', targets: [previous.targets[0]] });
      } else if (optimization === 'fold-tt-to-s') {
        optimized.push({ kind: 'gate', gate: 'S', targets: [previous.targets[0]] });
      } else {
        // pair canceled by identity
      }
      applied.push({ name: optimization, applied: true, detail: 'تم حذف زوج بوابات متكرر' });
      continue;
    }

    optimized.push(instruction);
  }

  return { instructions: optimized, optimizationsApplied: applied };
}

function toGateOperation(instruction: QuantumInstruction): GateOperation {
  if (instruction.kind !== 'gate') {
    throw new Error('لا يمكن تحويل قياس إلى GateOperation');
  }

  const gateName = instruction.gate as GateName;

  if (gateName === 'CNOT') {
    return { gate: 'CNOT', target: instruction.targets[1], control: instruction.targets[0] };
  }
  if (gateName === 'SWAP') {
    return { gate: 'SWAP', target: instruction.targets[1], control: instruction.targets[0] };
  }
  if (gateName === 'CZ') {
    return { gate: 'CZ', target: instruction.targets[1], control: instruction.targets[0] };
  }
  if (gateName === 'RX' || gateName === 'RY' || gateName === 'RZ') {
    return {
      gate: gateName,
      target: instruction.targets[0],
      angle: instruction.angle,
    };
  }

  return {
    gate: gateName,
    target: instruction.targets[0],
  };
}

export function parseQuantumSource(source: string): QuantumCircuit {
  const lines = source
    .split(/\r?\n/)
    .flatMap((line) => line.split(';'))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const instructions: QuantumInstruction[] = [];
  let maxQubitIndex = -1;

  for (const rawLine of lines) {
    if (!rawLine || rawLine.startsWith('#')) {
      continue;
    }

    const instruction = parseInstructionLine(rawLine);
    instructions.push(instruction);

    for (const target of instruction.targets) {
      maxQubitIndex = Math.max(maxQubitIndex, target);
    }
  }

  return {
    source,
    numQubits: Math.max(1, maxQubitIndex + 1),
    instructions,
  };
}

export function compileQuantumProgram(
  source: string,
  options: CompileQuantumProgramOptions = {},
): CompiledQuantumProgram {
  const circuit = parseQuantumSource(source);
  const { instructions: optimizedInstructions, optimizationsApplied } = optimizeInstructions(circuit.instructions);
  const operations = optimizedInstructions.filter((instruction) => instruction.kind === 'gate').map(toGateOperation);
  const measurements = optimizedInstructions.filter((instruction) => instruction.kind === 'measurement');
  const metrics = computeCircuitMetrics(operations);

  return {
    target: options.target ?? 'qurabia-statevector',
    circuit: {
      ...circuit,
      instructions: optimizedInstructions,
    },
    operations,
    measurements,
    optimizationsApplied,
    estimatedDepth: metrics.estimatedDepth,
    gateSummary: {
      totalGates: metrics.totalGates,
      singleQubitGates: metrics.singleQubitGates,
      twoQubitGates: metrics.twoQubitGates,
      threeQubitGates: metrics.threeQubitGates,
    },
  };
}

export function executeCompiledProgram(program: CompiledQuantumProgram): QuantumExecutionResult {
  let stateVector = runCircuit(program.circuit.numQubits, program.operations);

  const measurementResults: Array<{ qubit: number; value: 0 | 1 }> = [];
  for (const measurement of program.measurements) {
    const measured = measureQubit(stateVector, measurement.targets[0]);
    measurementResults.push({ qubit: measurement.targets[0], value: measured.result });
    stateVector = measured.postMeasurementState;
  }

  return { stateVector, measurementResults };
}
