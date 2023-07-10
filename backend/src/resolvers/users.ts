import { User } from "../entities/User";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { MyContext } from "../types";
import { RequestContext } from "@mikro-orm/core";
import * as argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";

//Instead of creating multiple args just create a class for them
@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UsersResolver {
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        let user: any = undefined;
        await RequestContext.createAsync(em, async () => {
            const u = await em.findOne(User, { email: email });
            user = u;
        });
        if (!user) {
            // the email is not in the db
            return true;
        }

        const token = v4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            "EX",
            1000 * 60 * 60 * 24 * 3
        ); // 3 days

        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
        );

        return true;
    }
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        // you are not logged in
        console.log(req.session.userId);
        if (!req.session.userId) {
            return null;
        }
        let user: any = undefined;
        await RequestContext.createAsync(em, async () => {
            const u = await em.findOne(User, { id: req.session.userId });
            user = u;
        });
        return user;
    }
    //Register
    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UsernamePasswordInput)
        options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const response: UserResponse = { errors: undefined, user: undefined };
        const hashedPassword = await argon2.hash(options.password);

        if (options.username.includes("@")) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Cannot use @ in username!",
                    },
                ],
            };
        }

        await RequestContext.createAsync(em, async () => {
            const u = em.create(User, {
                username: options.username,
                email: options.email,
                password: hashedPassword,
            });
            try {
                await em.persistAndFlush(u);
                response.user = u;
            } catch (err) {
                if (err.code === "23505") {
                    response.errors = [
                        {
                            field: "username",
                            message: "Username or Email already exists!",
                        },
                    ];
                }
            }
        });

        req.session.userId = response.user?.id;
        return response;
    }
    //Login
    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const response: UserResponse = { errors: undefined, user: undefined };

        await RequestContext.createAsync(em, async () => {
            const u = await em.findOne(
                User,
                usernameOrEmail.includes("@")
                    ? { email: usernameOrEmail }
                    : { username: usernameOrEmail }
            );

            if (!u) {
                response.errors = [
                    {
                        field: "usernameOrEmail",
                        message: "That username does not exist!",
                    },
                ];
            } else {
                const valid = await argon2.verify(u.password, password);

                if (!valid) {
                    response.errors = [
                        { field: "password", message: "Incorrect password!" },
                    ];
                } else {
                    response.user = u;
                }
            }
        });

        req.session.userId = response.user?.id;
        return response;
    }
    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }

                resolve(true);
            })
        );
    }
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { em, redis, req }: MyContext
    ): Promise<UserResponse> {

        const key = FORGET_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Token expired!",
                    },
                ],
            };
        }

        const userIdNum = parseInt(userId);
        
        let user: any = undefined;
        await RequestContext.createAsync(em, async () => {
            const u = await em.findOne(User, { id: userIdNum });
            user = u;
        });

        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exists!",
                    },
                ],
            };
        }

        await RequestContext.createAsync(em, async () => {
            user.password = await argon2.hash(newPassword);
            await em.persistAndFlush(user);
        });
        

        await redis.del(key);

        // log in user after change password
        req.session.userId = user.id;

        return { user };
    }
}
