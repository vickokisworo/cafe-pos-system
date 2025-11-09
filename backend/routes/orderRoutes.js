const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// All order routes require authentication
router.use(authMiddleware);

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/stats", orderController.getOrderStats);
router.get("/:id", orderController.getOrder);

module.exports = router;
