"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const Upvote_1 = require("./entities/Upvote");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "soydit",
    synchronize: true,
    entities: [Post_1.Post, User_1.User, Upvote_1.Upvote],
});
//# sourceMappingURL=data-source.js.map