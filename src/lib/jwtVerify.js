const jwt = require("jsonwebtoken");

module.exports = {
  verifyTokenAccess: async (req, res, next) => {
    // Mendapatkan token dari Frontend
    const authHeader = req.headers["authorization"];
    console.log("token kotor", authHeader);
    let token;
    console.log(authHeader); // `Bearer `
    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
      // ini bearer
      console.log("Token", token);
    } else {
      token = null;
    }
    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      console.log(decode);
      req.user = decode;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).send({ message: "User Unauthorized" });
    }
  },
  verifyTokenEmail: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    let token;
    console.log(authHeader);
    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
      console.log(token);
    } else {
      token = null;
    }
    // dekripsi
    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      req.user = decode;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).send({ message: "User unauthorized" });
    }
  },
};
