import { Entity, PrimaryColumn, Column } from "typeorm";
import { type, array } from "io-ts";
import {
    TaskDefinition,
    TaskId,
    TaskOptionsType,
    ProgramWithArgsType
} from "../../model/TaskDefinition";
import { TimedTaskTrigger } from "../../model/TimedTaskTrigger";

@Entity("taskDefinitions")
export class DbTaskDefinition {
    static fromTaskDefinition(def: TaskDefinition): DbTaskDefinition {
        const d = new DbTaskDefinition();
        d.id = def.id;
        d.created = new Date();
        d.lastUpdated = new Date();
        d.updateWith(def);
        return d;
    }

    @PrimaryColumn({ type: "varchar" })
    id!: TaskId;

    @Column()
    enabled!: boolean;

    @Column()
    created!: Date;

    @Column()
    lastUpdated!: Date;

    @Column({
        type: "varchar",
        transformer: { from: d => JSON.parse(d), to: d => JSON.stringify(d) }
    })
    data!: typeof DbTaskDefinitionDataJsonEnc["_O"];

    public updateWith(def: TaskDefinition): void {
        if (this.id !== def.id) {
            throw new Error("Id's must match.");
        }

        const data = DbTaskDefinitionDataJsonEnc.encode({
            action: def.action,
            options: def.options,
            trigger: def.trigger
        });
        this.data = data;
        this.enabled = def.enabled;
        this.lastUpdated = new Date();
    }

    public toTaskDefinition(): TaskDefinition {
        const data = DbTaskDefinitionDataJsonEnc.decode(this.data).getOrElseL(
            e => {
                throw new Error(e.join(", "));
            }
        );

        return new TaskDefinition(
            this.id,
            data.trigger,
            data.action,
            data.options,
            this.enabled
        );
    }
}

const DbTaskDefinitionDataJsonEnc = type({
    options: TaskOptionsType,
    action: ProgramWithArgsType,
    trigger: array(TimedTaskTrigger)
});
