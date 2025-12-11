const Product = require("../models/Product");
const Category = require("../models/Category");
const Logs = require("../models/Logs");
const db = require("../config/database");

exports.getStockStatus = async (req, res, next) => {
  try {
    const { category, sort } = req.query;

    const allProducts = await Product.getAllProducts();

    const criticalAll = allProducts.filter(
      (p) => p.mevcut_stok <= p.min_stok / 2
    );
    const lowAll = allProducts.filter(
      (p) => p.mevcut_stok > p.min_stok / 2 && p.mevcut_stok <= p.min_stok
    );
    const normalAll = allProducts.filter((p) => p.mevcut_stok > p.min_stok);

    const totalValueAll = allProducts.reduce(
      (sum, p) => sum + (p.mevcut_stok || 0) * (p.alis_fiyati || 0),
      0
    );

    const totalProduct = allProducts.length;

    const [netRows] = await db.query(
      `
      SELECT 
        urun_id,
        SUM(
          CASE 
            WHEN hareket_turu = 'giris' THEN miktar 
            WHEN hareket_turu = 'cikis' THEN -miktar
            ELSE 0 
          END
        ) AS net_change
      FROM hareketler
      WHERE created_at >= NOW() - INTERVAL 7 DAY
      GROUP BY urun_id
    `
    );

    const netMap = new Map();
    netRows.forEach((row) => {
      netMap.set(row.urun_id, row.net_change || 0);
    });

    let prevCritical = 0;
    let prevLow = 0;
    let prevNormal = 0;
    let prevTotalValue = 0;

    allProducts.forEach((p) => {
      const netChange = netMap.get(p.id) || 0;
      const prevStock = (p.mevcut_stok || 0) - netChange;
      const minStok = p.min_stok || 0;

      if (prevStock <= minStok / 2) {
        prevCritical++;
      } else if (prevStock > minStok / 2 && prevStock <= minStok) {
        prevLow++;
      } else if (prevStock > minStok) {
        prevNormal++;
      }

      prevTotalValue += prevStock * (p.alis_fiyati || 0);
    });

    const criticalTrend = criticalAll.length - prevCritical;
    const lowTrend = lowAll.length - prevLow;
    const normalTrend = normalAll.length - prevNormal;

    const valueTrendRate =
      prevTotalValue > 0
        ? ((totalValueAll - prevTotalValue) / prevTotalValue) * 100
        : 0;

    const products = await Product.getFiltered({
      category: category || null,
      sort: sort || "default",
    });

    const criticalFiltered = products.filter(
      (item) => item.mevcut_stok <= item.min_stok / 2
    );
    const lowFiltered = products.filter(
      (item) =>
        item.mevcut_stok > item.min_stok / 2 &&
        item.mevcut_stok <= item.min_stok
    );
    const normalFiltered = products.filter(
      (item) => item.mevcut_stok > item.min_stok
    );

    const categories = await Category.getAllCategories();
    const productIds = products.map((item) => item.id);
    const lastEntries = await Logs.getLastEntriesForProducts(productIds);

    res.render("stok-islemleri/stok-durumu", {
      criticalCount: criticalAll.length,
      lowCount: lowAll.length,
      normalCount: normalAll.length,
      totalValue: totalValueAll,
      totalProduct,

      trends: {
        critical: criticalTrend,
        low: lowTrend,
        normal: normalTrend,
        valueRate: valueTrendRate,
      },

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
  } catch (err) {
    console.error("getStockStatus hata:", err);
    next(err);
  }
};

exports.getStockStatusAjax = async (req, res) => {
  try {
    const { tab = "1", q = "" } = req.query;
    const search = q.trim().toLowerCase();

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

    const filtered = search
      ? baseList.filter((item) => {
          const name = String(item.urun_adi || "").toLowerCase();
          const sku = String(item.sku || "").toLowerCase();
          return name.includes(search) || sku.includes(search);
        })
      : baseList;

    const productIds = filtered.map((item) => item.id);
    const lastEntries = await Logs.getLastEntriesForProducts(productIds);

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
  const productData = await Product.getProduct(id);
  const prInfo = productData.mevcut_stok;
  const result = await Product.addStock(id, stok_ekle);
  await Logs.addLog(id, "giris", null, prInfo, stok_ekle, null, req.user.id);
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

  const productData = await Product.getProduct(id);
  const prInfo = productData.mevcut_stok;

  await Logs.addLog(id, "cikis", null, prInfo, stok_cikar, null, req.user.id);

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

exports.postStockAdd = async (req, res, next) => {
  try {
    const { products, waybill, description } = req.body;
    const userId = req.user.id;

    let productIds = products || [];
    if (!Array.isArray(productIds)) {
      productIds = [productIds];
    }

    if (productIds.length === 0) {
      return res.redirect("/stok-islemleri/stok-girisi");
    }

    for (const productId of productIds) {
      const qtyRaw = req.body[`giris_miktari_${productId}`];
      const quantity = parseInt(qtyRaw, 10) || 0;

      if (!quantity || quantity <= 0) continue;

      const oldStockRaw = req.body[`old_stock_${productId}`];
      const oldStock = parseInt(oldStockRaw, 10) || 0;

      await Product.addStock(productId, quantity);

      await Logs.addLog(
        productId,
        "giris",
        waybill || null,
        oldStock,
        quantity,
        description || "",
        userId
      );
    }

    req.session.alert = {
      type: "success",
      message: "Stok girişi işlemi başarılı.",
    };
    res.redirect("/stok-islemleri/stok-girisi");
  } catch (err) {
    console.error("postStockAdd hata:", err);
    next(err);
  }
};

exports.getStockRemove = (req, res) => {
  res.render("stok-islemleri/stok-cikisi");
};

exports.postStockOut = async (req, res, next) => {
  try {
    const { products, waybill, description } = req.body;
    const userId = req.user.id;

    if (!products) {
      return res.redirect("/stok-islemleri/stok-cikisi");
    }

    let productIds = products;
    if (!Array.isArray(productIds)) {
      productIds = [productIds];
    }

    for (const productId of productIds) {
      const qtyRaw = req.body[`cikis_miktari_${productId}`];
      const quantity = parseInt(qtyRaw, 10) || 0;

      if (!quantity || quantity <= 0) continue;

      const oldStockRaw = req.body[`old_stock_${productId}`];
      const oldStock = parseInt(oldStockRaw, 10) || 0;

      await Product.decreaseStock(productId, quantity);

      await Logs.addLog(
        productId,
        "cikis",
        waybill || null,
        oldStock,
        quantity,
        description || "",
        userId
      );
    }

    req.session.alert = {
      type: "success",
      message: "Stok çıkışı işlemi başarılı.",
    };
    res.redirect("/stok-islemleri/stok-cikisi");
  } catch (err) {
    console.error("postStockOut hata:", err);
    next(err);
  }
};

exports.getStockLogs = async (req, res, next) => {
  try {
    const { type, category, last, search, ajax } = req.query;

    const filters = {
      type: type === "giris" || type === "cikis" ? type : null,
      category:
        category && category !== "all" && !isNaN(category)
          ? Number(category)
          : null,
      last: last || null,
      search: search || null,
    };

    const logs = await Logs.getLogs(filters);

    const baseFilters = { ...filters, type: null };
    const baseLogs = await Logs.getLogs(baseFilters);

    const counts = {
      totalLog: baseLogs.length,
      totalGiris: baseLogs.filter((l) => l.hareket_turu === "giris").length,
      totalCikis: baseLogs.filter((l) => l.hareket_turu === "cikis").length,
    };

    const stats = await Logs.getMonthlyStats();

    if (ajax === "1") {
      return res.json({
        logs,
        stats,
        counts,
        type: filters.type || null,
      });
    }

    const categories = await Category.getAllCategories();

    res.render("stok-islemleri/stok-hareketleri", {
      logs,
      categories,
      stats,
      filters,
      counts,
      type: filters.type || null,
    });
  } catch (err) {
    next(err);
  }
};
