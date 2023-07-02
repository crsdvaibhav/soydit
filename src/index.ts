import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants"
import mikroConfig from "./mikro-orm.config"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers/hello"
import { PostsResolver } from "./resolvers/posts"
import { UsersResolver } from "./resolvers/users"
import RedisStore from "connect-redis"
import session from "express-session"
import {createClient} from "redis"
import { MyContext } from "./types"

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up(); //Does migrations before running sql;

    const app = express();

    // Initialize client.
    let redisClient = createClient()
    redisClient.connect().catch(console.error)

    // Initialize store.
    let redisStore = new (RedisStore as any)({
        client: redisClient,
        prefix: "myapp:",
        disableTouch : true, //Don't ping again and again
        cookie : { 
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
            httpOnly : true,
            secure: __prod__,
            sameSite: "lax" //CRSF
        }
    })

    // Initialize sesssion storage.
    app.use(
        session({
            name:'qid',
            store: redisStore,
            resave: false, // required: force lightweight session keep alive (touch)
            saveUninitialized: false, // recommended: only save session when data exists
            secret: "secret",
        })
    )
    
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[HelloResolver, PostsResolver, UsersResolver],
            validate: false
        }),
        context : ({req,res}): MyContext => ({em : orm.em, req, res})
    })

    await apolloServer.start()
    apolloServer.applyMiddleware({app})

    app.listen(4000,()=>{
        console.log("Hello!")
    })
}

main()