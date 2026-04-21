/**
 * ============================================================
 * InnovationTester.ts - مختبر اختبار الخوارزميات المبتكرة
 * QURABIA
 *
 * يقوم باختبار دقة وأداء الخوارزميات الثلاث المبتكرة (QRP, EDC, QAGE)
 * ومقارنتها بالخوارزميات التقليدية المشابهة.
 * ============================================================
 */

import { EntropicCompression } from './EntropicCompression';
import { type Genome, QuantumGeneticEvolution } from './QuantumGeneticEvolution';
import { QuantumResonancePathfinder } from './QuantumResonancePathfinder';

// biome-ignore lint/complexity/noStaticOnlyClass: نمط Namespace — الكلاس يُستخدم كـ namespace لاختبارات الابتكار
export class InnovationTester {
  /**
   * اختبار خوارزمية التوجيه الكمي (QRP)
   */
  static testQRP() {
    console.log('--- Testing Quantum-Resonance Pathfinding (QRP) ---');
    const qrp = new QuantumResonancePathfinder(10, 10);
    const start = { x: 0, y: 0 };
    const target = { x: 9, y: 9 };
    const obstacles = [
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 4 },
    ];

    qrp.initializeQuantumField(start, obstacles);
    const path = qrp.findPath(start, target);

    console.log(`Path Found! Steps: ${path.length}`);
    return path;
  }

  /**
   * اختبار خوارزمية الضغط بالإنتروبيا (EDC)
   */
  static testEDC(sampleData = 'AAAAAABBBBBBCCCCCCDDDDDD') {
    console.log('--- Testing Entropic Data Compression (EDC) ---');
    const edc = new EntropicCompression();

    const compressed = edc.compress(sampleData);
    const decompressed = edc.decompress(compressed);
    const ratio = EntropicCompression.comparePerformance(sampleData, compressed);

    const success = decompressed === sampleData;
    console.log(`Original Size: ${sampleData.length} bytes`);
    console.log(`Compressed Size (Base64): ${compressed.length} bytes`);
    console.log(`Compression Ratio: ${ratio}%`);
    console.log(`Lossless Round-trip: ${success ? 'YES' : 'NO'}`);

    return { ratio, success };
  }

  /**
   * اختبار التطور الجيني المعزز كمياً (QAGE)
   */
  static testQAGE(): Genome {
    console.log('--- Testing Quantum-Aided Genetic Evolution (QAGE) ---');
    // دالة تقييم: البحث عن القيم القصوى (Max Fitness)
    const fitnessFn = (genes: number[]) => genes.reduce((sum, g) => sum + g, 0) / genes.length;

    const qage = new QuantumGeneticEvolution(20, 10);
    let best: Genome = qage.evolve(fitnessFn);

    for (let i = 1; i < 50; i++) {
      best = qage.evolve(fitnessFn);
    }

    console.log(`Best Fitness after 50 generations: ${best.fitness.toFixed(4)}`);
    return best;
  }

  static runFullSuite() {
    return {
      qrp: InnovationTester.testQRP(),
      edc: InnovationTester.testEDC(),
      qage: InnovationTester.testQAGE(),
    };
  }
}
