const nodemailer = require("nodemailer");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
// Cấu hình transporter cho Nodemailer (dùng Gmail)
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendOTPEmail = (email, otp) => {
  const templatePath = path.join(__dirname, "../view/otp_view.html");
  let htmlContent = fs.readFileSync(templatePath, "utf-8");
  htmlContent = htmlContent.replace("{{otp}}", otp).replace("{{email}}", email);
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "OTP Reset Password",
    html: htmlContent,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
};

const sendMessageEmail = (to, subject, message) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text: message,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
};

module.exports = { sendOTPEmail, sendMessageEmail };
