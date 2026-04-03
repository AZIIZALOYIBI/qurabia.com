/**
 * ============================================================
 * QuantumResonancePathfinder.ts - خوارزمية توجيه المسار بالرنين الكمي (QRP)
 * QURABIA
 * 
 * المفهوم المبتكر:
 * بدلاً من استخدام الحواف والأوزان التقليدية (Dijkstra)، تعامل هذه الخوارزمية
 * شبكة البحث كـ "حقل كمي". كل خلية تمتلك دالة موجية (ψ) تتأثر بالعوائق
 * التي تخلق تداخلات سلبية. المسار الأمثل هو "مسار الرنين" الذي يتبع
 * تدرج الطور (Phase Gradient) المحسوب بواسطة معادلة العتيبي الموحدة.
 * ============================================================
 */

import { ALOTAIBI_CONSTANTS } from '../types/quantum.types';

export interface GridNode {
  x: number;
  y: number;
  isObstacle: boolean;
  resonance: number; // ψ - القيمة الاحتمالية للرنين
  phase: number;     // θ - الطور الكمي
}

export class QuantumResonancePathfinder {
  private grid: GridNode[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => ({
        x, y, isObstacle: false, resonance: 0, phase: 0
      }))
    );
  }

  /**
   * إعداد الحقل الكمي بناءً على العوائق
   * يتم حساب الرنين لكل خلية باستخدام تداخل الموجات من المصدر (Start)
   */
  public initializeQuantumField(start: {x: number, y: number}, obstacles: {x: number, y: number}[]): void {
    // وضع العوائق
    obstacles.forEach(o => {
      if (this.grid[o.y] && this.grid[o.y][o.x]) {
        this.grid[o.y][o.x].isObstacle = true;
      }
    });

    const { ALPHA, BETA } = ALOTAIBI_CONSTANTS;

    // حساب حقل الرنين (Resonance Field)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].isObstacle) {
          this.grid[y][x].resonance = -1; // تداخل هدام كامل
          continue;
        }

        const dist = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
        
        // معادلة العتيبي المصغرة للرنين المكاني:
        // ψ = cos(dist * β) / (1 + dist / α)
        // حيث α يعمل كمخمد للمسافة و β يحدد تردد التذبذب
        const psi = Math.cos(dist * BETA) / (1 + dist / ALPHA);
        this.grid[y][x].resonance = psi;
        this.grid[y][x].phase = dist % (2 * Math.PI);
      }
    }
  }

  /**
   * البحث عن المسار باستخدام "تدرج الطور الكمي"
   * يختار الجار الذي يمتلك أعلى رنين وأقل فرق طور مع الهدف
   */
  public findPath(start: {x: number, y: number}, target: {x: number, y: number}): {x: number, y: number}[] {
    const path: {x: number, y: number}[] = [start];
    let current = start;
    const visited = new Set<string>();

    // حد أقصى للحماية من الحلقات اللانهائية
    let steps = 0;
    const maxSteps = this.width * this.height;

    while ((current.x !== target.x || current.y !== target.y) && steps < maxSteps) {
      visited.add(`${current.x},${current.y}`);
      const neighbors = this.getNeighbors(current);
      
      if (neighbors.length === 0) break;

      // اختيار الجار "الأكثر رنيناً" تجاه الهدف
      neighbors.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - target.x, 2) + Math.pow(a.y - target.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - target.x, 2) + Math.pow(b.y - target.y, 2));
        
        // معيار التقييم المبتكر: دمج الرنين الموضعي مع المسافة الباقية
        // Score = (ψ * α) - dist
        const scoreA = (this.grid[a.y][a.x].resonance * ALOTAIBI_CONSTANTS.ALPHA) - distA;
        const scoreB = (this.grid[b.y][b.x].resonance * ALOTAIBI_CONSTANTS.ALPHA) - distB;
        
        return scoreB - scoreA;
      });

      // تجنب العودة للخلايا التي تمت زيارتها إلا في حالة الضرورة القصوى (Tunneling)
      let next = neighbors.find(n => !visited.has(`${n.x},${n.y}`));
      
      // منطق "النفق الكمي" (Quantum Tunneling): 
      // إذا كان العائق رقيقاً جداً ورنين الخلية خلفه عالٍ جداً، يمكن تجاوزه
      if (!next && neighbors[0].isObstacle && this.grid[neighbors[0].y][neighbors[0].x].resonance > 0.8) {
        next = neighbors[0];
      }

      if (!next) break;
      
      current = next;
      path.push(current);
      steps++;
    }

    return path;
  }

  private getNeighbors(p: {x: number, y: number}): GridNode[] {
    const dirs = [
      {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0},
      {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}
    ];
    
    return dirs
      .map(d => ({ x: p.x + d.x, y: p.y + d.y }))
      .filter(n => n.x >= 0 && n.x < this.width && n.y >= 0 && n.y < this.height)
      .map(n => this.grid[n.y][n.x]);
  }
}
