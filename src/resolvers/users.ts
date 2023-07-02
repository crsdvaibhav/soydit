import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { MyContext } from "src/types";
import { RequestContext } from "@mikro-orm/core";
import * as argon2 from "argon2";

//Instead of creating multiple args just create a class for them
@InputType()
class UsernamePasswordInput {
    @Field()
    username :string

    @Field()
    password :string
}

@ObjectType()
class FieldError{
    @Field()
    field:string

    @Field()
    message:string
}

@ObjectType()
class UserResponse{
    @Field(()=>[FieldError], {nullable:true})
    errors? : FieldError[]

    @Field(()=>User, {nullable:true})
    user? : User
}

@Resolver()
export class UsersResolver{ 
    //Register
    @Mutation(()=>UserResponse) 
    async register(

        @Arg('options', ()=>UsernamePasswordInput) options:UsernamePasswordInput,
        @Ctx() {em}: MyContext

    ): Promise<UserResponse> {

        const response : UserResponse = {errors:undefined, user:undefined}
        const hashedPassword = await argon2.hash(options.password)

        await RequestContext.createAsync(em, async () => {
            const u = em.create(User, {username:options.username, password:hashedPassword})
            try{
                await em.persistAndFlush(u)
                response.user=u
            }catch(err){
                if(err.code==='23505'){
                    response.errors=[{field: "Username",message: "Username already exists!"}]
                }
            }
        })
        
        return response
    }
    //Login
    @Mutation(()=>UserResponse) 
    async login(

        @Arg('options', ()=>UsernamePasswordInput) options:UsernamePasswordInput,
        @Ctx() {em,req}: MyContext

    ): Promise<UserResponse> {

        const response : UserResponse = {errors:undefined, user:undefined}

        await RequestContext.createAsync(em, async () => {
            const u = await em.findOne(User, {username:options.username})

            if(!u){
                response.errors = [{field : "Username", message : "That username does not exist!"}]
            }else{
                
                const valid = await argon2.verify(u.password, options.password)

                if(!valid){
                    response.errors = [{field : "Password", message : "Incorrect password!"}]
                }else{
                    response.user = u
                    req.session.userId = u.id;
                }
            }
        })

        return response
    }
    
}