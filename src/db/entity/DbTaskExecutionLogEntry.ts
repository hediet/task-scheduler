import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { TaskId } from "../../model/TaskDefinition";
import { ReasonId } from "../../model/ActiveTasksProvider";
import {
    StartReason,
    EndReason,
    ExecutionId
} from "../../model/TaskExecutionLog";

@Entity("taskExecutionLogEntry")
export class DbTaskExecutionLogEntry {
    public static createNew(
        taskId: TaskId,
        reasonId: ReasonId,
        startReason: StartReason
    ): DbTaskExecutionLogEntry {
        const entry = new DbTaskExecutionLogEntry();
        entry.taskId = taskId;
        entry.reasonId = reasonId;
        entry.startDate = new Date();
        entry.startReason = startReason;

        return entry;
    }

    @PrimaryGeneratedColumn({ type: "integer" })
    executionId!: ExecutionId;

    @Column({})
    taskId!: TaskId;

    @Column({ type: "varchar", nullable: true })
    reasonId!: ReasonId;

    @Column({})
    startDate!: Date;

    @Column({ type: "varchar" })
    startReason!: StartReason;

    @Column({ nullable: true, type: "datetime" })
    endDate!: Date | null;

    @Column({ type: "varchar", nullable: true })
    endReason!: EndReason | null;
}
