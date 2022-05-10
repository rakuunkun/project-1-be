const { dbCon } = require("./../connection");
const fs = require("fs");
const db = require("../connection/mysqldb");
// const moment = require("moment");

module.exports = {
  postCaptionImage: async (req, res) => {
    console.log("ini body", req.body.data);
    let path = "/photos";
    const data = JSON.parse(req.body.data);
    const { id } = req.user;
    const imagePath = req.file ? `${path}/${req.file.filename}` : null;

    let insertData = { ...data, user_id: id, image_url: imagePath };
    console.log(insertData);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();
      sql = `insert into posts set ?`;
      await conn.query(sql, insertData);
      sql = `select * from posts`;
      let [result2] = await conn.query(sql);
      conn.release();
      conn.commit();
      return res.status(200).send(result2);
    } catch (error) {
      conn.release();
      conn.rollback();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getAllPost: async (req, res) => {
    // const { id } = req.user
    // let { page, limit } = req.query;
    // // initialize offSet limit
    // if (!page) {
    //   page = 0;
    // }
    // if (!limit) {
    //   limit = 10;
    // }
    // let offset = page * limit;

    // // jadiin INT
    // limit = parseInt(limit);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      sql = `select users.username, users.profilePic, users.id, posts.image_url, posts.caption, posts.id as postID, posts.created_at from users join posts on posts.user_ID = users.id order by posts.created_at desc`;
      // ${dbCon.escape(
      //     offset
      //   )}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql);

      //   sql = `select updated_at from posts where postID = ?`;
      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultDate] = await conn.query(sql, element.postID);
      //     result[i] = {
      //       ...result[i],
      //       fromnow: moment(resultDate[0].updated_at).fromNow(),
      //     };
      //   }

      //Photo
      //   sql = `select id, image from post_image where post_id = ?`;

      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultImage] = await conn.query(sql, element.postID);
      //     result[i] = { ...result[i], photos: resultImage };
      //   }

      //Likes count
      sql = `select count(*) likes_count from likes where posts_id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [resultLikes] = await conn.query(sql, element.postID);
        result[i] = { ...result[i], likes: resultLikes[0].likes_count };
      }

      //Already liked
      sql = `select posts.id postID, posts.user_id post_U_ID, posts.caption, if(likes.id is null, 0 ,1) as already_liked
            from posts
            left join likes on likes.posts_id = posts.id
            where posts.user_id = ? and posts.id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [resultHadLiked] = await conn.query(sql, [
          element.id,
          element.postID,
        ]);
        result[i] = {
          ...result[i],
          alreadyliked: resultHadLiked[0].already_liked,
        };
      }

      //   //Comments
      //   sql = `SELECT count(comment) as comments FROM post_comment where post_id = ?`;
      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultComments] = await conn.query(sql, element.postID);
      //     result[i] = { ...result[i], comments: resultComments[0].comments };
      //   }

      //   sql = `SELECT COUNT(*) as total_posts FROM post`;
      //   let [totalPosts] = await conn.query(sql);

      //   // console.log("ini result", result)

      //   res.set("x-total-count", totalPosts[0].total_posts);

      conn.release();
      conn.commit();
      return res.status(200).send(result);
    } catch (error) {
      console.log(error);
      conn.release();
      conn.rollback();
      return res.status(500).send({ message: error.message || error });
    }
  },
  deletePost: async (req, res) => {
    let { postID } = req.params;

    postID = parseInt(postID);

    let conn = await dbCon.promise().getConnection();
    try {
      console.log("this is post id", postID);
      // jika pake connection jangan lupa di release
      await conn.beginTransaction();
      // get data dulu
      let sql = `select users.username, users.profilePic, posts.image_url, posts.caption, posts.id from users join posts on posts.user_ID = users.id where posts.id = ? `;
      let [result] = await conn.query(sql, postID);
      if (!result.length) {
        throw { message: "Post not found" };
      }
      sql = `delete from posts where id = ?`;
      await conn.query(sql, postID);

      //   let [posts] = await conn.query(sql);
      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "berhasil delete" });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  editPostCaptionImage: async (req, res) => {
    // console.log("ini body", req.body.data);
    // const data = JSON.parse(req.body.data);

    // let updateData = { ...data };
    // console.log(updateData);

    const { caption } = req.body;
    let updateCaption = { caption: caption };

    let { postID } = req.params;
    postID = parseInt(postID);

    let conn, sql;
    try {
      console.log(req.params, "ini req.params");
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      // get datanya nya dahulu
      sql = `select users.username, users.profilePic, posts.image_url, posts.caption, posts.id from users join posts on posts.user_ID = users.id where posts.id = ?   `;
      let [result] = await conn.query(sql, [postID]);
      if (!result.length) {
        throw { message: "Post not found" };
      }
      // update data
      sql = `Update posts set ? where id = ?`;

      // tanda tanya untuk set harus object
      await conn.query(sql, [updateCaption, postID]);
      // setelah update hapus image
      //   if (imagePath) {
      //     // klo image baru ada maka hapus image lama
      //     if (result[0].photos) {
      //       for (let i = 0; i < result[0].photos.length; i++) {
      //         const element = result[0].photos[i];
      //         fs.unlinkSync("./public" + element);
      //       }
      //     }
      //     console.log(imagePath);
      //   }

      //   sql = `delete from image_url where posts_id = ?`;
      //   await conn.query(sql, postID);

      // sql = `Update post_image set ? where post_id = ?`;
      //   sql = `insert into image_url set ?`;
      // for (let i = 0; i < imagePath.length; i++) {
      //   let val = imagePath[i];
      //   let updateDataImage = {
      //     image: val,
      //   };
      //   await conn.query(sql, [updateDataImage, postID]);
      // }
      //   for (let i = 0; i < imagePath.length; i++) {
      //     let val = imagePath[i];
      //     let insertDataImage = {
      //       image: val,
      //       post_id: postID,
      //     };
      //     await conn.query(sql, insertDataImage);
      //   }
      //GET DATA POST LAGI
      sql = `select users.username, users.profilePic, posts.image_url, posts.caption, posts.id from users join posts on posts.user_ID = users.id where posts.id = ?`;
      let [result1] = await conn.query(sql, [postID]);

      //   sql = `select id, image from post_image where post_id = ?`;

      //   for (let i = 0; i < result1.length; i++) {
      //     const element = result1[i];
      //     const [resultImage] = await conn.query(sql, element.postID);
      //     console.log("ini resultImage", resultImage);
      //     result1[i] = { ...result1[i], photos: resultImage };
      //   }
      //   console.log(result1);
      await conn.commit();
      conn.release();
      return res.send(result1);
    } catch (error) {
      // if (imagePath) {
      //   fs.unlinkSync("./public" + imagePath);
      // }
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getUserPostDetail: async (req, res) => {
    const { postID } = req.params;
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      let sql = `select users.username, users.profilePic, posts.image_url, posts.caption, posts.id from users join posts on posts.user_ID = users.id where posts.id = ?`;
      let [result] = await conn.query(sql, postID);

      //   sql = `select id, image from posts.image_url where post_id = ?`;

      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultImage] = await conn.query(sql, element.postID);
      //     console.log("ini resultImage", resultImage);
      //     result[i] = { ...result[i], photos: resultImage };
      //   }

      //   sql = `select count(*) likes_count from likes where post_id = ?`;
      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultLikes] = await conn.query(sql, element.postID);
      //     console.log("ini resultLikes", resultLikes);
      //     result[i] = { ...result[i], likes: resultLikes[0].likes_count };
      //   }

      //   sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
      //   from post
      //   left join likes on likes.post_id = post.id
      //   where post.user_id = ? and post.id = ?`;
      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultHadLiked] = await conn.query(sql, [
      //       element.userID,
      //       element.postID,
      //     ]);
      //     result[i] = {
      //       ...result[i],
      //       alreadyliked: resultHadLiked[0].already_liked,
      //     };
      //   }

      console.log("ini result", result);

      conn.release();
      conn.commit();
      return res.status(200).send(result);
    } catch (error) {
      console.log(error);
      conn.release();
      conn.rollback();
      return res.status(500).send({ message: error.message || error });
    }
  },
  insertComments: async (req, res) => {
    const { id } = req.user;
    let { postID } = req.params;
    postID = parseInt(postID);
    const { comment } = req.body;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `insert into comments set ?`;
      let insertComment = {
        comment: comment,
        user_id: id,
        posts_id: postID,
      };
      await conn.query(sql, [insertComment]);

      sql = `select * from comments`;
      let [commentsAll] = await conn.query(sql);
      conn.release();
      return res.status(200).send(commentsAll);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message });
    }
  },

  getComments: async (req, res) => {
    let { postID } = req.params;
    postID = parseInt(postID);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      sql = `select comments.id, comments.comment, comments.posts_id, comments.user_id, comments.created_at, users.username, users.profilePic from comments
      join users on users.id = comments.user_id
      where comments.posts_id = ?
      order by comments.created_at desc`;
      let [commentPost] = await conn.query(sql, postID);

      await conn.commit();
      conn.release();
      return res.status(200).send(commentPost);
    } catch (error) {
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message });
    }
  },
  addLikes: async (req, res) => {
    const { id } = req.user;
    let { postID } = req.params;
    postID = parseInt(postID);
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select * from likes where user_id = ? and posts_id = ?`;
      let [result0] = await conn.query(sql, [id, postID]);

      if (result0.length >= 1) {
        sql = `delete from likes where user_id = ? and posts_id = ?`;
        await conn.query(sql, [id, postID]);
        console.log("unlike");
        await conn.commit();
        conn.release();
        return res.status(200).send({ message: "unlike" });
      }

      sql = `insert into likes set ?`;
      let insertLikeData = {
        user_id: id,
        posts_id: postID,
      };
      await conn.query(sql, insertLikeData);

      sql = `select * from likes where user_id = ?`;
      let [result] = await conn.query(sql, id);
      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "like" });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: "error brodie" });
    }
  },
};
