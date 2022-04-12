const express = require("express");
// const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const { profileControllers } = require("./../controllers");
const { getProfile, editProfile } = profileControllers;
const upload = require("../lib/upload");

const uploader = upload("/profile", "PROFILE").fields([
  { name: "profilePic", maxCount: 1 },
]);

Router.get("/:username", getProfile);
Router.patch("/editProfile/:id", uploader, editProfile);
// verifyTokenAccess

module.exports = Router;