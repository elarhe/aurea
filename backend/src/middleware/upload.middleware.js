const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = crypto.randomBytes(12).toString("hex") + ext;
    cb(null, nombre);
  },
});

const fileFilter = (req, file, cb) => {
  const permitidos = /jpeg|jpg|png|webp|gif|avif/;
  const extOk = permitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = permitidos.test(file.mimetype.split("/")[1]);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpg, png, webp, gif, avif)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
