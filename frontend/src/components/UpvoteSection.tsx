import React, { useState } from "react";
import { Flex, IconButton } from "@chakra-ui/react";
import {
  PostSnippetFragment,
  PostsQuery,
  useVoteMutation,
  VoteMutation,
} from "../generated/graphql";
import gql from "graphql-tag";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

interface UpvoteSectionProps {
  post: PostsQuery['posts']['posts'][0];
}

// const updateAfterVote = (
//   value: number,
//   postId: number,
//   cache: ApolloCache<VoteMutation>
// ) => {
//   const data = cache.readFragment<{
//     id: number;
//     points: number;
//     voteStatus: number | null;
//   }>({
//     id: "Post:" + postId,
//     fragment: gql`
//       fragment _ on Post {
//         id
//         points
//         voteStatus
//       }
//     `,
//   });

//   if (data) {
//     if (data.voteStatus === value) {
//       return;
//     }
//     const newPoints =
//       (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
//     cache.writeFragment({
//       id: "Post:" + postId,
//       fragment: gql`
//         fragment __ on Post {
//           points
//           voteStatus
//         }
//       `,
//       data: { points: newPoints, voteStatus: value },
//     });
//   }
// };

export const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");
  const [,vote] = useVoteMutation();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState("upvote-loading");
          await vote({
              postId: post.id,
              value: 1,
            },
            // update: (cache) => updateAfterVote(1, post.id, cache),
          );
          setLoadingState("not-loading");
        }}
        bg={post.voteStatus === 1 ? "green" : undefined}
        isLoading={loadingState === "upvote-loading"}
        aria-label="upvote post"
        icon={<ChevronUpIcon/>}
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
            },
            // update: (cache) => updateAfterVote(-1, post.id, cache),
          );
          setLoadingState("not-loading");
        }}
        bg={post.voteStatus === -1 ? "red" : undefined}
        isLoading={loadingState === "downvote-loading"}
        aria-label="downvote post"
        icon={<ChevronDownIcon/>}
      />
    </Flex>
  );
};