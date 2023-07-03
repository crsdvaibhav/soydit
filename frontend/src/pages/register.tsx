import React from "react";
import { Formik, Form } from "formik";
import InputField from "../components/InputField"
import Wrapper from "../components/Wrapper";
import { Box, Button } from "@chakra-ui/react";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={(values) => {
                    console.log(values);
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField name="username" placeholder="username" label="Username"/>
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

export default Register;
