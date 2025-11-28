const Product = require("../models/Product");
const Logs = require("../models/Logs");
const Category = require("../models/Category");

exports.getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.getAllProducts();
    const totalValue = await Product.getTotalValue();
    const criticalStock = await Product.getCritical();
    const todayLogs = await Logs.getLogs("today");
    const categoryStats = await Category.getCategoryStats();
    const last15Days = await Logs.getLast15DaysStockMovements();

    const final15Days = [];

    const formatDate = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const dateStr = formatDate(d);

      const found = last15Days.find((x) => {
        const t =
          x.tarih instanceof Date ? formatDate(x.tarih) : String(x.tarih);
        return t === dateStr;
      });

      final15Days.push({
        tarih: dateStr,
        hareket_adedi: found ? found.hareket_adedi : 0,
      });
    }

    res.render("dashboard", {
      totalProducts: totalProducts.length,
      totalValue,
      totalCriticalStock: criticalStock.length,
      todayLogsLength: todayLogs.length,
      categoryStats,
      last15Days: final15Days,
    });
  } catch (err) {
    console.error("getDashboard hata:", err);
    res.status(500).send("Dashboard hata");
  }
};
