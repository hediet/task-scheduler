import { RunningTask } from "./TaskExecutioner";
import { join } from "path";
import { createWriteStream } from "fs";
import { DateTimeFormatter } from "js-joda";
import mkdirp = require("mkdirp");

export class TaskOutputLogger {
    constructor(private readonly logDir: string) {
        mkdirp(logDir, err => {
            if (err) {
                console.error(err);
            }
        });
    }

    public setupLogging(task: RunningTask) {
        const fileName = `${task.task.id}-${task.executionId}-${task.started
            .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            .toString()
            .replace(/\:/g, "")}.log`;
        const filePath = join(this.logDir, fileName);
        const stream = createWriteStream(filePath, { flags: "wx" });

        const proc = task.process;
        proc.stdout.on("data", (data: Buffer) => {
            console.log(data);
            stream.write(data);
        });
        proc.on("close", () => {
            stream.close();
        });
    }
}
