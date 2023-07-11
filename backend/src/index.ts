import "reflect-metadata"
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { json } from "body-parser";
import { buildSchema } from "type-graphql";
import { PostsResolver } from "./resolvers/posts";
import { UsersResolver } from "./resolvers/users";
import RedisStore from "connect-redis";
import session from "express-session";
import { Redis } from "ioredis";
import { MyContext } from "./types";
import {
    ApolloServerPluginLandingPageLocalDefault,
    ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { AppDataSource } from "./data-source";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpvoteLoader } from "./utils/createUpvoteLoader";

let plugins: ApolloServerPlugin<MyContext>[] = [];
if (__prod__) {
    plugins = [
        ApolloServerPluginLandingPageProductionDefault({
            embed: true,
            graphRef: "myGraph@prod",
            includeCookies: true,
        }),
    ];
} else {
    plugins = [
        ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            includeCookies: true,
        }),
    ];
}

const main = async () => {
    //Initialise the DB
    AppDataSource.initialize()
        .then(() => {
            console.log("Database is ready!");
        })
        .catch((err) => {
            console.error("Error during Data Source initialization:", err);
        });

    const app = express();

    // Initialize client.
    const redis = new Redis();
    redis.connect().catch(console.error);

    // Initialize store.
    let redisStore = new (RedisStore as any)({
        client: redis,
        disableTouch: true, //Don't ping again and again
    });

    // Initialize sesssion storage.
    app.use(
        session({
            name: COOKIE_NAME,
            store: redisStore,
            resave: false, // required: force lightweight session keep alive (touch)
            saveUninitialized: false, // recommended: only save session when data exists
            secret: "secret",
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
                httpOnly: true,
                secure: __prod__,
                sameSite: "lax", //CRSF
            },
        })
    );

    const apolloServer = new ApolloServer<MyContext>({
        schema: await buildSchema({
            resolvers: [PostsResolver, UsersResolver],
            validate: false,
        }),
        plugins: [...plugins],
    });

    await apolloServer.start();
    app.use(
        "/graphql",
        cors<cors.CorsRequest>({
            origin: [
                "https://studio.apollographql.com",
                "http://localhost:3000",
                "http://localhost:4000",
            ],
            credentials: true,
        }),
        json(),
        expressMiddleware(apolloServer, {
            context: async ({ req, res }) => ({ req, res, redis, userLoader: createUserLoader(), upvoteLoader: createUpvoteLoader(), }),
        })
    );

    app.listen(4000, () => {
        console.log(`Server stared on port: ${4000}`);
    });
};

main();
