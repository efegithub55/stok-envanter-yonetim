const Product = require("../models/Product");
const Category = require("../models/Category");
const Units = require("../models/Units");
const Logs = require("../models/Logs");
const ExcelJS = require("exceljs");

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

    let resim_url = null;
    if (file) {
      resim_url = `${file.filename}`;
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

    await Product.addProduct(data);

    res.redirect("/urun-yonetimi/yeni-urun");
  } catch (err) {
    console.error("Ürün ekleme hatası:", err);
    res.redirect("/urun-yonetimi/yeni-urun");
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const { urun_adi, sku, kategori_id, alis_fiyati, satis_fiyati } = req.body;
    const id = req.params.id;
    await Product.updateProduct(id, {
      urun_adi,
      sku,
      kategori_id,
      alis_fiyati,
      satis_fiyati,
    });
    req.session.alert = {
      type: "success",
      message: "Ürün başarılı bir şekilde düzenlendi.",
    };
    res.redirect("/urun-yonetimi/urunler");
  } catch (err) {
    console.error("Ürün düzenleme hatası:", err);
    res.redirect("/urun-yonetimi/urunler");
  }
};

exports.getDeleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.deleteProduct(id);
    req.session.alert = {
      type: "success",
      message: "Ürün silme işlemi başarılı",
    };
    res.redirect("/urun-yonetimi/urunler");
  } catch (err) {
    console.error("getDeleteProduct hata:", err);
    res.redirect("/urun-yonetimi/urunler");
  }
};

exports.productExcel = async (req, res) => {
  try {
    const products = await Product.getAllProducts();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ürünler");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Ürün Adı", key: "urun_adi", width: 30 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Kategori", key: "kategori_adi", width: 20 },
      { header: "Mevcut Stok", key: "mevcut_stok", width: 15 },
      { header: "Alış Fiyatı", key: "alis_fiyati", width: 15 },
      { header: "Satış Fiyatı", key: "satis_fiyati", width: 15 },
      { header: "Oluşturulma", key: "created_at", width: 20 },
    ];

    products.forEach((p) => {
      worksheet.addRow({
        id: p.id,
        urun_adi: p.urun_adi,
        sku: p.sku,
        kategori_adi: p.kategori_adi || "",
        mevcut_stok: p.mevcut_stok,
        alis_fiyati: p.alis_fiyati,
        satis_fiyati: p.satis_fiyati,
        created_at: p.created_at,
      });
    });
    worksheet.getRow(1).font = { bold: true };
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=urunler.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("productExcel hata: ", err);
    res.redirect("/urun-yonetimi/urunler");
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
  req.session.alert = {
    type: "success",
    message: "Kategori başarılı bir şekilde eklendi",
  };
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

exports.editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { kategori_adi, aciklama } = req.body;
    await Category.updateCategory(id, { kategori_adi, aciklama });
    req.session.alert = {
      type: "success",
      message: "Kategori düzenleme işlemi başarılı",
    };
    res.redirect("/urun-yonetimi/kategoriler");
  } catch (err) {
    console.error("editCategory hata: ", err);
    res.redirect("/urun-yonetimi/kategoriler");
  }
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
