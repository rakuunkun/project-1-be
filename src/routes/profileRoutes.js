const express = require("express");
const { verifyTokenAccess } = require("../lib/jwtVerify");
const Router = express.Router();
const { profileControllers } = require("./../controllers");
const {
  getProfile,
  editProfile,
  addProfilePhoto,
} = require("../controllers/profileControllers");
const upload = require("../lib/upload");

const uploader = upload("/profile", "PROFILE").fields([
  { name: "profilePic", maxCount: 1 },
]);

Router.get("/:username", getProfile);
Router.patch("/editProfile", verifyTokenAccess, editProfile);
Router.patch("/addPhotos", verifyTokenAccess, uploader, addProfilePhoto);
// Router.patch("/editProfile/:id", uploader, editProfile);

module.exports = Router;
