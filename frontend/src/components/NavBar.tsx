import React, { useEffect, useState } from "react";
import { Box, Link, Flex, Button, Heading } from "@chakra-ui/react";
import NextLink from "next/link";
import { useMeQuery, useLogoutMutation } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  const router = useRouter();
  const [{ fetching: logoutFetching}, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause:isServer()
  });

  useEffect(() => {
    setHasMounted(true);
  }, [])

  // Render
  if (!hasMounted) return null;

  let body = null;

  if (fetching) {

  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link as="span" mx={4} px={6} fontWeight={600} bg={"white"} textColor={"black"} textAlign={"center"} fontSize={20} rounded={"md"} py={1}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link as="span" mx={4} px={4} fontWeight={600} bg={"white"} textColor={"black"} textAlign={"center"} fontSize={20} rounded={"md"} py={1}>Register</Link>
        </NextLink>
      </>
    );
    // user is logged in
  } else {
    body = (
      <Flex align="center">
        <NextLink href="/create-post">
          <Button as={Link} mx={4} width={28}>
            Create post
          </Button>
        </NextLink>
        <Button
          onClick={async () => {
            await logout();
            router.reload();
          }}
          isLoading={logoutFetching}
          width={28}
        >
          Logout
        </Button>
        <Box mx={4} width={28} bg={"black"} textColor={"white"} textAlign={"center"} fontSize={20} rounded={"md"} py={1}>{data.me.username}</Box>
      </Flex>
    );
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="#48BB78" p={4}>
      <Flex flex={1} m="auto" align="center" maxW={800}>
        <NextLink href="/">
          <Link as="span">
            <Heading>Soydit</Heading>
          </Link>
        </NextLink>
        <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};
