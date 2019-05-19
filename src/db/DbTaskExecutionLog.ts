import { DbTaskExecutionLogEntry } from "./entity/DbTaskExecutionLogEntry";
import { Repository } from "typeorm";
import {
    TaskExecutionLog,
    StartReason,
    EndReason,
    ExecutionId
} from "../model/TaskExecutionLog";
import { DbConnection } from "./DbConnection";
import { TaskDefinition, TaskId } from "../model/TaskDefinition";
import { ReasonId } from "../model/ActiveTasksProvider";
import LRU from "lru-cache";

export class DbTaskExecutionLog extends TaskExecutionLog {
    constructor(private readonly db: DbConnection) {
        super();
    }

    private async getEntryRepo(): Promise<Repository<DbTaskExecutionLogEntry>> {
        const con = await this.db.getConnection();
        const repo = con.getRepository(DbTaskExecutionLogEntry);
        return repo;
    }

    async logTaskStarted(
        task: TaskDefinition,
        reasonId: ReasonId,
        startReason: StartReason
    ): Promise<{ executionId: ExecutionId }> {
        const entry = DbTaskExecutionLogEntry.createNew(
            task.id,
            reasonId,
            startReason
        );
        const repo = await this.getEntryRepo();
        await repo.insert(entry);
        return { executionId: entry.executionId };
    }

    private readonly hasBeenStartedCache = new LRU<string, boolean>();
    private getKey(taskId: TaskId, reasonId: ReasonId): string {
        return JSON.stringify({ taskId, reasonId });
    }

    async hasTaskWithReasonBeenStarted(
        taskId: TaskId,
        reasonId: ReasonId
    ): Promise<boolean> {
        const cached = this.hasBeenStartedCache.get(
            this.getKey(taskId, reasonId)
        );
        if (cached !== undefined) {
            return cached;
        }

        const repo = await this.getEntryRepo();
        const result = await repo.findOne({ taskId, reasonId });
        if (result) {
            this.hasBeenStartedCache.set(this.getKey(taskId, reasonId), true);
            return true;
        }

        return false;
    }

    async logTaskEnded(
        executionId: number,
        endReason: EndReason
    ): Promise<void> {
        const repo = await this.getEntryRepo();
        await repo.update({ executionId }, { endDate: new Date(), endReason });
    }
}
