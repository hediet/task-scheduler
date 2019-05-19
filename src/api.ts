import {
    contract,
    request,
    requestContract,
    notificationContract
} from "@hediet/typed-json-rpc";
import { type, literal, union, boolean, string, array } from "io-ts";
import {
    TaskIdType,
    TaskOptions,
    ProgramWithArgsType,
    TaskOptionsType
} from "./model/TaskDefinition";
import { TimedTaskTrigger } from "./model/TimedTaskTrigger";

export const Task = type({
    taskId: TaskIdType,
    name: string,
    options: TaskOptionsType,
    trigger: array(TimedTaskTrigger),
    action: ProgramWithArgsType,
    enabled: boolean
});

export const taskSchedulerContract = contract({
    server: {
        listTasks: requestContract({
            result: type({
                tasks: array(Task)
            })
        }),
        createOrUpdateTask: requestContract({
            params: type({
                task: Task,
                mode: union([
                    literal("create"),
                    literal("update"),
                    literal("createOrUpdate")
                ])
            })
        }),
        setTaskState: requestContract({
            params: type({
                taskId: TaskIdType,
                enabled: boolean
            })
        }),
        deleteTask: requestContract({
            params: type({
                taskId: TaskIdType
            })
        }),
        closeInstances: requestContract({
            params: type({
                taskId: TaskIdType
            })
        }),
        listInstances: requestContract({
            params: type({
                taskId: TaskIdType
            })
        })
    },
    client: {
        instanceStarted: notificationContract({}),
        instanceLogged: notificationContract({}),
        instanceExited: notificationContract({})
    }
});
