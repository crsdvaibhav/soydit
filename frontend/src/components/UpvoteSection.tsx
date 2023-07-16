import React, { useEffect, useState } from "react";
import { Flex, IconButton } from "@chakra-ui/react";
import { PostsQuery, useVoteMutation } from "../generated/graphql";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

interface UpvoteSectionProps {
    post: PostsQuery["posts"]["posts"][0];
}

export const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<
        "upvote-loading" | "downvote-loading" | "not-loading"
    >("not-loading");

    const [, vote] = useVoteMutation();
    return (
        <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            mr={4}
        >
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === 1) {
                        return;
                    }
                    setLoadingState("upvote-loading");
                    await vote({
                        postId: post.id,
                        value: 1,
                    });
                    setLoadingState("not-loading");
                }}
                bg={post.voteStatus === 1 ? "green" : undefined}
                isLoading={loadingState === "upvote-loading"}
                aria-label="upvote post"
                icon={<ChevronUpIcon />}
            />
            {post.points}
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === -1) {
                        return;
                    }
                    setLoadingState("downvote-loading");
                    await vote({
                        postId: post.id,
                        value: -1,
                    });
                    setLoadingState("not-loading");
                }}
                bg={post.voteStatus === -1 ? "red" : undefined}
                isLoading={loadingState === "downvote-loading"}
                aria-label="downvote post"
                icon={<ChevronDownIcon />}
            />
        </Flex>
    );
};
