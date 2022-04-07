require("dotenv").config();
const { dbCon } = require("./../connection");
const crypto = require("crypto");
const { createJwtAccess } = require("../lib/jwt");

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
      let [userData] = await conn.query(sql, [result1.insertId]);
      //   buat token email verified dan token untuk akses
      //   kirim email
      //   kriim data user dan token akses untuk login
      conn.release();
      return res.status(200).send(userData[0]);
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
};
