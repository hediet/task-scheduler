import { TaskExecutioner, RunningTask } from "./TaskExecutioner";
import { TaskExecutionLog, StartReason, EndReason } from "./TaskExecutionLog";
import { TaskId, TaskDefinition } from "./TaskDefinition";
import { ReasonId } from "./ActiveTasksProvider";
import { DisposableComponent } from "@hediet/std/disposable";

export class LoggingTaskExecutioner extends DisposableComponent {
    constructor(
        private readonly taskExecutioner: TaskExecutioner,
        private readonly taskExecutionLog: TaskExecutionLog
    ) {
        super();
        this.trackDisposable(
            taskExecutioner.onTaskEnded.sub(task => {
                const exitReason = task.exitReason;
                if (!exitReason) {
                    throw new Error("Exit reason must be set at this point");
                }
                const map: { [TKey in typeof exitReason]: EndReason } = {
                    killed: "killInactive",
                    voluntarily: "voluntarily"
                };

                this.taskExecutionLog.logTaskEnded(
                    task.executionId,
                    map[exitReason]
                );
            })
        );
    }

    public getTasksWithInstances(): TaskId[] {
        return this.taskExecutioner.getTasksWithInstances();
    }

    public getInstances(taskId: TaskId): ReadonlySet<RunningTask> {
        return this.taskExecutioner.getInstances(taskId);
    }

    public exitAllInstances(taskId: TaskId): Promise<void> {
        return this.taskExecutioner.exitAllInstances(taskId);
    }

    public async start(
        task: TaskDefinition,
        reasonId: ReasonId,
        startReason: StartReason
    ): Promise<void> {
        const { executionId } = await this.taskExecutionLog.logTaskStarted(
            task,
            reasonId,
            startReason
        );
        await this.taskExecutioner.start(task, executionId);
    }
}
