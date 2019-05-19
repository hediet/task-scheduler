import { EventEmitter, EventSource } from "@hediet/std/events";
import { TaskDefinition } from "./TaskDefinition";
import { Disposable } from "@hediet/std/disposable";
import { wait } from "@hediet/std/timer";
import { TaskSchedule, ScheduledTask } from "./TaskSchedule";
import { ZonedDateTime, ZoneId } from "js-joda";
import { Disposer } from "../utils";

export abstract class ActiveTasksProvider {
    abstract get onTaskTriggered(): EventSource<
        TaskWithReason,
        ActiveTasksProvider
    >;
    abstract getActiveTasks(): Promise<TaskWithReason[]>;
}

export type ReasonId = string & { __brand: "reasonId" } | null;

export interface TaskWithReason {
    task: TaskDefinition;
    /**
     * A unique id to correlate active tasks with triggers.
     */
    reasonId: ReasonId;
}

export class ScheduledTasksProvider extends ActiveTasksProvider
    implements Disposable {
    private readonly taskTriggeredEvent = new EventEmitter<
        TaskWithReason,
        ActiveTasksProvider
    >();
    public readonly onTaskTriggered = this.taskTriggeredEvent.asEvent();
    private readonly disposer = new Disposer();
    public readonly dispose = this.disposer.dispose;

    private lastUpdate = ZonedDateTime.now();

    constructor(private readonly taskSchedule: TaskSchedule) {
        super();
        this.run();
    }

    private scheduledTaskToTaskWithReason(st: ScheduledTask): TaskWithReason {
        const reasonId = st.date
            .withZoneSameInstant(ZoneId.UTC)
            .toString() as ReasonId;
        return {
            task: st.task,
            reasonId
        };
    }

    public async getActiveTasks(): Promise<TaskWithReason[]> {
        const activeTasks = await this.taskSchedule.getActiveTasks(
            this.lastUpdate
        );

        return activeTasks.map(st => this.scheduledTaskToTaskWithReason(st));
    }

    private async run(): Promise<void> {
        while (!this.disposer.isDisposed) {
            await Promise.all([this.update(), wait(100)]);
        }
    }

    private async update(): Promise<void> {
        const time = ZonedDateTime.now();
        const newTasks = await this.taskSchedule.getTasksTriggeredBetween(
            this.lastUpdate,
            time
        );

        for (const task of newTasks) {
            this.taskTriggeredEvent.emit(
                this.scheduledTaskToTaskWithReason(task),
                this
            );
        }

        this.lastUpdate = time;
    }
}
