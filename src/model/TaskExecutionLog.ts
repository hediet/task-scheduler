import { TaskDefinition, TaskId } from "./TaskDefinition";
import { ReasonId } from "./ActiveTasksProvider";

export type StartReason = "trigger" | "keepAlive";
export type EndReason = "voluntarily" | "killInactive" | "systemCrashed";

export type ExecutionId = number & { _brand: "executionId" };

export abstract class TaskExecutionLog {
    abstract logTaskStarted(
        task: TaskDefinition,
        reasonId: ReasonId,
        startReason: StartReason
    ): Promise<{ executionId: ExecutionId }>;
    abstract hasTaskWithReasonBeenStarted(
        taskId: TaskId,
        reasonId: ReasonId
    ): Promise<boolean>;
    abstract logTaskEnded(
        executionId: number,
        endReason: EndReason
    ): Promise<void>;
}
