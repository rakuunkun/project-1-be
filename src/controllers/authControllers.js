require("dotenv").config();
const { dbCon } = require("./../connection");
const crypto = require("crypto");
const myCache = require("./../lib/cache");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const { createJwtAccess, createJwtemail } = require("../lib/jwt");
const path = require("path");
const fs = require("fs");
const { versions } = require("process");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "seyfreak2@gmail.com",
    pass: "qhfelvpwzchpkrya",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
const hashPass = (password) => {
  let hashing = crypto
    .createHmac("sha256", "beanbeanbeanbean")
    .update(password)
    .digest("hex");
  return hashing;
};

module.exports = {
  // register
  register: async (req, res) => {
    // TODO
    // 1. Cek validasi password, hapus spasi
    // 2. Cek apakah email dan username sudah terdaftar atau belum
    // 3. Jika ada, throw error username atau email telah digunakan
    // 4. Jika belum ada, create data user ke tabel user yang sudah dibuat
    // 4a. sebelum diinput kedalam table password di hashing/bcrypt
    // 5. Pastikan isVerified = 0
    // 6. Get data user, buat token dr data user
    // 7. Kirim email verifikasi dengan waktu tertentu
    // 8. Jika langsung login
    // 9. Data user dan token kirim ke user
    let conn, sql;
    let { username, email, password, fullname, birthDate, profilePic, bio } =
      req.body;
    try {
      // buat connection dari pool karena query lebih dari satu kali
      conn = await dbCon.promise().getConnection();
      // validasi spasi untuk username

      let spasi = new RegExp(/ /g);
      if (spasi.test(username)) {
        // Jika ada spasi
        throw { message: "Tidak boleh mengandung spasi!" };
      }

      sql = `select id from users where username = ? or email = ?`;

      let [result] = await conn.query(sql, [username, email]);
      if (result.length) {
        //   masuk sini berarti ada username atua email yang sama
        throw { message: "Username atau email telah digunakan" };
      }
      sql = `INSERT INTO users set ?`;
      //   membuat object baru
      let insertData = {
        username,
        email,
        password: hashPass(password),
        fullname,
        birthDate,
        profilePic,
        bio,
      };
      console.log(insertData);
      let [result1] = await conn.query(sql, insertData);
      // get data user
      sql = `select id,username,isVerified,email,fullname,birthDate,profilePic,bio from users where id = ?`;
      let [userData] = await conn.query(sql, result1.insertId);
      //   buat token email verified dan token untuk akses
      //   kirim email
      let timecreated = new Date().getTime();
      const dataToken = {
        id: result1.insertId,
        username: insertData.username,
        timecreated,
      };

      let berhasil = myCache.set(result1.insertId, dataToken, 300);
      if (!berhasil) {
        throw { message: "error caching" };
      }
      //   buat token email verified dan token untuk akses
      const tokenAccess = createJwtAccess(dataToken);
      const tokenEmail = createJwtemail(dataToken);
      const host =
        process.env.NODE_ENV === "production"
          ? "http://namadomain.com"
          : "http://localhost:3000";
      const link = `${host}/verified/${tokenEmail}`;

      let filepath = path.resolve(
        __dirname,
        "../templates/verificationTemplate.html"
      );

      let htmlString = fs.readFileSync(filepath, "utf-8");

      const template = handlebars.compile(htmlString);

      const htmlToEmail = template({ username: insertData.username, link });

      //   kirim email
      transporter.sendMail({
        from: "Biji <seyfreak2@gmail.com>",
        to: insertData.email, //email usernya
        subject: "Verify it's you!",
        // html : htmlToEmail,
        html: htmlToEmail,
      });
      //   kriim data user dan token akses lagi untuk login
      res.set("x-token-access", tokenAccess);
      return res.status(200).send({ message: "success" });
      //   kriim data user dan token akses untuk login
      // conn.release();
      // return res.status(200).send(userData[0]);
    } catch (error) {
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  // login
  // 1. bisa login username atau email
  // 2. enkripsi password
  // 3. get data user dengan username atau email dan password
  // 4. jika user ada, kirim token access dan data user

  login: async (req, res) => {
    let { username, email, password } = req.body;
    let conn, sql;
    console.log(req.body);
    try {
      // create connection in pool
      conn = await dbCon.promise().getConnection();
      // hashing password
      password = hashPass(password);
      // fullname,birthDate,profilePic,bio
      sql = `select id,username,isVerified,email from users where (username = ? or email = ?) and password = ?`;
      let [result] = await conn.query(sql, [username, email, password]);
      console.log(result);
      if (!result.length) {
        // user tidak ditemukan atau password tidak match
        console.log("tes");
        throw { message: "Username atau password salah!" };
      }
      // buat token access
      let dataToken = {
        id: result[0].id,
        username: result[0].username,
        //role_id masukkan
      };
      let tokenAccess = createJwtAccess(dataToken);
      // query cart

      conn.release();
      // send token by headers
      res.set("x-token-access", tokenAccess);
      console.log(tokenAccess);
      return res.status(200).send(result[0]);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  keeplogin: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise();
      sql = `select * from users where id = ?`;
      let [result] = await conn.query(sql, [id]);
      return res.status(200).send(result[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  accountVerified: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      // sql trnasaction initialisasi atau checkpoint feature sql transaction
      // biasanya sql transaction ini digunakan pada saat manipulasi data
      await conn.beginTransaction();
      // ngecek user sudah verified atau belum
      sql = `select id from users where id = ? and isVerified = 1`;
      let [userVerified] = await conn.query(sql, [id]);
      console.log(req.user);
      if (userVerified.length) {
        // user sudah verified
        throw { message: "udah verified woy nggak usah diklik lagi " };
      }
      sql = `update users set ? where id = ?`;
      let updateData = {
        isVerified: 1,
      };
      await conn.query(sql, [updateData, id]);
      sql = `select id,username,isVerified,email from users where id = ?`;
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
  sendEmailVerified: async (req, res) => {
    const { id, email, username } = req.body;
    try {
      //  create something/value unique
      let timecreated = new Date().getTime();
      const dataToken = {
        id: id,
        username: username,
        timecreated,
      };
      // use node cache
      let berhasil = myCache.set(id, dataToken, 5 * 60);
      if (!berhasil) {
        throw { message: "error caching" };
      }

      const tokenEmail = createJwtemail(dataToken);
      //?kirim email verifikasi
      const host =
        process.env.NODE_ENV === "production"
          ? "http://namadomainfe"
          : "http://localhost:3000";
      const link = `${host}/verified/${tokenEmail}`;
      // cari path email template
      let filepath = path.resolve(__dirname, "../template/emailTemplate.html");
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");
      console.log(htmlString);
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: username,
        link,
      });
      console.log(htmlToEmail);
      await transporter.sendMail({
        from: "Hokage <dinotestes12@gmail.com>",
        to: email,
        // to: `dinopwdk@gmail.com`,
        subject: "tolong verifikasi tugas grade A ujian chunin",
        html: htmlToEmail,
      });
      return res.status(200).send({ message: "berhasil kirim email lagi99x" });
    } catch (error) {
      console.log(error);
      return res.status(200).send({ message: error.message || error });
    }
  },
};
