import { In } from "typeorm/find-options/operator/In";
import { Upvote } from "../entities/Upvote";
import DataLoader from "dataloader";

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]
export const createUpvoteLoader = () =>
    new DataLoader<{ postId: number; userId: number }, Upvote | null>(
        async (keys) => {
            const upvote = await Upvote.findBy({ id: In(keys) } as any);
            const upvoteIdsToUpvote: Record<string, Upvote> = {};
            upvote.forEach((updoot) => {
                upvoteIdsToUpvote[`${updoot.userId}|${updoot.postId}`] = updoot;
            });

            return keys.map(
                (key) => upvoteIdsToUpvote[`${key.userId}|${key.postId}`]
            );
        }
    );
