import { TaskDefinition, TaskId } from "./TaskDefinition";

export abstract class TaskSource {
    abstract getTasks(): Promise<TaskDefinition[]>;
    abstract getTask(id: TaskId): Promise<TaskDefinition | undefined>;
}

export abstract class PersistentTaskSource extends TaskSource {
    abstract deleteTask(id: TaskId): Promise<void>;
    abstract updateTask(def: TaskDefinition): Promise<void>;
    abstract addTask(def: TaskDefinition): Promise<void>;
}

export class StaticTaskSource extends TaskSource {
    constructor(private readonly tasks: TaskDefinition[]) {
        super();
    }

    async getTask(id: TaskId): Promise<TaskDefinition | undefined> {
        return (await this.getTasks()).find(t => t.id === id);
    }

    async getTasks(): Promise<TaskDefinition[]> {
        return this.tasks;
    }
}
