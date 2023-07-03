import { RequestContext } from "@mikro-orm/core";
import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostsResolver{ //We will be requests which resolvers will resolve
    @Query(()=>[Post]) //We can do query with type safety
    async posts(@Ctx() {em}: MyContext): Promise<Post[]> { //We can manually set the type
        let posts : any
        await RequestContext.createAsync(em,async ()=>{
            posts = await em.find(Post,{})
        })
        return posts
    }
    //Getting a single post
    @Query(()=>Post, {nullable:true})
    async post(
            @Arg('id', ()=>Int) id:any,
            @Ctx() {em}:MyContext
        ) : Promise<Post | null> {
        let post:any
        await RequestContext.createAsync(em,async ()=>{
            post = await em.findOne(Post, id)
        })
        return post
    }

    //Create a post
    @Mutation(()=>Post)
    async createPost(
        @Arg('title', ()=>String) title:string,
        @Ctx() {em}:MyContext
    ): Promise<Post> {
        let post:any
        await RequestContext.createAsync(em,async ()=>{
            post = em.create(Post,{title:title})
            await em.persistAndFlush(post)
        })
        return post
    }

    //Update a post
    @Mutation(()=>Post)
    async updatePost(
        @Arg('id', ()=>Int) id:any,
        @Arg('title', ()=>String) title:string,
        @Ctx() {em}:MyContext
    ): Promise<Post|null> {
        let post:any
        await RequestContext.createAsync(em, async () =>{
            post = await em.findOne(Post, id)
            if(!post){
                post = null
            }else{
                if(typeof title!=="undefined"){
                    post.title = title
                    await em.persistAndFlush(post)
                }
            }
        })
        return post
    }

    //Delete Post
    @Mutation(()=>Boolean)
    async deletePost(
            @Arg('id', ()=>Int) id:any,
            @Ctx() {em}:MyContext
        ) : Promise<boolean> {
        await RequestContext.createAsync(em, async ()=>{
            try{
                await em.nativeDelete(Post, {id})
                return true
            }catch{
                return false
            }
        })
        return true
    }
}