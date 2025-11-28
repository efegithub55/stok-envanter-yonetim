const express = require("express");
const router = express.Router();
const productManagementController = require("../controllers/productManagementController");

router.get("/urunler", productManagementController.getProducts);
router.get("/urunler/search", productManagementController.ajaxSearchProducts);

router.get("/yeni-urun", productManagementController.getAddProduct);
router.get("/kategoriler", productManagementController.getCategories);

module.exports = router;
