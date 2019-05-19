import { PersistentTaskSource } from "../model/TaskSource";
import { TaskDefinition, TaskId } from "../model/TaskDefinition";
import { DbTaskDefinition } from "./entity/DbTaskDefinition";
import { createConnection, Repository, Connection } from "typeorm";
import { DbConnection } from "./DbConnection";

export class DbTaskSource extends PersistentTaskSource {
    private readonly onInit: Promise<{
        taskRepo: Repository<DbTaskDefinition>;
    }>;
    private defs = new Map<TaskId, TaskDefinition>();

    constructor(private readonly db: DbConnection) {
        super();

        this.onInit = this.init();
        this.onInit.catch(console.error);
    }

    async init(): Promise<{ taskRepo: Repository<DbTaskDefinition> }> {
        const connection = await this.db.getConnection();
        const taskRepo = connection.getRepository(DbTaskDefinition);
        const defs = await taskRepo.find();
        for (const d of defs.map(d => d.toTaskDefinition())) {
            this.defs.set(d.id, d);
        }
        return { taskRepo };
    }

    async addTask(def: TaskDefinition): Promise<void> {
        const d = DbTaskDefinition.fromTaskDefinition(def);
        const { taskRepo } = await this.onInit;
        await taskRepo.insert(d);
        this.defs.set(def.id, def);
    }

    async deleteTask(id: TaskId): Promise<void> {
        if (!this.defs.delete(id)) {
            throw new Error(`No task with id "${id}"`);
        }
        const { taskRepo } = await this.onInit;
        await taskRepo.delete({ id });
    }

    async updateTask(def: TaskDefinition): Promise<void> {
        const { taskRepo } = await this.init();
        const dbTask = await taskRepo.findOneOrFail({ id: def.id });
        dbTask.updateWith(def);
        await taskRepo.save(dbTask);

        this.defs.set(def.id, def);
    }

    async getTasks(): Promise<TaskDefinition[]> {
        await this.onInit;
        return [...this.defs.values()];
    }

    async getTask(id: TaskId): Promise<TaskDefinition | undefined> {
        await this.onInit;
        return this.defs.get(id);
    }
}
