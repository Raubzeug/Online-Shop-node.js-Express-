const express = require("express");
const { check, body } = require("express-validator/check");

const userControllers = require("../controllers-mongo/user");
const isAuth = require("../middleware/is-auth");

const User = require("../models-mongo/user");

const router = express.Router();

router.get("/login", userControllers.getLogin);
router.post("/login", userControllers.postLogin);

router.post(
  "/logout",
  [check("email").normalizeEmail(), check("password").trim()],
  isAuth,
  userControllers.postLogout
);

router.get("/signup", userControllers.getSignup);
router.post(
  "/signup",
  [
    check("email").isEmail().withMessage("Please enter a valid email"),
    check("email")
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("User with email already exists");
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter password only numbers and letters minimum length 3 chars"
    )
      .isLength({ min: 3 })
      .isAlphanumeric()
      .trim(),
    body("passwordConfirm")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match!");
        }
        return true;
      })
      .trim(),
  ],
  userControllers.postSignup
);

router.get("/reset-password", userControllers.getResetPassword);
router.post("/reset-password", userControllers.postResetPassword);

router.get("/reset-password/:token", userControllers.getSetNewPassword);
router.post("/set-new-password", userControllers.postSetNewPassword);

module.exports = router;
