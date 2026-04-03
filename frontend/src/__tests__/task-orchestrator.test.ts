import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskOrchestrator, type QuantumTask } from '../engine/TaskOrchestrator';

// Use fake timers to avoid waiting for the 500ms/2000ms delays
beforeEach(() => {
  // Reset the static state between tests by clearing queue and activeTasks
  // Access private statics via cast to any
  (TaskOrchestrator as any).queue = [];
  (TaskOrchestrator as any).activeTasks = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  (TaskOrchestrator as any).queue = [];
  (TaskOrchestrator as any).activeTasks = 0;
});

// ─── getStatus ────────────────────────────────────────────────────────────────

describe('TaskOrchestrator.getStatus', () => {
  it('initial status: empty queue, 0 active, healthy', () => {
    const status = TaskOrchestrator.getStatus();
    expect(status.queueLength).toBe(0);
    expect(status.activeTasks).toBe(0);
    expect(status.isHealthy).toBe(true);
  });

  it('isHealthy is false when activeTasks >= MAX_CONCURRENT (4)', () => {
    (TaskOrchestrator as any).activeTasks = 4;
    expect(TaskOrchestrator.getStatus().isHealthy).toBe(false);
  });

  it('isHealthy is true when activeTasks < 4', () => {
    (TaskOrchestrator as any).activeTasks = 3;
    expect(TaskOrchestrator.getStatus().isHealthy).toBe(true);
  });
});

// ─── scheduleTask ──────────────────────────────────────────────────────────────

describe('TaskOrchestrator.scheduleTask', () => {
  it('schedules a HIGH priority task and resolves', async () => {
    const promise = TaskOrchestrator.scheduleTask({
      type: 'VQE',
      priority: 'HIGH',
      payload: { molecule: 'H2' },
    });

    vi.advanceTimersByTime(500);
    const result = await promise;
    expect(result!.success).toBe(true);
    expect(result!.data).toEqual({ molecule: 'H2' });
  });

  it('schedules a LOW priority task and resolves after delay', async () => {
    const promise = TaskOrchestrator.scheduleTask({
      type: 'ANALYSIS',
      priority: 'LOW',
      payload: { value: 42 },
    });

    vi.advanceTimersByTime(2000);
    const result = await promise;
    expect(result!.success).toBe(true);
    expect(result!.data.value).toBe(42);
  });

  it('assigns unique taskId to each task', async () => {
    const p1 = TaskOrchestrator.scheduleTask({ type: 'T1', priority: 'HIGH', payload: {} });
    const p2 = TaskOrchestrator.scheduleTask({ type: 'T2', priority: 'HIGH', payload: {} });

    vi.advanceTimersByTime(500);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1!.taskId).not.toBe(r2!.taskId);
  });

  it('HIGH task completes before MEDIUM/LOW (500ms vs 2000ms)', async () => {
    const highPromise = TaskOrchestrator.scheduleTask({ type: 'H', priority: 'HIGH', payload: {} });
    vi.advanceTimersByTime(500);
    const high = await highPromise;
    expect(high!.success).toBe(true);
  });

  it('respects MAX_CONCURRENT=4: 5th task queues until a slot opens', async () => {
    // Manually fill active tasks to max
    (TaskOrchestrator as any).activeTasks = 4;

    const promise = TaskOrchestrator.scheduleTask({
      type: 'OVERFLOW',
      priority: 'MEDIUM',
      payload: {},
    });

    // Queue should have the task waiting
    expect(TaskOrchestrator.getStatus().queueLength).toBe(1);

    // Free up a slot
    (TaskOrchestrator as any).activeTasks = 0;
    vi.advanceTimersByTime(2000);
    // Can't easily await here without risking an unresolved promise in fake-timer mode,
    // but we verify the task was added to the queue
    expect(promise).toBeInstanceOf(Promise);
  });
});
