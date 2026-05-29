const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/reviews.controller");

router.get("/:productId/reviews", ctrl.listarPorProducto);
router.post("/", proteger, ctrl.crear);
router.patch("/:id/approve", proteger, soloAdmin, ctrl.aprobar);
router.patch("/:id/reject", proteger, soloAdmin, ctrl.rechazar);
router.patch("/:id/reply", proteger, soloAdmin, ctrl.responder);
router.delete("/:id", proteger, soloAdmin, ctrl.eliminar);

module.exports = router;
