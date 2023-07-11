import "reflect-metadata";
import { User } from "../entities/User";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
} from "type-graphql";
import { MyContext } from "../types";
import * as argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";
import { AppDataSource } from "../data-source";

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

const userRepository = AppDataSource.getRepository(User);
@Resolver(User)
export class UsersResolver {
    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() { req }: MyContext) {
        // this is the current user and its ok to show them their own email
        if (req.session.userId === user.id) {
            return user.email;
        }
        // current user wants to see someone elses email
        return "";
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await userRepository.findOneBy({ email: email });
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
    async me(@Ctx() { req }: MyContext) {
        // you are not logged in
        console.log(req.session.userId);
        if (!req.session.userId) {
            return null;
        }
        return await userRepository.findOneBy({ id: req.session.userId });
    }
    //Register
    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UsernamePasswordInput)
        options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
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

        const user = new User();
        user.email = options.email;
        user.username = options.username;
        user.password = hashedPassword;

        try {
            await userRepository.save(user);
            return {
                user: user,
            };
        } catch (err) {
            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username or Email already exists!",
                        },
                    ],
                };
            }
        }

        req.session.userId = user.id;
        return { user: user };
    }
    //Login
    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await userRepository.findOneBy(
            usernameOrEmail.includes("@")
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
        );

        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "That username does not exist!",
                    },
                ],
            };
        } else {
            const valid = await argon2.verify(user.password, password);

            if (!valid) {
                return {
                    errors: [
                        { field: "password", message: "Incorrect password!" },
                    ],
                };
            }
        }

        req.session.userId = user.id;
        return { user: user };
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
        @Ctx() { redis, req }: MyContext
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
        const user = await userRepository.findOneBy({ id: userIdNum });

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

        user.password = await argon2.hash(newPassword);
        await userRepository.save(user);

        await redis.del(key);

        // log in user after change password
        req.session.userId = user.id;

        return { user };
    }
}
