const Product = require("../models/Product");
const Logs = require("../models/Logs");
const Category = require("../models/Category");

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD
};

exports.getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.getAllProducts();
    const totalValue = await Product.getTotalValue();
    const criticalStock = await Product.getCritical();
    const todayLogs = await Logs.getLogs("today");
    const categoryStats = await Category.getCategoryStats();
    const last15Days = await Logs.getLast15DaysStockMovements();
    const critical5Stock = await Product.getCritical("top5");
    const last5Logs = await Logs.getLogs("last5");
    const topMovements = await Logs.getLogs("top6");

    const final15Days = [];

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const dateStr = formatLocalDate(d);

      const found = last15Days.find((x) => {
        const t =
          x.tarih instanceof Date ? formatLocalDate(x.tarih) : String(x.tarih);
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
      criticals: critical5Stock,
      last5Logs,
      topMovements,
    });
  } catch (err) {
    console.error("getDashboard hata:", err);
    res.status(500).send("Dashboard hata");
  }
};
