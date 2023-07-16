"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const Upvote_1 = require("./entities/Upvote");
require("dotenv-safe/config");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true,
    entities: [Post_1.Post, User_1.User, Upvote_1.Upvote],
    logging: true
});
//# sourceMappingURL=data-source.js.map