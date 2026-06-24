export interface FrameChunk {
  workerIndex: number;
  sourceStartFrame: number;
  outputStartIndex: number;
  frameCount: number;
}

export interface FrameAssignment {
  sourceFrame: number;
  outputIndex: number;
}

export interface WorkerFrameAssignment {
  workerIndex: number;
  frames: FrameAssignment[];
}

export interface FrameReorderBuffer {
  waitForTurn(outputIndex: number): Promise<void>;
  advanceTo(nextOutputIndex: number): void;
  abort(reason?: Error): void;
  current(): number;
}

export function frameFileName(outputIndex: number, ext: string): string {
  return `frame-${String(outputIndex).padStart(6, '0')}.${ext}`;
}

export function planFrameChunks(
  totalFrames: number,
  sourceStartFrame: number,
  workers: number
): FrameChunk[] {
  const safeTotal = Math.max(0, Math.floor(totalFrames));
  const safeWorkers = Math.max(1, Math.floor(workers));
  const workerCount = Math.min(safeWorkers, safeTotal || 1);
  const base = Math.floor(safeTotal / workerCount);
  const remainder = safeTotal % workerCount;
  const chunks: FrameChunk[] = [];
  let outputStartIndex = 0;

  for (let workerIndex = 0; workerIndex < workerCount; workerIndex++) {
    const frameCount = base + (workerIndex < remainder ? 1 : 0);
    if (frameCount <= 0) continue;
    chunks.push({
      workerIndex,
      sourceStartFrame: sourceStartFrame + outputStartIndex,
      outputStartIndex,
      frameCount,
    });
    outputStartIndex += frameCount;
  }

  return chunks;
}

export function planInterleavedFrameAssignments(
  totalFrames: number,
  sourceStartFrame: number,
  workers: number
): WorkerFrameAssignment[] {
  const safeTotal = Math.max(0, Math.floor(totalFrames));
  const safeWorkers = Math.max(1, Math.floor(workers));
  const workerCount = Math.min(safeWorkers, safeTotal || 1);
  const assignments: WorkerFrameAssignment[] = Array.from({ length: workerCount }, (_, workerIndex) => ({
    workerIndex,
    frames: [],
  }));

  for (let outputIndex = 0; outputIndex < safeTotal; outputIndex++) {
    const workerIndex = outputIndex % workerCount;
    assignments[workerIndex]!.frames.push({
      sourceFrame: sourceStartFrame + outputIndex,
      outputIndex,
    });
  }

  return assignments.filter((assignment) => assignment.frames.length > 0);
}

export function createFrameReorderBuffer(
  startOutputIndex: number,
  endOutputIndexExclusive: number
): FrameReorderBuffer {
  let cursor = startOutputIndex;
  let abortedReason: Error | null = null;
  const pending = new Map<
    number,
    Array<{ resolve: () => void; reject: (reason: Error) => void }>
  >();

  const flush = (outputIndex: number) => {
    const waiters = pending.get(outputIndex);
    if (!waiters) return;
    pending.delete(outputIndex);
    for (const waiter of waiters) waiter.resolve();
  };

  return {
    waitForTurn(outputIndex: number): Promise<void> {
      if (abortedReason) return Promise.reject(abortedReason);
      if (outputIndex < startOutputIndex || outputIndex >= endOutputIndexExclusive) {
        return Promise.reject(new Error(`Frame output index ${outputIndex} is outside streaming range`));
      }
      if (outputIndex === cursor) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const waiters = pending.get(outputIndex);
        const waiter = { resolve, reject };
        if (waiters) waiters.push(waiter);
        else pending.set(outputIndex, [waiter]);
      });
    },
    advanceTo(nextOutputIndex: number): void {
      if (nextOutputIndex <= cursor) return;
      cursor = nextOutputIndex;
      flush(cursor);
    },
    abort(reason?: Error): void {
      if (abortedReason) return;
      abortedReason = reason ?? new Error('Frame streaming aborted');
      for (const waiters of pending.values()) {
        for (const waiter of waiters) waiter.reject(abortedReason);
      }
      pending.clear();
    },
    current(): number {
      return cursor;
    },
  };
}
