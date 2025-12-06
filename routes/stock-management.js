const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockManagementController");

router.get("/stok-durumu", stockController.getStockStatus);
router.post("/stok-durumu/stok-ekle/:id", stockController.postStockStatAdd);
router.post("/stok-durumu/stok-sil/:id", stockController.postStockStatDecrease);
router.get("/stok-durumu/search", stockController.getStockStatusAjax);

router.get("/stok-girisi", stockController.getStockAdd);
router.get("/stok-cikisi", stockController.getStockRemove);
router.get("/hareketler", stockController.getStockLogs);

module.exports = router;
