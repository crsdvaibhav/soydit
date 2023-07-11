import React, { ReactNode } from "react";
import Wrapper, { WrapperVariant } from "./Wrapper";
import { NavBar } from "./NavBar";

interface LayoutProps {
    children?: ReactNode;
    variant?: WrapperVariant;
}

const Layout: React.FC<LayoutProps> = ({ children, variant }) => {
    return (
        <>
            <NavBar />
            <Wrapper variant={variant}>{children}</Wrapper>
        </>
    );
};

export default Layout;
