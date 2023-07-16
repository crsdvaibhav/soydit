"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
require("dotenv-safe/config");
async function sendEmail(to, html) {
    let transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILID + "@gmail.com",
            pass: process.env.PASSWORD,
        },
    });
    let info = await transporter.sendMail({
        from: 'Soydit',
        to: to,
        subject: "Change password",
        html,
    });
    console.log("Message sent: %s", info.messageId);
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=sendEmail.js.map