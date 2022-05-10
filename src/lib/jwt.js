const jwt = require("jsonwebtoken");

module.exports = {
  createJwtAccess: (data) => {
    //   create access token (2hrs)
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "24h" });
  },
  createJwtemail: (data) => {
    //   create email token (5mins)
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "5m" });
  },
};
