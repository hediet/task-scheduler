import {
    ChildProcess,
    spawn,
    ChildProcessWithoutNullStreams
} from "child_process";
import { TaskDefinition, TaskId } from "./TaskDefinition";
import { ZonedDateTime } from "js-joda";
import { Barrier } from "@hediet/std/synchronization";
import { ExecutionId } from "./TaskExecutionLog";
import { EventSource, EventEmitter } from "@hediet/std/events";
import { TaskOutputLogger } from "./TaskOutputLogger";

export abstract class TaskExecutioner {
    public abstract getTasksWithInstances(): TaskId[];
    public abstract getInstances(taskId: TaskId): ReadonlySet<RunningTask>;
    public abstract exitAllInstances(taskId: TaskId): Promise<void>;
    public abstract start(
        task: TaskDefinition,
        executionId: ExecutionId
    ): Promise<void>;

    public abstract get onTaskEnded(): EventSource<
        RunningTask,
        TaskExecutioner
    >;
}

export type RunningTaskExitReason = undefined | "killed" | "voluntarily";

export interface RunningTask {
    process: ChildProcessWithoutNullStreams;
    task: TaskDefinition;
    started: ZonedDateTime;
    executionId: ExecutionId;
    exitReason: RunningTaskExitReason;
}

export class LocalTaskExecutioner extends TaskExecutioner {
    public readonly taskEndedEmitter = new EventEmitter<
        RunningTask,
        TaskExecutioner
    >();
    public onTaskEnded = this.taskEndedEmitter.asEvent();
    private readonly runningTasks = new Map<TaskId, Set<RunningTaskImpl>>();

    constructor(private readonly taskOutputLogger: TaskOutputLogger) {
        super();
    }

    private _getInstances(taskId: TaskId): Set<RunningTaskImpl> {
        let set = this.runningTasks.get(taskId);
        if (!set) {
            set = new Set<RunningTaskImpl>();
            this.runningTasks.set(taskId, set);
        }
        return set;
    }

    public getTasksWithInstances(): TaskId[] {
        return [...this.runningTasks.keys()];
    }

    public getInstances(taskId: TaskId): ReadonlySet<RunningTask> {
        return this._getInstances(taskId);
    }

    public async exitAllInstances(taskId: TaskId): Promise<void> {
        const instances = this._getInstances(taskId);
        await Promise.all([...instances].map(t => t.exit()));
    }

    public async start(
        task: TaskDefinition,
        executionId: ExecutionId
    ): Promise<void> {
        const proc = spawn(task.action.program, task.action.args, {
            stdio: "pipe"
        });
        const t = new RunningTaskImpl(
            proc,
            task,
            ZonedDateTime.now(),
            executionId
        );
        this.taskOutputLogger.setupLogging(t);
        const set = this._getInstances(task.id);
        set.add(t);
        t.onExited.then(() => {
            set.delete(t);
            this.taskEndedEmitter.emit(t, this);
        });
    }
}

export class RunningTaskImpl implements RunningTask {
    private readonly exitedBarrier = new Barrier();
    public readonly onExited = this.exitedBarrier.onUnlocked;

    public exitReason: RunningTaskExitReason;

    constructor(
        public readonly process: ChildProcessWithoutNullStreams,
        public readonly task: TaskDefinition,
        public readonly started: ZonedDateTime,
        public readonly executionId: ExecutionId
    ) {
        process.on("exit", () => {
            if (!this.exitReason) {
                this.exitReason = "voluntarily";
            }
            this.exitedBarrier.unlock();
        });
    }

    public exit(): Promise<void> {
        this.exitReason = "killed";
        this.process.kill();
        return this.onExited;
    }
}
