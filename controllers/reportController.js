const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const dayjs = require("dayjs");
const db = require("../config/database");
const Report = require("../models/Report");

function getDateRange(preset) {
  const today = dayjs().startOf("day");

  switch (preset) {
    case "today":
      return { start: today, end: today.endOf("day"), label: "Bugün" };
    case "week":
      return {
        start: today.startOf("week"),
        end: today.endOf("week"),
        label: "Bu Hafta",
      };
    case "3m":
      return {
        start: today.subtract(3, "month").startOf("day"),
        end: today.endOf("day"),
        label: "Son 3 Ay",
      };
    case "year":
      return {
        start: today.startOf("year"),
        end: today.endOf("year"),
        label: "Bu Yıl",
      };
    case "month":
    default:
      return {
        start: today.startOf("month"),
        end: today.endOf("month"),
        label: "Bu Ay",
      };
  }
}

exports.getReportsPage = async (req, res, next) => {
  try {
    const preset = req.query.range || "month";
    const { start, end, label } = getDateRange(preset);

    const startStr = start.format("YYYY-MM-DD HH:mm:ss");
    const endStr = end.format("YYYY-MM-DD HH:mm:ss");

    const [invRows] = await db.query(`
      SELECT SUM(mevcut_stok * alis_fiyati) AS inventory_value
      FROM urunler
    `);
    const inventoryValue = invRows[0]?.inventory_value || 0;

    const [inOutRows] = await db.query(
      `
      SELECT
        SUM(CASE WHEN hareket_turu = 'giris' THEN miktar ELSE 0 END) AS total_giris,
        SUM(CASE WHEN hareket_turu = 'cikis' THEN miktar ELSE 0 END) AS total_cikis
      FROM hareketler
      WHERE created_at BETWEEN ? AND ?
    `,
      [startStr, endStr]
    );

    const totalGiris = inOutRows[0]?.total_giris || 0;
    const totalCikis = inOutRows[0]?.total_cikis || 0;

    const [marginRows] = await db.query(
      `
      SELECT 
        SUM((u.satis_fiyati - u.alis_fiyati) * h.miktar) AS toplam_kar,
        SUM(u.satis_fiyati * h.miktar) AS toplam_ciro
      FROM hareketler h
      JOIN urunler u ON h.urun_id = u.id
      WHERE h.hareket_turu = 'cikis'
        AND h.created_at BETWEEN ? AND ?
    `,
      [startStr, endStr]
    );

    const toplamKar = marginRows[0]?.toplam_kar || 0;
    const toplamCiro = marginRows[0]?.toplam_ciro || 0;
    const avgMargin = toplamCiro > 0 ? toplamKar / toplamCiro : 0;

    const overview = {
      inventoryValue,
      totalGiris,
      totalCikis,
      avgMargin,
      changeRates: {
        inventory: 0,
        giris: 0,
        cikis: 0,
        margin: 0,
      },
    };

    const [stockRows] = await db.query(
      `
      SELECT 
        DATE(h.created_at) AS tarih,
        SUM(
          CASE 
            WHEN h.hareket_turu = 'giris' THEN h.miktar * u.alis_fiyati
            WHEN h.hareket_turu = 'cikis' THEN -h.miktar * u.alis_fiyati
            ELSE 0
          END
        ) AS net_deger
      FROM hareketler h
      JOIN urunler u ON h.urun_id = u.id
      WHERE h.created_at BETWEEN ? AND ?
      GROUP BY DATE(h.created_at)
      ORDER BY tarih
    `,
      [startStr, endStr]
    );

    const stockValueChart = {
      labels: stockRows.map((r) => dayjs(r.tarih).format("DD.MM")),
      values: stockRows.map((r) => Number(r.net_deger) || 0),
    };

    const [catRows] = await db.query(`
      SELECT 
        COALESCE(k.kategori_adi, 'Kategorisiz') AS kategori_adi,
        SUM(u.mevcut_stok) AS adet
      FROM urunler u
      LEFT JOIN kategoriler k ON u.kategori_id = k.id
      GROUP BY u.kategori_id, k.kategori_adi
      ORDER BY adet DESC
    `);

    const categoryChart = {
      labels: catRows.map((r) => r.kategori_adi),
      values: catRows.map((r) => Number(r.adet) || 0),
    };

    const [inOutChartRows] = await db.query(
      `
      SELECT 
        DATE(created_at) AS tarih,
        SUM(CASE WHEN hareket_turu = 'giris' THEN miktar ELSE 0 END) AS giris,
        SUM(CASE WHEN hareket_turu = 'cikis' THEN miktar ELSE 0 END) AS cikis
      FROM hareketler
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY tarih
    `,
      [startStr, endStr]
    );

    const inOutChart = {
      labels: inOutChartRows.map((r) => dayjs(r.tarih).format("DD.MM")),
      giris: inOutChartRows.map((r) => Number(r.giris) || 0),
      cikis: inOutChartRows.map((r) => Number(r.cikis) || 0),
    };

    const [bestRows] = await db.query(
      `
      SELECT 
        u.urun_adi,
        SUM(CASE WHEN h.hareket_turu = 'cikis' THEN h.miktar ELSE 0 END) AS adet
      FROM hareketler h
      JOIN urunler u ON h.urun_id = u.id
      WHERE h.created_at BETWEEN ? AND ?
      GROUP BY h.urun_id, u.urun_adi
      HAVING adet > 0
      ORDER BY adet DESC
      LIMIT 5
    `,
      [startStr, endStr]
    );

    const bestSellersChart = {
      labels: bestRows.map((r) => r.urun_adi),
      values: bestRows.map((r) => Number(r.adet) || 0),
    };

    const chartData = {
      stockValue: stockValueChart,
      category: categoryChart,
      inOut: inOutChart,
      bestSellers: bestSellersChart,
    };

    const lastReports = await Report.getLastReports(10);

    res.render("raporlar/raporlar", {
      overview,
      lastReports,
      chartData,
      rangePreset: preset,
      dateRangeLabel: label,
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      dayjs,
    });
  } catch (err) {
    console.error("getReportsPage hata:", err);
    next(err);
  }
};

exports.postCreateReportFromTemplate = async (req, res, next) => {
  try {
    const { template, format, start_date, end_date, name, summary } = req.body;
    const userId = req.user.id;

    if (!template) {
      req.session.alert = {
        type: "danger",
        message: "Rapor şablonu seçilemedi.",
      };
      return res.redirect("/raporlar/raporlar");
    }

    let start, end;

    if (start_date && end_date) {
      start = dayjs(start_date).startOf("day");
      end = dayjs(end_date).endOf("day");
    } else {
      const preset = req.query.range || "month";
      const { start: s, end: e } = getDateRange(preset);
      start = s;
      end = e;
    }

    const startStr = start.format("YYYY-MM-DD HH:mm:ss");
    const endStr = end.format("YYYY-MM-DD HH:mm:ss");

    const outFormat = (format || "excel").toLowerCase();

    let rows = [];
    let reportTitle = name || "Oluşturulan Rapor";
    let filenameBase = "rapor";

    switch (template) {
      case "monthly_inventory":
        reportTitle = name || "Aylık Envanter Raporu";
        filenameBase = "aylik-envanter";

        [rows] = await db.query(`
          SELECT 
            u.sku,
            u.urun_adi,
            COALESCE(k.kategori_adi, 'Kategorisiz') AS kategori_adi,
            u.mevcut_stok,
            u.alis_fiyati,
            u.satis_fiyati,
            (u.mevcut_stok * u.alis_fiyati) AS stok_degeri
          FROM urunler u
          LEFT JOIN kategoriler k ON u.kategori_id = k.id
          ORDER BY k.kategori_adi, u.urun_adi
        `);
        break;

      case "critical_stock":
        reportTitle = name || "Kritik Stok Raporu";
        filenameBase = "kritik-stok";

        [rows] = await db.query(`
          SELECT
            u.sku,
            u.urun_adi,
            COALESCE(k.kategori_adi, 'Kategorisiz') AS kategori_adi,
            u.mevcut_stok,
            u.min_stok
          FROM urunler u
          LEFT JOIN kategoriler k ON u.kategori_id = k.id
          WHERE u.mevcut_stok <= u.min_stok
          ORDER BY u.mevcut_stok ASC
        `);
        break;

      case "profitability":
        reportTitle = name || "Karlılık Analizi";
        filenameBase = "karlilik-analizi";

        [rows] = await db.query(
          `
          SELECT 
            u.sku,
            u.urun_adi,
            COALESCE(k.kategori_adi, 'Kategorisiz') AS kategori_adi,
            SUM(CASE WHEN h.hareket_turu = 'cikis' THEN h.miktar ELSE 0 END) AS satilan_adet,
            u.alis_fiyati,
            u.satis_fiyati,
            SUM(
              CASE WHEN h.hareket_turu = 'cikis' 
                   THEN (u.satis_fiyati - u.alis_fiyati) * h.miktar 
                   ELSE 0 
              END
            ) AS toplam_kar,
            SUM(
              CASE WHEN h.hareket_turu = 'cikis' 
                   THEN u.satis_fiyati * h.miktar 
                   ELSE 0 
              END
            ) AS toplam_ciro
          FROM hareketler h
          JOIN urunler u ON h.urun_id = u.id
          LEFT JOIN kategoriler k ON u.kategori_id = k.id
          WHERE h.hareket_turu = 'cikis'
            AND h.created_at BETWEEN ? AND ?
          GROUP BY h.urun_id, u.sku, u.urun_adi, k.kategori_adi, u.alis_fiyati, u.satis_fiyati
          HAVING satilan_adet > 0
          ORDER BY toplam_kar DESC
        `,
          [startStr, endStr]
        );
        break;

      case "supplier":
        reportTitle = name || "Tedarikçi Raporu";
        filenameBase = "tedarikci-raporu";

        [rows] = await db.query(
          `
          SELECT
            u.tedarikci,
            COUNT(*) AS urun_sayisi,
            SUM(u.mevcut_stok) AS toplam_stok,
            SUM(u.mevcut_stok * u.alis_fiyati) AS toplam_deger
          FROM urunler u
          WHERE u.tedarikci IS NOT NULL AND u.tedarikci <> ''
          GROUP BY u.tedarikci
          ORDER BY toplam_deger DESC
        `
        );
        break;

      default:
        reportTitle = name || "Özel Rapor";
        filenameBase = "ozel-rapor";

        [rows] = await db.query(
          `
          SELECT 
            h.id,
            h.urun_id,
            u.sku,
            u.urun_adi,
            h.hareket_turu,
            h.miktar,
            h.created_at
          FROM hareketler h
          JOIN urunler u ON h.urun_id = u.id
          WHERE h.created_at BETWEEN ? AND ?
          ORDER BY h.created_at DESC
        `,
          [startStr, endStr]
        );
        break;
    }

    if (!rows || rows.length === 0) {
      req.session.alert = {
        type: "danger",
        message:
          "Seçilen kriterlere uygun veri bulunamadığı için rapor oluşturulamadı.",
      };
      return res.redirect("/raporlar");
    }

    const nowStr = dayjs().format("YYYYMMDD-HHmmss");
    const ext = outFormat === "pdf" ? "pdf" : "xlsx";
    const fileName = `${filenameBase}-${nowStr}.${ext}`;
    const dirPath = path.join(__dirname, "..", "storage", "reports");

    await fs.promises.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, fileName);

    const fontPath = path.join(
      __dirname,
      "..",
      "public",
      "assets",
      "fonts",
      "Inter-VariableFont_opsz,wght.ttf"
    );

    if (outFormat === "pdf") {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.font(fontPath);

      doc.fontSize(18).text(reportTitle, { align: "left" });
      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(
          `Tarih Aralığı: ${dayjs(startStr).format("DD.MM.YYYY")} - ${dayjs(
            endStr
          ).format("DD.MM.YYYY")}`
        );
      doc.moveDown(1);

      let headers = [];
      if (template === "monthly_inventory") {
        headers = [
          "SKU",
          "Ürün Adı",
          "Kategori",
          "Mevcut Stok",
          "Alış Fiyatı",
          "Satış Fiyatı",
          "Stok Değeri",
        ];
      } else if (template === "critical_stock") {
        headers = ["SKU", "Ürün Adı", "Kategori", "Mevcut", "Kritik"];
      } else if (template === "profitability") {
        headers = [
          "SKU",
          "Ürün Adı",
          "Kategori",
          "Satılan",
          "Alış",
          "Satış",
          "Ciro",
          "Kâr",
        ];
      } else if (template === "supplier") {
        headers = ["Tedarikçi", "Ürün Sayısı", "Toplam Stok", "Toplam Değer"];
      } else {
        headers = ["Hareket ID", "SKU", "Ürün Adı", "Tür", "Miktar", "Tarih"];
      }

      doc.fontSize(11).text(headers.join(" | "));
      doc.moveDown(0.5);

      rows.forEach((r) => {
        let values = [];
        if (template === "monthly_inventory") {
          values = [
            r.sku,
            r.urun_adi,
            r.kategori_adi,
            String(r.mevcut_stok),
            String(r.alis_fiyati),
            String(r.satis_fiyati),
            String(r.stok_degeri),
          ];
        } else if (template === "critical_stock") {
          values = [
            r.sku,
            r.urun_adi,
            r.kategori_adi,
            String(r.mevcut_stok),
            String(r.min_stok),
          ];
        } else if (template === "profitability") {
          values = [
            r.sku,
            r.urun_adi,
            r.kategori_adi,
            String(r.satilan_adet),
            String(r.alis_fiyati),
            String(r.satis_fiyati),
            String(r.toplam_ciro),
            String(r.toplam_kar),
          ];
        } else if (template === "supplier") {
          values = [
            r.tedarikci,
            String(r.urun_sayisi),
            String(r.toplam_stok),
            String(r.toplam_deger),
          ];
        } else {
          values = [
            String(r.id),
            r.sku,
            r.urun_adi,
            r.hareket_turu,
            String(r.miktar),
            dayjs(r.created_at).format("DD.MM.YYYY HH:mm"),
          ];
        }

        doc.text(values.join(" | "));
        doc.moveDown(0.2);
      });

      doc.end();
      await new Promise((resolve) => stream.on("finish", resolve));
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Rapor");

      if (template === "monthly_inventory") {
        sheet.columns = [
          { header: "SKU", key: "sku", width: 18 },
          { header: "Ürün Adı", key: "urun_adi", width: 32 },
          { header: "Kategori", key: "kategori_adi", width: 24 },
          { header: "Mevcut Stok", key: "mevcut_stok", width: 15 },
          { header: "Alış Fiyatı", key: "alis_fiyati", width: 15 },
          { header: "Satış Fiyatı", key: "satis_fiyati", width: 15 },
          { header: "Stok Değeri", key: "stok_degeri", width: 18 },
        ];
        rows.forEach((r) => sheet.addRow(r));
      } else if (template === "critical_stock") {
        sheet.columns = [
          { header: "SKU", key: "sku", width: 18 },
          { header: "Ürün Adı", key: "urun_adi", width: 32 },
          { header: "Kategori", key: "kategori_adi", width: 24 },
          { header: "Mevcut Stok", key: "mevcut_stok", width: 15 },
          { header: "Kritik Seviye", key: "min_stok", width: 15 },
        ];
        rows.forEach((r) => sheet.addRow(r));
      } else if (template === "profitability") {
        sheet.columns = [
          { header: "SKU", key: "sku", width: 18 },
          { header: "Ürün Adı", key: "urun_adi", width: 32 },
          { header: "Kategori", key: "kategori_adi", width: 24 },
          { header: "Satılan Adet", key: "satilan_adet", width: 15 },
          { header: "Alış Fiyatı", key: "alis_fiyati", width: 15 },
          { header: "Satış Fiyatı", key: "satis_fiyati", width: 15 },
          { header: "Toplam Ciro", key: "toplam_ciro", width: 18 },
          { header: "Toplam Kar", key: "toplam_kar", width: 18 },
        ];
        rows.forEach((r) => sheet.addRow(r));
      } else if (template === "supplier") {
        sheet.columns = [
          { header: "Tedarikçi", key: "tedarikci", width: 32 },
          { header: "Ürün Sayısı", key: "urun_sayisi", width: 15 },
          { header: "Toplam Stok", key: "toplam_stok", width: 15 },
          { header: "Toplam Değer", key: "toplam_deger", width: 18 },
        ];
        rows.forEach((r) => sheet.addRow(r));
      } else {
        sheet.columns = [
          { header: "Hareket ID", key: "id", width: 10 },
          { header: "SKU", key: "sku", width: 18 },
          { header: "Ürün Adı", key: "urun_adi", width: 32 },
          { header: "Tür", key: "hareket_turu", width: 10 },
          { header: "Miktar", key: "miktar", width: 10 },
          { header: "Tarih", key: "created_at", width: 20 },
        ];

        rows.forEach((r) => {
          sheet.addRow({
            ...r,
            created_at: dayjs(r.created_at).format("DD.MM.YYYY HH:mm"),
          });
        });
      }

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "left" };

      await workbook.xlsx.writeFile(filePath);
    }

    const statsFs = await fs.promises.stat(filePath);
    const fileSizeBytes = statsFs.size;

    const reportId = await Report.create({
      ad: reportTitle,
      sablon_turu: template || "custom",
      format: outFormat === "pdf" ? "pdf" : "excel",
      tarih_baslangic: startStr,
      tarih_bitis: endStr,
      filtre_ozeti: summary || null,
      filtre_json: JSON.stringify({
        template,
        start_date: startStr,
        end_date: endStr,
      }),
      dosya_yolu: `/storage/reports/${fileName}`,
      boyut_bytes: fileSizeBytes,
      olusturan_id: userId,
    });

    return res.download(filePath, fileName);
  } catch (err) {
    console.error("postCreateReportFromTemplate hata:", err);
    next(err);
  }
};

exports.getDeleteReport = async (req, res) => {
  try {
    const id = req.params.id;
    await Report.delete(id);
    req.session.alert = {
      type: "success",
      message: "Rapor silme işlemi başarılı.",
    };
    res.redirect("/raporlar");
  } catch (err) {
    console.error("getDeleteReport hata: ", err);
    req.session.alert = {
      type: "danger",
      message: "Rapor silme işlemi başarısız!",
    };
  }
};
