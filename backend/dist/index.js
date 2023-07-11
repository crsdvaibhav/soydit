"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const constants_1 = require("./constants");
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const type_graphql_1 = require("type-graphql");
const posts_1 = require("./resolvers/posts");
const users_1 = require("./resolvers/users");
const connect_redis_1 = __importDefault(require("connect-redis"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = require("ioredis");
const default_1 = require("@apollo/server/plugin/landingPage/default");
const data_source_1 = require("./data-source");
const createUserLoader_1 = require("./utils/createUserLoader");
const createUpvoteLoader_1 = require("./utils/createUpvoteLoader");
let plugins = [];
if (constants_1.__prod__) {
    plugins = [
        (0, default_1.ApolloServerPluginLandingPageProductionDefault)({
            embed: true,
            graphRef: "myGraph@prod",
            includeCookies: true,
        }),
    ];
}
else {
    plugins = [
        (0, default_1.ApolloServerPluginLandingPageLocalDefault)({
            embed: true,
            includeCookies: true,
        }),
    ];
}
const main = async () => {
    data_source_1.AppDataSource.initialize()
        .then(() => {
        console.log("Database is ready!");
    })
        .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
    const app = (0, express_1.default)();
    const redis = new ioredis_1.Redis();
    redis.connect().catch(console.error);
    let redisStore = new connect_redis_1.default({
        client: redis,
        disableTouch: true,
    });
    app.use((0, express_session_1.default)({
        name: constants_1.COOKIE_NAME,
        store: redisStore,
        resave: false,
        saveUninitialized: false,
        secret: "secret",
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            secure: constants_1.__prod__,
            sameSite: "lax",
        },
    }));
    const apolloServer = new server_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [posts_1.PostsResolver, users_1.UsersResolver],
            validate: false,
        }),
        plugins: [...plugins],
    });
    await apolloServer.start();
    app.use("/graphql", (0, cors_1.default)({
        origin: [
            "https://studio.apollographql.com",
            "http://localhost:3000",
            "http://localhost:4000",
        ],
        credentials: true,
    }), (0, body_parser_1.json)(), (0, express4_1.expressMiddleware)(apolloServer, {
        context: async ({ req, res }) => ({ req, res, redis, userLoader: (0, createUserLoader_1.createUserLoader)(), upvoteLoader: (0, createUpvoteLoader_1.createUpvoteLoader)(), }),
    }));
    app.listen(4000, () => {
        console.log(`Server stared on port: ${4000}`);
    });
};
main();
//# sourceMappingURL=index.js.map