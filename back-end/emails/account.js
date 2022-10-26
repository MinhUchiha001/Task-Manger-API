const sgMail = require("@sendgrid/mail");
const API_KEY = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(API_KEY);

const sendWelcomeEmail = (email, name) => {
  const msg = {
    to: email,
    from: "minhsalamander09@gmail.com",
    subject: "Welcome to task manager",
    text: `Hi ${name}! Thanks for registering a new account. Wish you a great experience ahead`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Email sent"))
    .catch((e) => console.log(e.message));
};

const sendGoodbyeEmail = (email, name) => {
  const msg = {
    to: email,
    from: "minhsalamander09@gmail.com",
    subject: "Sorry to see you go!",
    text: `Hi ${name}! This email is sent to you upon your account cancellation. Please spare some time to tell use why you left`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Email sent"))
    .catch((e) => console.log(e.message));
};

module.exports = { sendWelcomeEmail, sendGoodbyeEmail };
