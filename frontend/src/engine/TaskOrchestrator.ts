/**
 * ============================================================
 * TaskOrchestrator.ts - مدير المهام المتزامنة
 * QURABIA
 *
 * يوزع العمليات الثقيلة على Web Workers حقيقية لضمان سلاسة الواجهة.
 * يستخدم Fallback آمن إلى setTimeout إذا كانت Workers غير مدعومة.
 * ============================================================
 */

export interface QuantumTask {
  id: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

// ── نتيجة موحدة للمهام ────────────────────────────────────
interface TaskResult {
  success: boolean;
  taskId: string;
  data: Record<string, unknown>;
}

// ── إدارة Web Worker المشترك ───────────────────────────────
let _sharedWorker: Worker | null = null;

/**
 * يُعيد Worker مشتركاً واحداً (Singleton) بدلاً من إنشاء Worker لكل مهمة.
 * إذا كانت Workers غير مدعومة، يُعيد null ويُفعَّل الـ Fallback.
 */
function getQuantumWorker(): Worker | null {
  if (_sharedWorker !== null) return _sharedWorker;

  // التحقق من دعم المتصفح لـ Web Workers
  if (typeof Worker === 'undefined') {
    console.warn('[TaskOrchestrator] Web Workers غير مدعومة — سيُستخدم Fallback (setTimeout).');
    return null;
  }

  try {
    // إنشاء Worker باستخدام import.meta.url لدعم Vite/bundlers
    _sharedWorker = new Worker(new URL('../workers/quantum-worker.ts', import.meta.url), { type: 'module' });

    // معالجة انهيار Worker الكامل (أحداث نادرة)
    _sharedWorker.onerror = (err) => {
      console.error('[TaskOrchestrator] Worker error:', err.message);
      _sharedWorker = null; // إعادة الضبط لإتاحة إنشاء Worker جديد لاحقاً
    };

    console.log('[TaskOrchestrator] ✅ Web Worker تم تفعيله بنجاح.');
    return _sharedWorker;
  } catch (err) {
    console.warn('[TaskOrchestrator] فشل إنشاء Web Worker — Fallback مُفعَّل:', err);
    return null;
  }
}

// ── خريطة resolvers لربط responses بـ Promises ─────────────
const _pendingResolvers = new Map<string, (result: TaskResult) => void>();

// ── WeakSet لتتبع Workers التي سُجّل عليها المستمع ─────────────
const _listenersAttached = new WeakSet<Worker>();

/**
 * يُسجّل مستمع الرسائل العالمي على Worker المشترك مرة واحدة.
 */
function setupWorkerListener(worker: Worker): void {
  // تجنب تسجيل مستمعين متعددين
  if (_listenersAttached.has(worker)) return;
  _listenersAttached.add(worker);

  worker.onmessage = (
    event: MessageEvent<{ id: string; success: boolean; data: Record<string, unknown>; error?: string }>,
  ) => {
    const { id, success, data, error } = event.data;
    const resolve = _pendingResolvers.get(id);

    if (resolve) {
      _pendingResolvers.delete(id);
      resolve({ success, taskId: id, data: data ?? {} });
    } else {
      console.warn(`[TaskOrchestrator] لا يوجد resolver للمهمة: ${id}`);
    }

    // معالج الخطأ للمهام الفاشلة
    if (!success && error) {
      console.error(`[TaskOrchestrator] فشلت المهمة ${id}:`, error);
    }
  };
}

// biome-ignore lint/complexity/noStaticOnlyClass: نمط Namespace — الكلاس يُستخدم كـ namespace للخدمة
export class TaskOrchestrator {
  private static queue: QuantumTask[] = [];
  private static activeTasks = 0;
  private static MAX_CONCURRENT = 4; // موازنة الحمل (Load Balancing)

  static async scheduleTask(task: Omit<QuantumTask, 'status' | 'id'>): Promise<TaskResult | undefined> {
    const taskId = Math.random().toString(36).substring(7);
    const newTask: QuantumTask = { ...task, id: taskId, status: 'PENDING' };

    TaskOrchestrator.queue.push(newTask);
    console.log(`[TaskOrchestrator] المهمة ${taskId} في الانتظار. حجم الطابور: ${TaskOrchestrator.queue.length}`);

    return TaskOrchestrator.processQueue();
  }

  private static async processQueue(): Promise<TaskResult | undefined> {
    if (TaskOrchestrator.activeTasks >= TaskOrchestrator.MAX_CONCURRENT || TaskOrchestrator.queue.length === 0) return;

    const task = TaskOrchestrator.queue.shift();
    if (!task) return;
    task.status = 'RUNNING';
    TaskOrchestrator.activeTasks++;

    console.log(`[TaskOrchestrator] تشغيل المهمة ${task.id} (${task.type})`);

    const worker = getQuantumWorker();

    if (worker !== null) {
      // ── المسار الأساسي: Web Worker حقيقي ─────────────────
      return new Promise<TaskResult>((resolve) => {
        setupWorkerListener(worker);

        // تسجيل resolver قبل إرسال الرسالة
        _pendingResolvers.set(task.id, (result) => {
          TaskOrchestrator.activeTasks--;
          task.status = result.success ? 'COMPLETED' : 'FAILED';
          console.log(`[TaskOrchestrator] المهمة ${task.id} ${result.success ? 'اكتملت ✅' : 'فشلت ❌'} (Worker)`);
          resolve(result);
          void TaskOrchestrator.processQueue();
        });

        // إرسال المهمة إلى Worker
        worker.postMessage({
          id: task.id,
          type: task.type,
          priority: task.priority,
          payload: task.payload,
        });
      });
    }
    // ── Fallback: setTimeout (للبيئات التي لا تدعم Workers) ─
    return new Promise<TaskResult>((resolve) => {
      const delay = task.priority === 'HIGH' ? 500 : 2000;
      setTimeout(() => {
        TaskOrchestrator.activeTasks--;
        task.status = 'COMPLETED';
        console.log(`[TaskOrchestrator] المهمة ${task.id} اكتملت ✅ (Fallback/setTimeout)`);
        resolve({ success: true, taskId: task.id, data: task.payload });
        void TaskOrchestrator.processQueue();
      }, delay);
    });
  }

  static getStatus() {
    return {
      queueLength: TaskOrchestrator.queue.length,
      activeTasks: TaskOrchestrator.activeTasks,
      isHealthy: TaskOrchestrator.activeTasks < TaskOrchestrator.MAX_CONCURRENT,
      workerAvailable: _sharedWorker !== null || typeof Worker !== 'undefined',
    };
  }

  /** يُغلق Worker المشترك — استدعِه عند تفريغ التطبيق. */
  static terminate(): void {
    if (_sharedWorker) {
      _sharedWorker.terminate();
      _sharedWorker = null;
      console.log('[TaskOrchestrator] Web Worker أُغلق.');
    }
    _pendingResolvers.clear();
  }
}
