import { TaskDefinition } from "./TaskDefinition";
import { TaskSource } from "./TaskSource";
import { ZonedDateTime } from "js-joda";

export abstract class TaskSchedule {
    abstract getTasksTriggeredBetween(
        startExclusive: ZonedDateTime,
        endInclusive: ZonedDateTime
    ): Promise<ScheduledTask[]>;
    abstract getActiveTasks(time: ZonedDateTime): Promise<ScheduledTask[]>;
}

export interface ScheduledTask {
    task: TaskDefinition;
    date: ZonedDateTime;
}

export class TaskScheduleFromTaskSource extends TaskSchedule {
    constructor(private readonly taskSource: TaskSource) {
        super();
    }

    public async getTasksTriggeredBetween(
        startExclusive: ZonedDateTime,
        endInclusive: ZonedDateTime
    ): Promise<ScheduledTask[]> {
        const result = new Array<ScheduledTask>();
        const tasks = await this.taskSource.getTasks();
        for (const task of tasks) {
            const tr = task.trigger.find(tr =>
                tr.time.isIn(startExclusive, endInclusive)
            );

            if (tr) {
                const date = tr.time.getNextTime(startExclusive);
                if (!date) {
                    throw new Error("Cannot happen");
                }
                result.push({ date, task });
            }
        }
        return result;
    }

    public async getActiveTasks(time: ZonedDateTime): Promise<ScheduledTask[]> {
        const result = new Set<ScheduledTask>();
        const tasks = await this.taskSource.getTasks();
        for (const task of tasks) {
            for (const trigger of task.trigger) {
                const date = trigger.time.getPreviousTime(time);
                if (!date) {
                    continue;
                }
                const endTime = trigger.runtime
                    .getTimeSequence(date)
                    .getNextTime(date);

                if (!endTime || time < endTime) {
                    result.add({ date, task });
                }
            }
        }
        return [...result];
    }
}
