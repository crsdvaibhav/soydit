import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Post } from "../entities/Post";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { Upvote } from "../entities/Upvote";

@InputType()
class PostInput {
    @Field()
    title: string;
    @Field()
    text: string;
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];

    @Field()
    hasMore: boolean;
}

const postRepository = AppDataSource.getRepository(Post);
@Resolver(Post)
export class PostsResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() post: Post) {
        return post.text.slice(0, 50);
    }

    // @FieldResolver(() => Int, { nullable: true })
    // async voteStatus(
    //     @Root() post: Post,
    //     @Ctx() { updootLoader, req }: MyContext
    // ) {
    //     if (!req.session.userId) {
    //         return null;
    //     }

    //     const updoot = await updootLoader.load({
    //         postId: post.id,
    //         userId: req.session.userId,
    //     });

    //     return updoot ? updoot.value : null;
    // }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const isUpvote = value !== -1;
        const realValue = isUpvote ? 1 : -1;
        const { userId } = req.session;

        const upvote = await Upvote.findOne({ where: { postId, userId } });

        // the user has voted on the post before
        // and they are changing their vote
        if (upvote && upvote.value !== realValue) {
            await AppDataSource.transaction(async (tm) => {
                await tm.query(
                    `update upvote
                    set value = ${realValue}
                    where "postId" = ${postId} and "userId" = ${userId}`
                );

                await tm.query(
                    `update post
                    set points = points + ${2 * realValue}
                    where id = ${postId}`
                );
            });
        } else if (!upvote) {
            // has never voted before
            await AppDataSource.transaction(async (tm) => {
                await tm.query(
                    `insert into upvote ("userId", "postId", value)
                    values (${userId}, ${postId}, ${realValue})`
                );

                await tm.query(
                    `update post
                    set points = points + ${realValue}
                    where id = ${postId}`
                );
            });
        }
        return true;
    }

    //We will be requests which resolvers will resolve
    @Query(() => PaginatedPosts) //We can do query with type safety
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const replacements: any[] = [];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }
        const posts = await AppDataSource.getRepository(Post).query(
            `
            SELECT p.* ,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email
                ) creator,
            ${
                req.session.userId
                    ? `(SELECT value FROM upvote WHERE "userId" = ${req.session.userId} AND "postId" = p.id) "voteStatus"`
                    : `null as "voteStatus"`
            }
            FROM post p
            INNER JOIN public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $1` : ""}
            order by p."createdAt" DESC
            limit ${realLimit + 1}
            `,
            replacements
        );

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimit + 1,
        };
    }
    //Getting a single post
    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
        return await postRepository.findOneBy({ id: id });
    }

    //Create a post
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        const post = new Post();
        post.title = input.title;
        post.text = input.text;
        post.creatorId = req.session.userId as number;
        await postRepository.save(post);
        return post;
    }

    //Update a post
    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", ()=>String) title: string,
        @Arg("text", ()=>String) text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        const result = await AppDataSource.createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where('id = :id and "creatorId" = :creatorId', {
                id,
                creatorId: req.session.userId,
            })
            .returning("*")
            .execute();

        return result.raw[0];
    }

    //Delete Post
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: any,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        await postRepository.delete({ id, creatorId: req.session.userId });
        return true;
    }
}
