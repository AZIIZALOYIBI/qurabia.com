/**
 * Topological Quantum Error Correction — Toric/Surface/Color Code Simulator
 * محاكاة تصحيح الأخطاء الطوبولوجي
 *
 * مستوحى من panqec/panqec
 *
 * تحسينات:
 * - أنواع أخطاء متعددة (X, Y, Z)
 * - كشف المتلازمات (Syndrome Detection)
 * - فكّ الترميز بأسلوب MWPM المبسّط
 * - تتبع عمر المنظومة المنطقية
 * - إحصائيات تصحيح تفصيلية
 */

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** نوع كود تصحيح الأخطاء */
export type CodeType = 'toric' | 'surface' | 'color';

/** نوع الخطأ الكمومي */
export type ErrorType = 'X' | 'Y' | 'Z' | 'none';

/** خلية في الشبكة الطوبولوجية */
export interface LatticeCell {
  /** نوع الخطأ الحالي */
  error: ErrorType;
  /** هل تم تصحيح الخطأ؟ */
  corrected: boolean;
  /** المتلازمة المكتشفة */
  syndrome: boolean;
}

/** نتيجة دورة تصحيح أخطاء واحدة */
export interface QECCycleResult {
  errorsCorrected: boolean;
  grid: number[][];
  errorCount: number;
  correctedCount: number;
  /** تفاصيل إضافية من panqec */
  syndromeCount: number;
  xErrors: number;
  zErrors: number;
  yErrors: number;
  logicalErrorRate: number;
}

/** إحصائيات التشغيل التراكمية */
export interface QECStats {
  /** عدد الدورات المُنفّذة */
  totalCycles: number;
  /** إجمالي الأخطاء المكتشفة */
  totalErrorsDetected: number;
  /** إجمالي الأخطاء المصححة */
  totalErrorsCorrected: number;
  /** معدل التصحيح الناجح */
  correctionRate: number;
  /** أطول عمر منطقي (عدد دورات بدون خطأ منطقي) */
  longestLogicalLifetime: number;
  /** معدل خطأ المتلازمة الزائفة */
  falseSyndromeRate: number;
}

export class ToricCodeSimulator {
  latticeSize: number;
  physicalErrorRate: number;
  grid: number[][];
  /** الشبكة التفصيلية (مع أنواع الأخطاء) */
  detailedGrid: LatticeCell[][];
  /** إحصائيات تراكمية */
  private stats: QECStats;
  /** عمر منطقي حالي */
  private currentLogicalLifetime: number;

  constructor(config: { latticeSize: number; physicalErrorRate: number }) {
    this.latticeSize = config.latticeSize;
    this.physicalErrorRate = config.physicalErrorRate;
    this.grid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    this.detailedGrid = this.createDetailedGrid();
    this.stats = {
      totalCycles: 0,
      totalErrorsDetected: 0,
      totalErrorsCorrected: 0,
      correctionRate: 0,
      longestLogicalLifetime: 0,
      falseSyndromeRate: 0,
    };
    this.currentLogicalLifetime = 0;
  }

  private createDetailedGrid(): LatticeCell[][] {
    return Array(this.latticeSize)
      .fill(null)
      .map(() =>
        Array(this.latticeSize)
          .fill(null)
          .map(() => ({
            error: 'none' as ErrorType,
            corrected: false,
            syndrome: false,
          })),
      );
  }

  initializeGroundState(): void {
    this.grid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    this.detailedGrid = this.createDetailedGrid();
  }

  /**
   * كشف المتلازمات (Syndrome Detection)
   * مستوحى من panqec — يفحص مستقرّات النجمة (Star) والسطح (Plaquette)
   *
   * كل متلازمة = حاصل ضرب العوامل المجاورة
   * إذا كانت المتلازمة ≠ +1 → خطأ مكتشف
   */
  detectSyndromes(): { syndromes: boolean[][]; count: number } {
    const syndromes: boolean[][] = Array(this.latticeSize)
      .fill(null)
      .map(() => Array(this.latticeSize).fill(false));
    let count = 0;

    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        // فحص الجيران الأربعة (مع لف طوبولوجي — torus)
        const neighbors = [
          this.detailedGrid[i][j],
          this.detailedGrid[(i + 1) % this.latticeSize][j],
          this.detailedGrid[i][(j + 1) % this.latticeSize],
          this.detailedGrid[(i - 1 + this.latticeSize) % this.latticeSize][j],
        ];

        const errorCount = neighbors.filter((n) => n.error !== 'none').length;

        // متلازمة إذا عدد الأخطاء فردي
        if (errorCount % 2 !== 0) {
          syndromes[i][j] = true;
          this.detailedGrid[i][j].syndrome = true;
          count++;
        }
      }
    }

    return { syndromes, count };
  }

  /**
   * فك ترميز مبسّط مستوحى من MWPM (Minimum Weight Perfect Matching)
   * يحاول مطابقة أزواج المتلازمات بأقصر مسافة
   */
  private decodeSyndromes(syndromes: boolean[][]): Array<[number, number]> {
    const corrections: Array<[number, number]> = [];
    const syndromePositions: Array<[number, number]> = [];

    // جمع مواقع المتلازمات
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        if (syndromes[i][j]) {
          syndromePositions.push([i, j]);
        }
      }
    }

    // مطابقة الأزواج الأقرب (Greedy MWPM)
    const matched = new Set<number>();
    for (let a = 0; a < syndromePositions.length; a++) {
      if (matched.has(a)) continue;

      let bestDist = Number.POSITIVE_INFINITY;
      let bestB = -1;

      for (let b = a + 1; b < syndromePositions.length; b++) {
        if (matched.has(b)) continue;

        const dist = this.toricDistance(syndromePositions[a], syndromePositions[b]);
        if (dist < bestDist) {
          bestDist = dist;
          bestB = b;
        }
      }

      if (bestB >= 0) {
        matched.add(a);
        matched.add(bestB);
        // تصحيح على طول المسار بين المتلازمتين
        corrections.push(syndromePositions[a]);
        corrections.push(syndromePositions[bestB]);
      }
    }

    return corrections;
  }

  /** حساب المسافة على السطح الطوبولوجي (Torus) */
  private toricDistance(a: [number, number], b: [number, number]): number {
    const dx = Math.min(Math.abs(a[0] - b[0]), this.latticeSize - Math.abs(a[0] - b[0]));
    const dy = Math.min(Math.abs(a[1] - b[1]), this.latticeSize - Math.abs(a[1] - b[1]));
    return dx + dy;
  }

  simulateErrorCorrectionCycle(): QECCycleResult {
    let errorsCorrected = false;
    const newGrid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    let errorCount = 0;
    let correctedCount = 0;
    let xErrors = 0;
    let zErrors = 0;
    let yErrors = 0;

    // ─── مرحلة 1: توليد الأخطاء (مع أنواع متعددة — مستوحى من panqec) ───
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        this.detailedGrid[i][j].syndrome = false;
        this.detailedGrid[i][j].corrected = false;

        if (Math.random() < this.physicalErrorRate) {
          // تحديد نوع الخطأ (X أكثر شيوعاً، Y أقل)
          const r = Math.random();
          if (r < 0.5) {
            this.detailedGrid[i][j].error = 'X';
            xErrors++;
          } else if (r < 0.85) {
            this.detailedGrid[i][j].error = 'Z';
            zErrors++;
          } else {
            this.detailedGrid[i][j].error = 'Y';
            yErrors++;
          }
          newGrid[i][j] = 1;
          errorCount++;
        } else {
          this.detailedGrid[i][j].error = this.grid[i][j] === 1 ? 'X' : 'none';
          newGrid[i][j] = this.grid[i][j] === 1 ? 1 : 0;
          if (newGrid[i][j] === 1) errorCount++;
        }
      }
    }

    // ─── مرحلة 2: كشف المتلازمات ───
    const { syndromes, count: syndromeCount } = this.detectSyndromes();

    // ─── مرحلة 3: فك الترميز والتصحيح ───
    const corrections = this.decodeSyndromes(syndromes);
    for (const [ci, cj] of corrections) {
      if (newGrid[ci][cj] === 1 && Math.random() > 0.15) {
        newGrid[ci][cj] = 2; // 2 = مصحح
        this.detailedGrid[ci][cj].corrected = true;
        this.detailedGrid[ci][cj].error = 'none';
        errorsCorrected = true;
        correctedCount++;
        errorCount--;
      }
    }

    // أيضاً تصحيح الأخطاء التي لم تُكتشف بالمتلازمات
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        if (newGrid[i][j] === 1 && !this.detailedGrid[i][j].corrected && Math.random() > 0.3) {
          newGrid[i][j] = 2;
          this.detailedGrid[i][j].corrected = true;
          this.detailedGrid[i][j].error = 'none';
          errorsCorrected = true;
          correctedCount++;
          errorCount--;
        }
      }
    }

    this.grid = newGrid;

    // ─── تحديث الإحصائيات ───
    this.stats.totalCycles++;
    this.stats.totalErrorsDetected += syndromeCount;
    this.stats.totalErrorsCorrected += correctedCount;
    this.stats.correctionRate =
      this.stats.totalErrorsDetected > 0 ? this.stats.totalErrorsCorrected / this.stats.totalErrorsDetected : 1;

    const hasLogicalError = errorCount > this.latticeSize / 2;
    if (!hasLogicalError) {
      this.currentLogicalLifetime++;
      if (this.currentLogicalLifetime > this.stats.longestLogicalLifetime) {
        this.stats.longestLogicalLifetime = this.currentLogicalLifetime;
      }
    } else {
      this.currentLogicalLifetime = 0;
    }

    const logicalErrorRate = hasLogicalError ? 1 : 0;

    return {
      errorsCorrected,
      grid: this.grid,
      errorCount,
      correctedCount,
      syndromeCount,
      xErrors,
      zErrors,
      yErrors,
      logicalErrorRate,
    };
  }

  /**
   * الحصول على إحصائيات التشغيل التراكمية
   */
  getStats(): QECStats {
    return { ...this.stats };
  }

  /**
   * حساب العتبة النظرية لمعدل الخطأ الفيزيائي
   * (مستوحى من panqec — threshold estimation)
   *
   * لشبكة Toric Code: العتبة ≈ 10.3% لأخطاء depolarizing
   */
  getThreshold(): number {
    return 0.103; // p_th ≈ 10.3% لشبكة Toric Code
  }

  /**
   * هل معدل الخطأ تحت العتبة؟
   */
  isBelowThreshold(): boolean {
    return this.physicalErrorRate < this.getThreshold();
  }
}

// ═══════════════════════════════════════════════════════════════
// Surface Code Simulator — كود السطح
// ═══════════════════════════════════════════════════════════════

/**
 * محاكي كود السطح (Surface Code)
 * يمتد من ToricCodeSimulator مع دائرة تصحيح مخصصة
 *
 * الفرق عن Toric Code: الحدود المفتوحة (Open Boundary) بدلاً من اللف الطوبولوجي
 * مستوحى من: Google Quantum AI — Surface Code experiments
 */
export class SurfaceCodeSimulator extends ToricCodeSimulator {
  /**
   * دورة تصحيح مخصصة لكود السطح
   * تعتمد على الحدود المفتوحة بدلاً من اللف الطوبولوجي
   */
  simulateErrorCorrectionCycle(): QECCycleResult {
    let errorsCorrected = false;
    const newGrid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    let errorCount = 0;
    let correctedCount = 0;
    let xErrors = 0;
    let zErrors = 0;
    let yErrors = 0;

    // توليد الأخطاء مع معدل أخطاء منخفض قليلاً (السطح أفضل في الحدود)
    const adjustedRate = this.physicalErrorRate * 0.9;

    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        this.detailedGrid[i][j].syndrome = false;
        this.detailedGrid[i][j].corrected = false;

        if (Math.random() < adjustedRate) {
          const r = Math.random();
          if (r < 0.5) {
            this.detailedGrid[i][j].error = 'X';
            xErrors++;
          } else if (r < 0.85) {
            this.detailedGrid[i][j].error = 'Z';
            zErrors++;
          } else {
            this.detailedGrid[i][j].error = 'Y';
            yErrors++;
          }
          newGrid[i][j] = 1;
          errorCount++;
        } else {
          this.detailedGrid[i][j].error = this.grid[i][j] === 1 ? 'X' : 'none';
          newGrid[i][j] = this.grid[i][j] === 1 ? 1 : 0;
          if (newGrid[i][j] === 1) errorCount++;
        }
      }
    }

    // كشف المتلازمات مع حدود مفتوحة
    const syndromes: boolean[][] = Array(this.latticeSize)
      .fill(null)
      .map(() => Array(this.latticeSize).fill(false));
    let syndromeCount = 0;

    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        // فحص الجيران مع حدود مفتوحة (لا لف طوبولوجي)
        const neighbors = [
          this.detailedGrid[i][j],
          i + 1 < this.latticeSize ? this.detailedGrid[i + 1][j] : null,
          j + 1 < this.latticeSize ? this.detailedGrid[i][j + 1] : null,
          i > 0 ? this.detailedGrid[i - 1][j] : null,
        ].filter(Boolean) as LatticeCell[];

        const errCount = neighbors.filter((n) => n.error !== 'none').length;
        if (errCount % 2 !== 0) {
          syndromes[i][j] = true;
          this.detailedGrid[i][j].syndrome = true;
          syndromeCount++;
        }
      }
    }

    // تصحيح الأخطاء — Surface Code أكثر كفاءة في تصحيح X errors
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        if (newGrid[i][j] === 1 && Math.random() > 0.2) {
          newGrid[i][j] = 2;
          this.detailedGrid[i][j].corrected = true;
          this.detailedGrid[i][j].error = 'none';
          errorsCorrected = true;
          correctedCount++;
          errorCount--;
        }
      }
    }

    this.grid = newGrid;
    const hasLogicalError = errorCount > this.latticeSize / 2;
    const logicalErrorRate = hasLogicalError ? 1 : 0;

    return {
      errorsCorrected,
      grid: this.grid,
      errorCount: Math.max(0, errorCount),
      correctedCount,
      syndromeCount,
      xErrors,
      zErrors,
      yErrors,
      logicalErrorRate,
    };
  }

  getThreshold(): number {
    return 0.01; // عتبة كود السطح ≈ 1% لأخطاء depolarizing
  }
}

// ═══════════════════════════════════════════════════════════════
// Color Code Simulator — كود الألوان
// ═══════════════════════════════════════════════════════════════

/**
 * محاكي كود الألوان (Color Code)
 * يعتمد على شبكة مثلثية مبسّطة ثلاثية الألوان
 *
 * كود الألوان يصحح X و Z معاً بكفاءة عالية
 * مستوحى من: Bombin & Martin-Delgado — Topological Quantum Distillation
 */
export class ColorCodeSimulator extends ToricCodeSimulator {
  /**
   * دورة تصحيح مخصصة لكود الألوان
   * الشبكة المثلثية تمنح تصحيحاً أفضل للأخطاء المتعددة
   */
  simulateErrorCorrectionCycle(): QECCycleResult {
    let errorsCorrected = false;
    const newGrid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    let errorCount = 0;
    let correctedCount = 0;
    let xErrors = 0;
    let zErrors = 0;
    let yErrors = 0;

    // كود الألوان يتعامل مع 6 جيران (شبكة مثلثية)
    // معدل التصحيح أعلى لكن المعالجة أبطأ
    const colorCodeRate = this.physicalErrorRate * 0.85;

    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        this.detailedGrid[i][j].syndrome = false;
        this.detailedGrid[i][j].corrected = false;

        if (Math.random() < colorCodeRate) {
          const r = Math.random();
          if (r < 0.45) {
            this.detailedGrid[i][j].error = 'X';
            xErrors++;
          } else if (r < 0.8) {
            this.detailedGrid[i][j].error = 'Z';
            zErrors++;
          } else {
            this.detailedGrid[i][j].error = 'Y';
            yErrors++;
          }
          newGrid[i][j] = 1;
          errorCount++;
        } else {
          this.detailedGrid[i][j].error = this.grid[i][j] === 1 ? 'X' : 'none';
          newGrid[i][j] = this.grid[i][j] === 1 ? 1 : 0;
          if (newGrid[i][j] === 1) errorCount++;
        }
      }
    }

    // كشف المتلازمات — 6 جيران في الشبكة المثلثية
    let syndromeCount = 0;
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        // الجيران الستة في الشبكة المثلثية المبسّطة
        const neighborCoords = [
          [i, j],
          [(i + 1) % this.latticeSize, j],
          [i, (j + 1) % this.latticeSize],
          [(i - 1 + this.latticeSize) % this.latticeSize, j],
          [i, (j - 1 + this.latticeSize) % this.latticeSize],
          [(i + 1) % this.latticeSize, (j + 1) % this.latticeSize],
        ];

        const errCount = neighborCoords.filter(([ni, nj]) => this.detailedGrid[ni][nj].error !== 'none').length;

        if (errCount % 2 !== 0) {
          this.detailedGrid[i][j].syndrome = true;
          syndromeCount++;
        }
      }
    }

    // تصحيح أقوى في كود الألوان (يصحح X و Z معاً)
    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        if (newGrid[i][j] === 1 && Math.random() > 0.12) {
          newGrid[i][j] = 2;
          this.detailedGrid[i][j].corrected = true;
          this.detailedGrid[i][j].error = 'none';
          errorsCorrected = true;
          correctedCount++;
          errorCount--;
        }
      }
    }

    this.grid = newGrid;
    const hasLogicalError = errorCount > this.latticeSize / 2;

    return {
      errorsCorrected,
      grid: this.grid,
      errorCount: Math.max(0, errorCount),
      correctedCount,
      syndromeCount,
      xErrors,
      zErrors,
      yErrors,
      logicalErrorRate: hasLogicalError ? 1 : 0,
    };
  }

  getThreshold(): number {
    return 0.109; // عتبة كود الألوان ≈ 10.9% — أعلى من Toric Code
  }
}

// ═══════════════════════════════════════════════════════════════
// مصنع محاكيات QEC
// ═══════════════════════════════════════════════════════════════

/**
 * دالة تصنيع — تُنشئ محاكي QEC حسب النوع المطلوب
 * @param type - نوع الكود ('toric' | 'surface' | 'color')
 * @param config - إعدادات المحاكي
 * @returns محاكي QEC مناسب
 */
export function createQECSimulator(
  type: CodeType,
  config: { latticeSize: number; physicalErrorRate: number },
): ToricCodeSimulator {
  switch (type) {
    case 'surface':
      return new SurfaceCodeSimulator(config);
    case 'color':
      return new ColorCodeSimulator(config);
    default:
      return new ToricCodeSimulator(config);
  }
}
