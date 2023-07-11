"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const User_1 = require("../entities/User");
const In_1 = require("typeorm/find-options/operator/In");
const createUserLoader = () => new dataloader_1.default(async (userIds) => {
    const users = await User_1.User.findBy({ id: (0, In_1.In)(userIds) });
    const userIdToUser = {};
    users.forEach((u) => {
        userIdToUser[u.id] = u;
    });
    const sortedUsers = userIds.map((userId) => userIdToUser[userId]);
    return sortedUsers;
});
exports.createUserLoader = createUserLoader;
//# sourceMappingURL=createUserLoader.js.map