const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockManagementController");

router.get("/stok-durumu", stockController.getStockStatus);

module.exports = router;
