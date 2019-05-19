import { TaskExecutionController } from "./model/TaskExecutionController";
import { ScheduledTasksProvider } from "./model/ActiveTasksProvider";
import { TaskScheduleFromTaskSource } from "./model/TaskSchedule";
import { LocalTaskExecutioner } from "./model/TaskExecutioner";
import { DbTaskSource } from "./db/DbTaskSource";
import { DbConnection } from "./db/DbConnection";
import { DbTaskExecutionLog } from "./db/DbTaskExecutionLog";
import { LoggingTaskExecutioner } from "./model/LoggingTaskExecutioner";
import { TaskOutputLogger } from "./model/TaskOutputLogger";
import { ConfigProvider } from "./Config";

require("source-map-support").install();

const args = process.argv.slice(2);
if (!args[0]) {
    throw new Error("No argument given");
}
const config = new ConfigProvider(args[0]);

const db = new DbConnection(config.getConfig().databasePath);
const taskSource = new DbTaskSource(db);

/*taskSource
    .addTask({
        id: "test" as TaskId,
        options: {
            ifStillRunning: "ignore",
            killAfterRuntime: true,
            keepAliveDuringRuntime: true
        } as TaskOptions,
        action: {
            program: "notepad",
            args: []
        },
        enabled: true,
        trigger: [
            {
                kind: "TimeBased",
                time: new SimpleTimeSequence(ZonedDateTime.now(), {
                    seconds: 20
                }),
                runtime: new SimpleRelativeTimeSequence({ seconds: 10 })
            } as TimedTaskTrigger
        ]
    })
    .catch(console.error);*/

const taskSchedule = new TaskScheduleFromTaskSource(taskSource);
const taskProvider = new ScheduledTasksProvider(taskSchedule);
const executioner = new LocalTaskExecutioner(
    new TaskOutputLogger(config.getConfig().logDirectory)
);
const taskExecutionLog = new DbTaskExecutionLog(db);
const loggingTaskExecutioner = new LoggingTaskExecutioner(
    executioner,
    taskExecutionLog
);
const controller = new TaskExecutionController(
    taskSource,
    taskProvider,
    loggingTaskExecutioner,
    taskExecutionLog
);
