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
      sql = `select users.username, users.profilePic, posts.image_url, posts.caption from users join posts on posts.user_ID = users.id   `;
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

      //   //Likes count
      //   sql = `select count(*) likes_count from likes where post_id = ?`;
      //   for (let i = 0; i < result.length; i++) {
      //     const element = result[i];
      //     const [resultLikes] = await conn.query(sql, element.postID);
      //     result[i] = { ...result[i], likes: resultLikes[0].likes_count };
      //   }

      //   //Already liked
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
      let sql = `select users.username, users.profilePic, posts.image_url, posts.caption from users join posts on posts.user_ID = users.id   `;
      let [result] = await conn.query(sql, postID);
      if (!result.length) {
        throw { message: "Post not found" };
      }
      //lalu delete
      sql = `delete from image_url where posts_id = ?`;
      await conn.query(sql, postID);

      sql = `delete from posts where id = ?`;
      await conn.query(sql, postID);

      sql = `select users.username, users.profilePic, posts.image_url, posts.caption from users join posts on posts.user_ID = users.id   `;
      let [posts] = await conn.query(sql);
      conn.release();
      conn.commit();
      return res.status(200).send(posts);
    } catch (error) {
      conn.release();
      conn.rollback();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  editPostCaptionImage: async (req, res) => {
    console.log("ini body", req.body.data);
    let path = "/photos";
    const data = JSON.parse(req.body.data);
    const { image } = req.files;
    const imagePath = image
      ? image.map((val) => {
          return `${path}/${val.filename}`;
        })
      : [];

    let updateData = { ...data };
    console.log(updateData);

    const { postID } = req.params;

    let conn, sql;
    try {
      console.log(req.params, "ini req.params");
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      // get datanya nya dahulu
      sql = `select users.username, users.profilePic, posts.image_url, posts.caption from users join posts on posts.user_ID = users.id   `;
      let [result] = await conn.query(sql, [postID]);
      if (!result.length) {
        throw { message: "Post not found" };
      }
      // update data
      sql = `Update post set ? where id = ?`;

      // tanda tanya untuk set harus object
      await conn.query(sql, [data, postID]);
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

      sql = `delete from image_url where posts_id = ?`;
      await conn.query(sql, postID);

      // sql = `Update post_image set ? where post_id = ?`;
      sql = `insert into image_url set ?`;
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
      sql = `select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
      let [result1] = await conn.query(sql, [postID]);

      sql = `select id, image from post_image where post_id = ?`;

      //   for (let i = 0; i < result1.length; i++) {
      //     const element = result1[i];
      //     const [resultImage] = await conn.query(sql, element.postID);
      //     console.log("ini resultImage", resultImage);
      //     result1[i] = { ...result1[i], photos: resultImage };
      //   }
      //   console.log(result1);
      conn.release();
      conn.commit();
      return res.send(result1);
    } catch (error) {
      // if (imagePath) {
      //   fs.unlinkSync("./public" + imagePath);
      // }
      console.log(error);
      conn.release();
      conn.rollback();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
