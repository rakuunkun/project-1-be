const multer = require("multer");
const fs = require("fs");

const upload = (destination, fileNamePrefix) => {
  const defaultPath = "./public";
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("line 15 isi file : ", file);
      const dir = defaultPath + destination;
      if (fs.existsSync(dir)) {
        // mengecek ketersediaan directory
        console.log(dir, "exist");
        cb(null, dir);
      } else {
        fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
        console.log(dir, "make");
      }
    },
    filename: function (req, file, cb) {
      let originalName = file.originalname; // berisi nama file yang dikirim dari user
      let ext = originalName.split(".");
      let filename = fileNamePrefix + Date.now() + "." + ext[ext.length - 1];
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    // tambahkan extention yang mau di upload jika tidak ada disini
    const ext = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xlsx|JPEG|JPG)$/; //regex
    if (!file.originalname.match(ext)) {
      return cb(new Error("Only selected file type are allowed"), false);
    }
    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, //2mb
    },
  });
};

module.exports = upload;
