import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants"
import mikroConfig from "./mikro-orm.config"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers/hello"
import { PostsResolver } from "./resolvers/posts"
import { UsersResolver } from "./resolvers/users"

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up(); //Does migrations before running sql;

    const app = express();
    
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[HelloResolver, PostsResolver, UsersResolver],
            validate: false
        }),
        context : () => ({em : orm.em})
    })

    await apolloServer.start()
    apolloServer.applyMiddleware({app})

    app.listen(4000,()=>{
        console.log("Hello!")
    })
}

main()