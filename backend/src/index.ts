import { MikroORM } from "@mikro-orm/core"
import { COOKIE_NAME, __prod__ } from "./constants"
import mikroConfig from "./mikro-orm.config"
import express from "express"
import { ApolloServer, ApolloServerPlugin } from "@apollo/server"
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { json } from 'body-parser';
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers/hello"
import { PostsResolver } from "./resolvers/posts"
import { UsersResolver } from "./resolvers/users"
import RedisStore from "connect-redis"
import session from "express-session"
import { Redis } from "ioredis"
import { MyContext } from "./types"
import { ApolloServerPluginLandingPageLocalDefault,ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';

let plugins:ApolloServerPlugin<MyContext>[] = [];
if (__prod__) {
    plugins = [ApolloServerPluginLandingPageProductionDefault({ embed: true, graphRef: 'myGraph@prod', includeCookies: true })]
} else {
    plugins = [ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true })]
}

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up(); //Does migrations before running sql;

    const app = express();

    // Initialize client.
    const redis = new Redis()
    redis.connect().catch(console.error)

    // Initialize store.
    let redisStore = new (RedisStore as any)({
        client: redis,
        disableTouch : true, //Don't ping again and again
    })

    // Initialize sesssion storage.
    app.use(
        session({
            name:COOKIE_NAME,
            store: redisStore,
            resave: false, // required: force lightweight session keep alive (touch)
            saveUninitialized: false, // recommended: only save session when data exists
            secret: "secret",
            cookie : { 
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
                httpOnly : true,
                secure: __prod__,
                sameSite: "lax" //CRSF
            }
        })
    )
    
    const apolloServer = new ApolloServer<MyContext>({
        schema: await buildSchema({
            resolvers:[HelloResolver, PostsResolver, UsersResolver],
            validate: false
        }),
        plugins: [...plugins],
    })

    await apolloServer.start()
    app.use(
        '/graphql',
        cors<cors.CorsRequest>({ origin: ['https://studio.apollographql.com','http://localhost:3000','http://localhost:4000'], credentials:true }),
        json(),
        expressMiddleware(apolloServer, {
            context : async ({req,res}) => ({em : orm.em, req, res, redis}),
        }),
      );

    app.listen(4000,()=>{
        console.log("Hello!")
    })
}

main()