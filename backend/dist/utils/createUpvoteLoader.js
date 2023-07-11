"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpvoteLoader = void 0;
const Upvote_1 = require("../entities/Upvote");
const dataloader_1 = __importDefault(require("dataloader"));
const createUpvoteLoader = () => new dataloader_1.default(async (keys) => {
    const upvote = await Upvote_1.Upvote.find({ keys });
    const upvoteIdsToUpvote = {};
    upvote.forEach((updoot) => {
        upvoteIdsToUpvote[`${updoot.userId}|${updoot.postId}`] = updoot;
    });
    return keys.map((key) => upvoteIdsToUpvote[`${key.userId}|${key.postId}`]);
});
exports.createUpvoteLoader = createUpvoteLoader;
//# sourceMappingURL=createUpvoteLoader.js.map