import { type, string } from "io-ts";
import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";

export class ConfigProvider {
    private readonly config: typeof ConfigJsonEnc["_A"];

    constructor(private readonly configPath: string) {
        const c = readFileSync(configPath, { encoding: "utf8" });
        const obj = JSON.parse(c);
        const config = ConfigJsonEnc.decode(obj).getOrElseL(e => {
            throw new Error(e.map(x => x.message).join(", "));
        });
        const configDir = dirname(configPath);
        this.config = {
            databasePath: resolve(configDir, config.databasePath),
            logDirectory: resolve(configDir, config.logDirectory)
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
