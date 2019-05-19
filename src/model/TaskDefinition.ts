import {
    union,
    literal,
    boolean,
    type,
    string,
    array,
    Integer,
    nullType,
    Type,
    undefined
} from "io-ts";
import { TimedTaskTrigger } from "./TimedTaskTrigger";

export class TaskDefinition {
    constructor(
        public readonly id: TaskId,
        public readonly trigger: TimedTaskTrigger[],
        public readonly action: ProgramWithArgs,
        public readonly options: TaskOptions,
        public readonly enabled: boolean
    ) {}
}

export type TaskOptions = typeof TaskOptionsType._A;
export const TaskOptionsType = type({
    ifStillRunning: union([
        literal("ignore"),
        literal("delay"),
        literal("startAnother"),
        literal("restart")
    ]),
    killAfterRuntime: boolean,
    keepAliveDuringRuntime: boolean,
    startOnlyOnceDuringRuntime: boolean
});

export type ProgramWithArgs = typeof ProgramWithArgsType._A;
export const ProgramWithArgsType = type({
    program: string,
    args: array(string)
});

export type TaskId = string & { __brand: "TaskId" };
export const TaskIdType = string;
