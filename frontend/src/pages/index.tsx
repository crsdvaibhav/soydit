import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import {
    usePostsQuery,
} from "../generated/graphql";
import Layout from "../components/Layout";
import NextLink from "next/link";
import {
    Box,
    Button,
    Flex,
    Heading,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { UpvoteSection } from "../components/UpvoteSection";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";

const Index = () => {
    const [variables, setVariables] = useState({
        limit: 1,
        cursor: null as null | string,
    });
    const [{ data, error, fetching }] = usePostsQuery({
        variables,
    });

    if (!fetching && !data) {
        return (
            <div>
                <div>You got query failed for some reason</div>
                <div>{error?.message}</div>
            </div>
        );
    }

    return (
        <Layout>
            {!data && fetching ? (
                <div>Loading...</div>
            ) : (
                <Stack spacing={8}>
                    {data!.posts.posts.map((p) =>
                        !p ? null : (
                            <Flex
                                key={p.id}
                                p={5}
                                shadow="md"
                                borderWidth="1px"
                            >
                                <UpvoteSection post={p} />
                                <Box flex={1}>
                                    <NextLink
                                        href="/post/[id]"
                                        as={`/post/${p.id}`}
                                    >
                                        <Link as="span">
                                            <Heading fontSize="xl">
                                                {p.title}
                                            </Heading>
                                        </Link>
                                    </NextLink>
                                    <Text>posted by {p.creator.username}</Text>
                                    <Flex align="center">
                                        <Text flex={1} mt={4}>
                                            {p.textSnippet}
                                        </Text>
                                        <EditDeletePostButtons
                                            id={p.id}
                                            creatorId={p.creator.id}
                                        />
                                    </Flex>
                                </Box>
                            </Flex>
                        )
                    )}
                </Stack>
            )}
            {data && data.posts.hasMore ? (
                <Flex>
                    <Button
                        // onClick={() => {
                        //     fetchMore({
                        //         variables: {
                        //             limit: variables?.limit,
                        //             cursor: data.posts.posts[
                        //                 data.posts.posts.length - 1
                        //             ].createdAt,
                        //         },
                        //     });
                        // }}
                        onClick={() => {
                            console.log(
                                data.posts.posts[data.posts.posts.length - 1]
                                    .createdAt
                            );
                            setVariables({
                                limit: variables.limit,
                                cursor: data.posts.posts[
                                    data.posts.posts.length - 1
                                ].createdAt,
                            });
                        }}
                        isLoading={fetching}
                        m="auto"
                        my={8}
                    >
                        Load more
                    </Button>
                </Flex>
            ) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
//SSR will first get the content
