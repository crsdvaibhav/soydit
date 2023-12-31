import React from "react";
import { Formik, Form } from "formik";
import InputField from "../components/InputField"
import Wrapper from "../components/Wrapper";
import { Box, Button } from "@chakra-ui/react";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
    const router = useRouter();
    const [,register] = useRegisterMutation(); //register function on the mutation

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ email: "", username: "", password: "" }}
                onSubmit={async (values, {setErrors}) => {
                    const response =  await register({options: values}); //Its a promise
                    if(response.data?.register.errors){
                        setErrors(toErrorMap(response.data.register.errors));
                    }else if (response.data?.register.user) {
                        console.log(response.data?.register.user);
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField name="username" placeholder="username" label="Username"/>
                        <Box mt={4}>
                            <InputField name="email" placeholder="email" label="Email"/>
                        </Box>
                        <Box mt={4}>
                            <InputField name="password" placeholder="password" label="Password" type="password"/>
                        </Box>
                        <Box mt={4}>
                            <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="green">Register</Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(Register);
