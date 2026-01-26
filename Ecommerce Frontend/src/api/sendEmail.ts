"use server"
import nodemailer from "nodemailer";

// async function sendWithSendGrid({
// to,
// subject,
// text,
// html,
// }: {
// to: string;
// subject: string;
// text: string;
// html: string;
// }) {
// const BASE_URL = 'https://api.sendgrid.com';
// try {
// const isValidEmail = /\S+@\S+\.\S+/.test(to);
// if (!isValidEmail) {
// console.error('Invalid email address : ' + to);
// return;
// }
// const emailData = {
// personalizations: [
// {
// to: [{ email: to }],
// },
// ],
// from: {
// email: process.env.USER_MAIL,
// name: 'Dar Iwen', //
// },
// subject,
// content: [
// {
// type: 'text/plain',
// value: text,
// },
// {
// type: 'text/html',
// value: html,
// },
// ],
// };

// await axios.post(`${BASE_URL}/v3/mail/send`, emailData, {
// headers: {
// Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
// 'Content-Type': 'application/json',
// },
// });
// Logger.log('Email sent to ' + to);
// } catch (error) {
// if (axios.isAxiosError(error)) {
// Logger.error(error.response?.data);
// } else {
// Logger.error('Error sending email:' + error);
// }
// }
// }

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  await sendMailWithNodeMailer({ to, subject, text, html });
}

async function sendMailWithNodeMailer({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: "us2.smtp.mailhostbox.com",
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `Sfari Jouets <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent:" + info.messageId);
  } catch (error) {
    console.error("Error sending email:" + error);
  }
}
