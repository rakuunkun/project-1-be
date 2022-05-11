const express = require("express");
const {
  getAllPost,
  postCaptionImage,
  deletePost,
  getUserPostDetail,
  editPostCaptionImage,
  addLikes,
  insertComments,
  getComments,
} = require("../controllers/postControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/jwtVerify");
const upload = require("../lib/upload");

// const uploaderPostImage = upload("/photos", "POST_IMAGE").fields([
//   { name: "image", maxCount: 1 },
// ]);
const uploader = upload("/photos", "PHOTO").single("image_url");

Router.get("/getpost", getAllPost);
Router.get("/getuserpostdetail/:postID", verifyTokenAccess, getUserPostDetail);
Router.get("/getcomments/:postID", verifyTokenAccess, getComments);
Router.post("/postcaptionimage", verifyTokenAccess, uploader, postCaptionImage);
Router.post("/addlikes/:postID", verifyTokenAccess, addLikes);
Router.post("/comments/:postID", verifyTokenAccess, insertComments);
Router.delete("/deletepost/:postID", verifyTokenAccess, deletePost);
Router.patch(
  "/editpostcaptionimage/:postID",
  verifyTokenAccess,
  editPostCaptionImage
);

module.exports = Router;
