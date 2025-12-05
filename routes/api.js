const express = require("express");
const router = express.Router();
const ApiController = require("../controllers/apiController");

router.get("/urunler/:id", ApiController.getProduct);
router.get("/kategoriler", ApiController.getCategories);
router.get("/kategori/:id", ApiController.getCategory);

module.exports = router;
