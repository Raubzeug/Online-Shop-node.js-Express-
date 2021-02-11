const path = require("path");
const bcrypt = require("bcryptjs");

const crypto = require("crypto");

const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const { validationResult } = require("express-validator/check");

const User = require("../models-mongo/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  const message = req.flash("error");
  let toShow = null;
  if (message.length > 0) {
    toShow = message[0];
  }
  res.render(path.join("user", "login"), {
    pageTitle: "login",
    path: "/login",
    error: toShow,
    errorEmail: false,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.render(path.join("user", "login"), {
          pageTitle: "login",
          path: "/login",
          error: "Wrong email!",
          errorEmail: true,
        });
      }
      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (!doMatch) {
            req.flash("error", "Wrong password!");
            return res.status(422).render(path.join("user", "login"), {
              pageTitle: "Signup",
              path: "/signup",
              error: "Wrong password!",
              oldInput: { email: email },
              errorPass: true,
            });
          }
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            if (err) {
              return next(err);
            }
            return res.redirect("/");
          });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => next(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect("/"));
};

exports.getSignup = (req, res, next) => {
  const message = req.flash("error");
  let toShow = null;
  if (message.length > 0) {
    toShow = message[0];
  }
  res.render(path.join("user", "signup"), {
    pageTitle: "Signup",
    path: "/signup",
    error: toShow,
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render(path.join("user", "signup"), {
      pageTitle: "Signup",
      path: "/signup",
      error: errors
        .array()
        .map((err) => err.msg)
        .join("; "),
      oldInput: { email: email },
      errorEmail: errors.array().find((e) => e.param === "email"),
      errorPass: errors.array().find((e) => e.param === "password"),
      errorPassConf: errors.array().find((e) => e.param === "passwordConfirm"),
    });
  }
  return bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "elena.v.makarova@gmail.com",
        subject: "Registration sucessful",
        html: "<h1>You registered sucessfully!</h1>",
      });
    })
    .catch((err) => next(err));
};

exports.getResetPassword = (req, res, next) => {
  const message = req.flash("error");
  let toShow = null;
  if (message.length > 0) {
    toShow = message[0];
  }
  res.render(path.join("user", "reset"), {
    pageTitle: "Reset password",
    path: "/reset-password",
    error: toShow,
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return next(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "User with this email doesn't exists");
          return res.redirect("/reset-password");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        user.save();
      })
      .then((user) => {
        res.redirect("/");
        return transporter.sendMail({
          to: email,
          from: "elena.v.makarova@gmail.com",
          subject: "Reset password requested",
          html: `<p>You requested password reset.</p>
          <p>Click a <a href ="http://localhost:3000/reset-password/${token}">link to set a new password </p>`,
        });
      })
      .catch((err) => next(err));
  });
};

exports.getSetNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Token is invalid");
        return res.redirect("/reset-password");
      }
      const message = req.flash("error");
      let toShow = null;
      if (message.length > 0) {
        toShow = message[0];
      }
      res.render(path.join("user", "set-new-password"), {
        pageTitle: "Set new password",
        path: "/set-new-password",
        error: toShow,
        userId: user._id.toString(),
        token: token,
      });
    })
    .catch((err) => next(err));
};

exports.postSetNewPassword = (req, res, next) => {
  const id = req.body.userId;
  const password = req.body.password;
  const token = req.body.token;
  User.findOne({
    _id: id,
    resetToken: token,
    resetTokenExpiration: { $gte: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "No user found in database");
        return res.redirect("/reset-password");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .then(() => {
          res.redirect("/login");
          return transporter.sendMail({
            to: user.email,
            from: "elena.v.makarova@gmail.com",
            subject: "Your password has been changed",
            html: "<h1>Your password has been changed!</h1>",
          });
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));
};
