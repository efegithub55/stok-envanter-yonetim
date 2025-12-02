const Product = require("../models/Product");
const Category = require("../models/Category");
const Units = require("../models/Units");
const Logs = require("../models/Logs");

exports.getProducts = async (req, res) => {
  const categoryStats = await Category.getCategoryStats();
  const totalProductData = await Product.getAllProducts();
  const totalProduct = totalProductData.length;
  const groups = await Product.getStockGroup();

  const page = req.query.page || 1;
  const limit = req.query.limit || 20;

  let selectedCategories = req.query.categories || [];
  if (selectedCategories && !Array.isArray(selectedCategories)) {
    selectedCategories = [selectedCategories];
  }

  let selectedStock = req.query.stock || [];
  if (selectedStock && !Array.isArray(selectedStock)) {
    selectedStock = [selectedStock];
  }

  const minPrice = req.query.minPrice ?? "";
  const maxPrice = req.query.maxPrice ?? "";
  const sort = req.query.sort || "newest";
  const productSearch = req.query.productSearch || "";

  const {
    products,
    total,
    page: currentPage,
    perPage,
    totalPages,
  } = await Product.getPaginated(
    page,
    limit,
    selectedCategories,
    selectedStock,
    minPrice,
    maxPrice,
    sort,
    productSearch
  );

  let startIndex = 0;
  let endIndex = 0;

  if (perPage === "all") {
    startIndex = total > 0 ? 1 : 0;
    endIndex = total;
  } else {
    startIndex = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    endIndex = Math.min(currentPage * perPage, total);
  }

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  res.render("urun-yonetimi/urunler", {
    groups,
    products,
    categoryStats,
    selectedCategories,
    selectedStock,
    minPrice,
    maxPrice,
    productSearch,
    totalProduct,
    sort,
    pagination: {
      total,
      currentPage,
      perPage,
      totalPages,
      startIndex,
      endIndex,
      pages,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
    },
  });
};

exports.getAddProduct = async (req, res) => {
  const categories = await Category.getAllCategories();
  const units = await Units.getUnits();
  res.render("urun-yonetimi/urun-ekle", { categories, units });
};

exports.postAddProduct = async (req, res) => {
  try {
    const { file } = req;
    const body = req.body;

    // Dosya geldiyse resim_url oluştur
    let resim_url = null;
    if (file) {
      // Örn: /uploads/products/product-123123123.jpg
      resim_url = `/assets/products/${file.filename}`;
    }

    const data = {
      urun_adi: body.urun_adi,
      kategori_id: body.kategori_id,
      barkod: body.barkod,
      sku: body.sku,
      aciklama: body.aciklama,
      mevcut_stok: body.mevcut_stok,
      min_stok: body.min_stok,
      max_stok: body.max_stok,
      birim_id: body.birim_id,
      alis_fiyati: body.alis_fiyati,
      satis_fiyati: body.satis_fiyati,
      kdv: body.kdv,
      tedarikci: body.tedarikci,
      raf_konumu: body.raf_konumu,
      garanti: body.garanti,
      son_kullanma_tarihi: body.son_kullanma_tarihi,
      urun_link: body.urun_link,
      resim_url,
    };

    const addProcess = await Product.addProduct(data);

    if (addProcess) {
      console.log("Ürün ekleme işlemi başarılı");
    } else {
      console.log("Ürün ekleme işlemi başarısız");
    }

    res.redirect("/urun-yonetimi/yeni-urun");
  } catch (err) {
    console.error("Ürün ekleme hatası:", err);
    res.redirect("/urun-yonetimi/yeni-urun");
  }
};

exports.getCategories = async (req, res) => {
  const mostMovement = await Logs.getMostMovement();
  const lastAdded = await Category.getLastAdded();
  const totalProduct = await Product.getAllProducts();
  const totalCategory = await Category.getAllCategories();
  res.render("urun-yonetimi/kategoriler", {
    mostMovement,
    lastAdded,
    totalProduct: totalProduct.length,
    totalCategory: totalCategory.length,
    categories: totalCategory,
  });
};

exports.postAddCategory = async (req, res) => {
  const { kategori_adi, aciklama } = req.body;
  await Category.addCategory(kategori_adi, aciklama);
  res.redirect("/urun-yonetimi/kategoriler");
};

exports.getDeleteCategory = async (req, res) => {
  const id = req.params.id;
  await Category.deleteCategory(id);
  req.session.alert = {
    type: "success",
    message: "Kategori silme işlemi başarılı",
  };
  res.redirect("/urun-yonetimi/kategoriler");
};

exports.ajaxSearchProducts = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    let selectedCategories = req.query.categories || [];
    if (selectedCategories && !Array.isArray(selectedCategories)) {
      selectedCategories = [selectedCategories];
    }

    let selectedStock = req.query.stock || [];
    if (selectedStock && !Array.isArray(selectedStock)) {
      selectedStock = [selectedStock];
    }

    const minPrice = req.query.minPrice ?? "";
    const maxPrice = req.query.maxPrice ?? "";
    const sort = req.query.sort || "newest";
    const productSearch = req.query.productSearch || "";

    const { products } = await Product.getPaginated(
      page,
      limit,
      selectedCategories,
      selectedStock,
      minPrice,
      maxPrice,
      sort,
      productSearch
    );

    // Sadece satırları render eden partial oluşturalım
    res.render(
      "urun-yonetimi/partials/productRows",
      { products },
      (err, html) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Render hatası" });
        }
        res.json({ html });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Arama hatası" });
  }
};
