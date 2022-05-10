const { dbCon } = require("../connection");
const fs = require("fs");

module.exports = {
  getProfile: async (req, res) => {
    let { username } = req.params;
    let conn = await dbCon.promise().getConnection();

    try {
      let sql = `select username,fullname,birthDate,profilePic, bio from users where username = ?`;
      let [profile] = await conn.query(sql, [username]);
      // console.log(username);
      conn.release();
      return res.status(200).send(profile[0]);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  editProfile: async (req, res) => {
    const { fullname, username, bio } = req.body;
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select id from users where username = ?`;
      let [usernameMatch] = await conn.query(sql, [username]);
      console.log(req.user);
      if (usernameMatch.length) {
        throw { message: "Username has already been used" };
      }

      sql = `update users set ? where id = ?`;
      let updateData = {
        fullname: fullname,
        username: username,
        bio: bio,
      };
      await conn.query(sql, [updateData, id]);
      sql = `select * from users where id = ?`;
      let [result] = await conn.query(sql, [id]);
      await conn.commit();
      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  addProfilePhoto: async (req, res) => {
    const { id } = req.user;
    console.log("ini req.file profilePic", req.file);
    let path = "/photos";

    const imagePath = req.file ? `${path}/${req.file.filename}` : null;
    console.log(imagePath);
    if (!imagePath) {
      return res.status(500).send({ message: "foto tidak ada" });
    }
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `update users set ? where id = ?`;
      let updateData = {
        profile_picture: imagePath,
      };
      await conn.query(sql, [updateData, id]);

      sql = `select profilePic from users where id = ?`;
      let [result] = await conn.query(sql, id);
      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  // editProfile: async (req, res) => {
  //   console.log("ini req.files", req.files);
  //   let path = "/profile";
  //   const data = JSON.parse(req.body.data);

  //   const { profilePic } = req.files;
  //   const imagePath = profilePic ? `${path}/${profilePic[0].filename}` : null;

  //   const { id } = req.params;
  //   let conn, sql;
  //   try {
  //     conn = dbCon.promise();
  //     console.log(data);
  //     // menolak yang mengandung di bawah
  //     if (req.body.profilePic) {
  //       throw { message: "Tidak boleh upload foto menggunakan link" };
  //     }

  //     let restrictedData = [
  //       "id",
  //       "password",
  //       "email",
  //       "isVerified",
  //       "profilePic",
  //     ];
  //     for (let i = 0; i < restrictedData.length; i++) {
  //       if (data[restrictedData[i]]) {
  //         throw { message: "tidak boleh mengganti email" };
  //       }
  //     }
  //     if (imagePath) {
  //       data.profilePic = imagePath;
  //     }

  //     if (data.username) {
  //       // menghindari username sama
  //       let spasi = new RegExp(/ /g);
  //       if (spasi.test(data.username)) {
  //         // Jika ada spasi
  //         throw { message: "Tidak boleh mengandung spasi!" };
  //       }
  //       sql = `select id from users where username = ?`;
  //       let [result1] = await conn.query(sql, [data.username]);
  //       if (result1.length) {
  //         //   masuk sini berarti ada username atua email yang sama
  //         throw { message: "Username telah digunakan" };
  //       }
  //     }
  //     sql = `select * from users where id = ?`;
  //     let [result] = await conn.query(sql, [id]);
  //     if (!result.length) {
  //       throw { message: "id tidak ditemukan" };
  //     }

  //     sql = `update users set ? where id = ?`;
  //     await conn.query(sql, [data, id]);
  //     if (imagePath) {
  //       // klo image baru ada maka hapus image lama
  //       if (result[0].profilePic) {
  //         fs.unlinkSync("./public" + result[0].profilePic);
  //       }
  //     }
  //     return res.status(200).send({ message: "berhasil edit profil" });
  //   } catch (error) {
  //     if (imagePath) {
  //       fs.unlinkSync("./public" + imagePath);
  //     }
  //     console.log(error);
  //     return res.status(500).send({ message: error.message || error });
  //   }
  // },
};
