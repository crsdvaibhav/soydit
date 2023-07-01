import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname, './migrations'), // path to the folder with migrations
        pathTs: undefined, // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
        glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
    },
    entities: [Post,User],
    dbName: "soydit",
    type: "postgresql",
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];

//Exporting as const changes the type from string to that variable
//Parameters returns the typeof parameters expected