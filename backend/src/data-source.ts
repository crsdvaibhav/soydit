import "reflect-metadata"
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Upvote } from "./entities/Upvote";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "soydit",
    synchronize: true,
    entities: [Post, User, Upvote],
});