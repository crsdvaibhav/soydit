import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver{ //We will be requests which resolvers will resolve
    @Query(()=>String) //We can do query with type safety
    hello(){
        return "Hello, World!"
    }
}