const express = require("express");
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/jwtVerify");
const Router = express.Router();
const { authControllers } = require("./../controllers");
const { register, login, keeplogin, accountVerified } = authControllers;
const verifyLastToken = require("./../lib/verifyLastToken");

Router.post("/register", register);
Router.post("/login", login);
Router.get("/keeplogin", verifyTokenAccess, keeplogin);
Router.post("/verified", accountVerified);
Router.get("/verified", verifyTokenEmail, verifyLastToken, accountVerified);

module.exports = Router;
