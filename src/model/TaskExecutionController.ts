import { Disposable, dispose } from "@hediet/std/disposable";
import { ActiveTasksProvider, TaskWithReason } from "./ActiveTasksProvider";
import { startInterval } from "@hediet/std/timer";
import { TaskSource } from "./TaskSource";
import { TaskExecutionLog } from "./TaskExecutionLog";
import { LoggingTaskExecutioner } from "./LoggingTaskExecutioner";
import { Barrier } from "@hediet/std/synchronization";

export class TaskExecutionController implements Disposable {
    private readonly disposables = new Array<Disposable>();

    private barriers = new Set<Barrier>();

    constructor(
        private readonly taskSource: TaskSource,
        private readonly activeTasksProvider: ActiveTasksProvider,
        private readonly loggingTaskExecutioner: LoggingTaskExecutioner,
        private readonly taskExecutionLog: TaskExecutionLog
    ) {
        this.disposables.push(
            startInterval(100, async () => {
                const activeTasks = await this.activeTasksProvider.getActiveTasks();
                await Promise.all([...this.barriers].map(b => b.onUnlocked));
                await this.checkActiveTasks(activeTasks);
            }),
            activeTasksProvider.onTaskTriggered.sub(async task => {
                const barrier = new Barrier();
                this.barriers.add(barrier);
                try {
                    await this.handleTaskTriggered(task);
                } finally {
                    barrier.unlock();
                    this.barriers.delete(barrier);
                }
            })
        );
    }

    public dispose() {
        dispose(this.disposables);
    }

    private async handleTaskTriggered({
        task,
        reasonId
    }: TaskWithReason): Promise<void> {
        const instances = this.loggingTaskExecutioner.getInstances(task.id);

        if (instances.size > 0) {
            switch (task.options.ifStillRunning) {
                case "ignore":
                    break;

                case "restart":
                    await this.loggingTaskExecutioner.exitAllInstances(task.id);
                    // todo ensure that no other instances have been started here
                    await this.loggingTaskExecutioner.start(
                        task,
                        reasonId,
                        "trigger"
                    );
                    break;

                case "startAnother":
                    await this.loggingTaskExecutioner.start(
                        task,
                        reasonId,
                        "trigger"
                    );
                    break;
            }
        } else {
            await this.loggingTaskExecutioner.start(task, reasonId, "trigger");
        }
    }

    private async checkActiveTasks(
        activeTasks: TaskWithReason[]
    ): Promise<void> {
        await this.keepActiveTasksAlive(activeTasks);
        await this.killNonActiveTasks(activeTasks);
    }

    private async keepActiveTasksAlive(
        activeTasks: TaskWithReason[]
    ): Promise<void> {
        for (const { task, reasonId } of activeTasks) {
            const instances = this.loggingTaskExecutioner.getInstances(task.id);

            if (instances.size > 0) {
                // The (active) task has instances.
                continue;
            }

            if (!task.options.keepAliveDuringRuntime) {
                // Don't keep active tasks alive.
                // Only start them when they are triggered.
                continue;
            }

            if (task.options.startOnlyOnceDuringRuntime) {
                const hasBeenStarted = await this.taskExecutionLog.hasTaskWithReasonBeenStarted(
                    task.id,
                    reasonId
                );
                if (hasBeenStarted) {
                    // Don't start tasks which already have been started
                    // during their runtime.
                    continue;
                }
            }

            await this.loggingTaskExecutioner.start(
                task,
                reasonId,
                "keepAlive"
            );
        }
    }

    private async killNonActiveTasks(
        activeTasks: TaskWithReason[]
    ): Promise<void> {
        const runningTasks = this.loggingTaskExecutioner.getTasksWithInstances();
        const activeTasksSet = new Set(activeTasks.map(t => t.task.id));

        for (const taskId of runningTasks) {
            if (activeTasksSet.has(taskId)) {
                // The task is active
                continue;
            }

            const task = await this.taskSource.getTask(taskId);
            const taskHasBeenDeleted = !task;

            if (taskHasBeenDeleted || (task && task.options.killAfterRuntime)) {
                this.loggingTaskExecutioner.exitAllInstances(taskId);
            }
        }
    }
}
