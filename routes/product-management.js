const express = require("express");
const router = express.Router();
const productManagementController = require("../controllers/productManagementController");

router.get("/urunler", productManagementController.getProducts);

module.exports = router;
