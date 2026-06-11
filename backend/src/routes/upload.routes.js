const express = require("express");
const router = express.Router();
const path = require("path");
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// POST /api/v1/upload/image  →  sube una imagen y devuelve su URL pública
router.post(
  "/image",
  proteger,
  soloAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: "No se recibió ningún archivo" });
    }
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    return res.json({ ok: true, url, filename: req.file.filename });
  }
);

module.exports = router;
