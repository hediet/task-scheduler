import { Connection, createConnection, ConnectionOptions } from "typeorm";
import { DbTaskDefinition } from "./entity/DbTaskDefinition";
import { DbTaskExecutionLogEntry } from "./entity/DbTaskExecutionLogEntry";
import { getMigrationDir } from "./migration";

export class DbConnection {
    public static getConfig(dbPath: string): ConnectionOptions {
        return {
            type: "sqlite",
            database: dbPath,
            synchronize: true,
            logging: true,
            entities: [DbTaskDefinition, DbTaskExecutionLogEntry],
            migrations: [],
            cli: {
                migrationsDir: getMigrationDir()
            }
        };
    }

    private readonly connectionPromise: Promise<Connection>;

    constructor(dbPath: string) {
        this.connectionPromise = createConnection(
            DbConnection.getConfig(dbPath)
        );
    }

    getConnection(): Promise<Connection> {
        return this.connectionPromise;
    }
}
