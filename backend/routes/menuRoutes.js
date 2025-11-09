const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes (can access menu without auth for display)
router.get("/", menuController.getAllMenu);
router.get("/:id", menuController.getMenuItem);

// Protected routes (require authentication)
router.post("/", authMiddleware, menuController.createMenuItem);
router.put("/:id", authMiddleware, menuController.updateMenuItem);
router.delete("/:id", authMiddleware, menuController.deleteMenuItem);

module.exports = router;
