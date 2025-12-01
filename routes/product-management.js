const express = require("express");
const router = express.Router();
const productManagementController = require("../controllers/productManagementController");
const upload = require("../middlewares/upload");

router.get("/urunler", productManagementController.getProducts);
router.get("/urunler/search", productManagementController.ajaxSearchProducts);

router.post(
  "/yeni-urun",
  upload.single("urun_resmi"),
  productManagementController.postAddProduct
);
router.get("/yeni-urun", productManagementController.getAddProduct);

router.get("/kategoriler", productManagementController.getCategories);
router.post("/kategoriler/ekle", productManagementController.postAddCategory);
router.get(
  "/kategoriler/sil/:id",
  productManagementController.getDeleteCategory
);

module.exports = router;
