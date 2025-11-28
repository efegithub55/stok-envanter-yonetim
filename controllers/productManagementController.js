const Product = require("../models/Product");
const Category = require("../models/Category");

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

exports.getAddProduct = (req, res) => {
  res.render("urun-yonetimi/urun-ekle");
};

exports.getCategories = (req, res) => {
  res.render("urun-yonetimi/kategoriler");
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
