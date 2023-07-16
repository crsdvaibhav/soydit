import nodemailer from "nodemailer";
import "dotenv-safe/config";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILID+"@gmail.com", // generated ethereal user
      pass: process.env.PASSWORD, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'Soydit', // sender address
    to: to, // list of receivers
    subject: "Change password", // Subject line
    html,
  });

  console.log("Message sent: %s", info.messageId);
}

/**
Name	Norene Wilderman
Username	norene.wilderman2@ethereal.email (also works as a real inbound email address)
Password	ugWAtA5Xtp92KVk4mW
*/