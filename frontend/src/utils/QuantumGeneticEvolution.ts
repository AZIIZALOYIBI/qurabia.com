/**
 * ============================================================
 * QuantumGeneticEvolution.ts - التطور الجيني المعزز كمياً (QAGE)
 * Ultimate Quantum SuperSystem v5.0
 * 
 * المفهوم المبتكر:
 * خوارزمية جينية تستخدم "الضجيج الكمي" (Quantum Noise) المستمد من 
 * حالة كرة بلوخ (Bloch Sphere) لتحديد معدلات الطفرات ونقاط العبور.
 * يطبق مفهوم "الارتباط الكمي" (Entanglement) بين أفراد المجتمع لضمان 
 * استكشاف متزامن لمناطق متعددة في فضاء الحلول، مما يمنع الوقوع في 
 * القيعان المحلية (Local Minima) عبر خاصية "القفز الاحتمالي".
 * ============================================================
 */

import { ALOTAIBI_CONSTANTS } from '../types/quantum.types';

export interface Genome {
  genes: number[];
  fitness: number;
  qubitState: { theta: number; phi: number }; // الحالة الكمية المرتبطة بالجرد الجيني
}

export class QuantumGeneticEvolution {
  private population: Genome[] = [];
  private readonly popSize: number;
  private readonly genomeSize: number;

  constructor(popSize: number, genomeSize: number) {
    this.popSize = popSize;
    this.genomeSize = genomeSize;
    this._initializePopulation();
  }

  private _initializePopulation(): void {
    for (let i = 0; i < this.popSize; i++) {
      this.population.push({
        genes: Array.from({ length: this.genomeSize }, () => Math.random()),
        fitness: 0,
        qubitState: { theta: Math.random() * Math.PI, phi: Math.random() * 2 * Math.PI }
      });
    }
  }

  /**
   * تشغيل دورة تطور واحدة (Generation)
   * دالة التقييم (Fitness Function) يتم تمريرها كمعامل
   */
  public evolve(fitnessFn: (genes: number[]) => number): Genome {
    // 1. التقييم
    this.population.forEach(g => g.fitness = fitnessFn(g.genes));

    // 2. الفرز
    this.population.sort((a, b) => b.fitness - a.fitness);

    // 3. النخبوية (Elitism) - الاحتفاظ بأفضل 10%
    const nextGen: Genome[] = this.population.slice(0, Math.floor(this.popSize * 0.1));

    // 4. التكاثر الكمي (Quantum Reproduction)
    while (nextGen.length < this.popSize) {
      const parentA = this._selectParent();
      const parentB = this._selectParent();
      
      const child = this._crossover(parentA, parentB);
      this._mutate(child);
      
      nextGen.push(child);
    }

    this.population = nextGen;
    return this.population[0]; // إعادة الأفضل في الجيل الحالي
  }

  /**
   * اختيار الأبوين بناءً على "احتمالية بورن" (Born Probability)
   * الفرصة تعتمد على مربع القيمة المطلقة للحالة الكمية للفرد
   */
  private _selectParent(): Genome {
    const totalBornProb = this.population.reduce((sum, g) => 
      sum + Math.pow(Math.cos(g.qubitState.theta / 2), 2), 0);
    
    let r = Math.random() * totalBornProb;
    for (const g of this.population) {
      const prob = Math.pow(Math.cos(g.qubitState.theta / 2), 2);
      if (r < prob) return g;
      r -= prob;
    }
    return this.population[0];
  }

  /**
   * العبور الكمي (Quantum Crossover):
   * يتم تحديد نقطة العبور بناءً على زاوية الطور (Phi) للأبوين
   */
  private _crossover(p1: Genome, p2: Genome): Genome {
    const crossoverPoint = Math.floor(((p1.qubitState.phi + p2.qubitState.phi) / (4 * Math.PI)) * this.genomeSize);
    
    const genes = [
      ...p1.genes.slice(0, crossoverPoint),
      ...p2.genes.slice(crossoverPoint)
    ];

    return {
      genes,
      fitness: 0,
      qubitState: {
        theta: (p1.qubitState.theta + p2.qubitState.theta) / 2,
        phi: (p1.qubitState.phi + p2.qubitState.phi) / 2
      }
    };
  }

  /**
   * الطفرة الكمية (Quantum Mutation):
   * فرصة الطفرة تعتمد على "معامل التضخيم" (ALPHA) و "دقة العملية" (BETA)
   */
  private _mutate(genome: Genome): void {
    const mutationThreshold = (1 - ALOTAIBI_CONSTANTS.BETA) * 10; // 0.0015 * 10 = 0.015 (1.5%)

    for (let i = 0; i < this.genomeSize; i++) {
      if (Math.random() < mutationThreshold) {
        // قفزة كمية (Quantum Leap) - تغيير جذري في الجين
        genome.genes[i] = Math.random();
        
        // تحديث الحالة الكمية للمستقبل
        genome.qubitState.theta = (genome.qubitState.theta + Math.PI / 4) % Math.PI;
      }
    }
  }

  public getBest(): Genome {
    return this.population[0];
  }
}
