import { type, string } from "io-ts";
import { readFileSync } from "fs";
import { join, resolve } from "path";

export class ConfigProvider {
    private readonly config: typeof ConfigJsonEnc["_A"];

    constructor(private readonly configPath: string) {
        const c = readFileSync(configPath, { encoding: "utf8" });
        const obj = JSON.parse(c);
        const config = ConfigJsonEnc.decode(obj).getOrElseL(e => {
            throw new Error(e.map(x => x.message).join(", "));
        });
        this.config = {
            databasePath: resolve(configPath, config.databasePath),
            logDirectory: resolve(configPath, config.logDirectory)
        };
    }

    getConfig(): typeof ConfigJsonEnc["_A"] {
        return this.config;
    }
}

export const ConfigJsonEnc = type({
    logDirectory: string,
    databasePath: string
});
