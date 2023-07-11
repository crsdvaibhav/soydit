"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
require("reflect-metadata");
const isAuth = ({ context }, next) => {
    if (!context.req.session.userId) {
        throw new Error("Not authenticated: Login/Create Account!");
    }
    return next();
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map