const Product = require("../models/Product");
const Category = require("../models/Category");
const Logs = require("../models/Logs");

exports.getStockStatus = async (req, res) => {
  const { category, sort } = req.query;

  // 1) KARTLAR İÇİN GLOBAL VERİLER (FİLTREDEN BAĞIMSIZ)
  const criticalAll = await Product.getLowest(); // tüm kritik ürünler
  const lowAll = await Product.getLow(); // tüm düşük stok
  const normalAll = await Product.getNormal(); // tüm normal stok
  const totalValueAll = await Product.getTotalValue(); // tüm stok değeri
  const totalProduct = await Product.getAllProducts();

  // 2) TAB / LİSTE İÇİN FİLTRELİ VERİLER
  const products = await Product.getFiltered({
    category: category || null,
    sort: sort || "default",
  });

  const criticalFiltered = products.filter(
    (item) => item.mevcut_stok <= item.min_stok / 2
  );
  const lowFiltered = products.filter(
    (item) =>
      item.mevcut_stok > item.min_stok / 2 && item.mevcut_stok <= item.min_stok
  );
  const normalFiltered = products.filter(
    (item) => item.mevcut_stok > item.min_stok
  );

  const categories = await Category.getAllCategories();
  const productIds = products.map((item) => item.id);
  const lastEntries = await Logs.getLastEntriesForProducts(productIds);

  res.render("stok-islemleri/stok-durumu", {
    // KARTLAR (GLOBAL)
    criticalCount: criticalAll.length,
    lowCount: lowAll.length,
    normalCount: normalAll.length,
    totalValue: totalValueAll,
    totalProduct: totalProduct.length,

    // TAB / LİSTE (FİLTRELİ)
    products,
    critical: criticalFiltered,
    low: lowFiltered,
    normal: normalFiltered,

    categories,
    lastEntries,
    filters: {
      category: category || "",
      sort: sort || "default",
    },
  });
};

exports.getStockStatusAjax = async (req, res) => {
  try {
    const { tab = "1", q = "" } = req.query;
    const search = q.trim().toLowerCase();

    // Eldeki metotları kullan
    const criticalAll = await Product.getLowest();
    const lowAll = await Product.getLow();
    const normalAll = await Product.getNormal();
    const allProducts = await Product.getAllProducts();
    const categories = await Category.getAllCategories();

    let baseList = [];

    if (tab === "1") baseList = allProducts;
    if (tab === "2") baseList = criticalAll;
    if (tab === "3") baseList = lowAll;
    if (tab === "4") baseList = normalAll;

    // Search filtresi (ürün adı + sku) – gerekirse genişletirsin
    const filtered = search
      ? baseList.filter((item) => {
          const name = String(item.urun_adi || "").toLowerCase();
          const sku = String(item.sku || "").toLowerCase();
          return name.includes(search) || sku.includes(search);
        })
      : baseList;

    const productIds = filtered.map((item) => item.id);
    const lastEntries = await Logs.getLastEntriesForProducts(productIds);

    // Partial render edeceğiz
    res.render(
      "stok-islemleri/partials/stok-durumu-list",
      {
        items: filtered,
        categories,
        lastEntries,
      },
      (err, html) => {
        if (err) {
          console.error("getStockStatusAjax render error:", err);
          return res.status(500).json({ error: "Render hatası" });
        }
        res.json({ html });
      }
    );
  } catch (err) {
    console.error("getStockStatusAjax hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

exports.postStockStatAdd = async (req, res) => {
  const { stok_ekle } = req.body;
  const id = req.params.id;
  const result = await Product.addStock(id, stok_ekle);
  if (result) {
    req.session.alert = {
      type: "success",
      message: "Stok girişi işlemi başarılı",
    };
  } else {
    req.session.alert = {
      type: "danger",
      message: "Stok girişi işlemi başarısız",
    };
  }
  res.redirect("/stok-islemleri/stok-durumu");
};

exports.postStockStatDecrease = async (req, res) => {
  const { stok_cikar } = req.body;
  const id = req.params.id;
  const result = await Product.decreaseStock(id, stok_cikar);
  if (result) {
    req.session.alert = {
      type: "success",
      message: "Stok çıkışı işlemi başarılı",
    };
  } else {
    req.session.alert = {
      type: "danger",
      message: "Stok çıkışı işlemi başarısız",
    };
  }
  res.redirect("/stok-islemleri/stok-durumu");
};

exports.getStockAdd = (req, res) => {
  res.render("stok-islemleri/stok-girisi");
};

exports.getStockRemove = (req, res) => {
  res.render("stok-islemleri/stok-cikisi");
};

exports.getStockLogs = (req, res) => {
  res.render("stok-islemleri/stok-hareketleri");
};
