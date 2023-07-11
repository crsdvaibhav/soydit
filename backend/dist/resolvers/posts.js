"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsResolver = void 0;
require("reflect-metadata");
const data_source_1 = require("../data-source");
const Post_1 = require("../entities/Post");
const type_graphql_1 = require("type-graphql");
const isAuth_1 = require("../middleware/isAuth");
const Upvote_1 = require("../entities/Upvote");
let PostInput = class PostInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    (0, type_graphql_1.InputType)()
], PostInput);
let PaginatedPosts = class PaginatedPosts {
};
__decorate([
    (0, type_graphql_1.Field)(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginatedPosts.prototype, "posts", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Boolean)
], PaginatedPosts.prototype, "hasMore", void 0);
PaginatedPosts = __decorate([
    (0, type_graphql_1.ObjectType)()
], PaginatedPosts);
const postRepository = data_source_1.AppDataSource.getRepository(Post_1.Post);
let PostsResolver = exports.PostsResolver = class PostsResolver {
    textSnippet(post) {
        return post.text.slice(0, 50);
    }
    async vote(postId, value, { req }) {
        const isUpvote = value !== -1;
        const realValue = isUpvote ? 1 : -1;
        const { userId } = req.session;
        const upvote = await Upvote_1.Upvote.findOne({ where: { postId, userId } });
        if (upvote && upvote.value !== realValue) {
            await data_source_1.AppDataSource.transaction(async (tm) => {
                await tm.query(`update upvote
                    set value = ${realValue}
                    where "postId" = ${postId} and "userId" = ${userId}`);
                await tm.query(`update post
                    set points = points + ${2 * realValue}
                    where id = ${postId}`);
            });
        }
        else if (!upvote) {
            await data_source_1.AppDataSource.transaction(async (tm) => {
                await tm.query(`insert into upvote ("userId", "postId", value)
                    values (${userId}, ${postId}, ${realValue})`);
                await tm.query(`update post
                    set points = points + ${realValue}
                    where id = ${postId}`);
            });
        }
        return true;
    }
    async posts(limit, cursor, { req }) {
        const realLimit = Math.min(50, limit);
        const replacements = [];
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }
        const posts = await data_source_1.AppDataSource.getRepository(Post_1.Post).query(`
            SELECT p.* ,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email
                ) creator,
            ${req.session.userId
            ? `(SELECT value FROM upvote WHERE "userId" = ${req.session.userId} AND "postId" = p.id) "voteStatus"`
            : `null as "voteStatus"`}
            FROM post p
            INNER JOIN public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $1` : ""}
            order by p."createdAt" DESC
            limit ${realLimit + 1}
            `, replacements);
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimit + 1,
        };
    }
    async post(id) {
        return await postRepository.findOneBy({ id: id });
    }
    async createPost(input, { req }) {
        const post = new Post_1.Post();
        post.title = input.title;
        post.text = input.text;
        post.creatorId = req.session.userId;
        await postRepository.save(post);
        return post;
    }
    async updatePost(id, title, text, { req }) {
        const result = await data_source_1.AppDataSource.createQueryBuilder()
            .update(Post_1.Post)
            .set({ title, text })
            .where('id = :id and "creatorId" = :creatorId', {
            id,
            creatorId: req.session.userId,
        })
            .returning("*")
            .execute();
        return result.raw[0];
    }
    async deletePost(id, { req }) {
        await postRepository.delete({ id, creatorId: req.session.userId });
        return true;
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "textSnippet", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("postId", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("value", () => type_graphql_1.Int)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "vote", null);
__decorate([
    (0, type_graphql_1.Query)(() => PaginatedPosts),
    __param(0, (0, type_graphql_1.Arg)("limit", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("cursor", () => String, { nullable: true })),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "posts", null);
__decorate([
    (0, type_graphql_1.Query)(() => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "post", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("input")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "createPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("title", () => String)),
    __param(2, (0, type_graphql_1.Arg)("text", () => String)),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "updatePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "deletePost", null);
exports.PostsResolver = PostsResolver = __decorate([
    (0, type_graphql_1.Resolver)(Post_1.Post)
], PostsResolver);
//# sourceMappingURL=posts.js.map