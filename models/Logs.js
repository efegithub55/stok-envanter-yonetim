const db = require("../config/database");

class Logs {
  constructor(row) {
    this.id = row.id;
    this.urun_id = row.urun_id;
    this.hareket_turu = row.hareket_turu;
    this.irsaliye_fatura_no = row.irsaliye_fatura_no;
    this.miktar = row.miktar;
    this.yetkili_id = row.yetkili_id;
    this.created_at = row.created_at;
  }

  static async getLogs(filter) {
    try {
      if (filter === "today") {
        let query = `
        SELECT * FROM hareketler
        WHERE created_at >= NOW() - INTERVAL 1 DAY
    `;
        const [rows] = await db.query(query);
        return rows.map((row) => new Logs(row));
      }

      if (filter === "last5") {
        let query = `
        SELECT h.*, u.urun_adi AS urun_adi, k.ad_soyad AS ad_soyad FROM hareketler h JOIN urunler u ON h.urun_id = u.id JOIN users k ON h.yetkili_id = k.id ORDER BY created_at DESC LIMIT 5`;
        const [rows] = await db.query(query);
        return rows;
      }

      if (filter == "top6") {
        let query = `
        SELECT 
          u.urun_adi,
          SUM(ABS(h.miktar)) AS miktar
          FROM hareketler h
          JOIN urunler u ON h.urun_id = u.id
          WHERE h.created_at >= CURDATE() - INTERVAL 1 MONTH
          GROUP BY h.urun_id, u.urun_adi
          ORDER BY miktar DESC
          LIMIT 6;`;
        const [rows] = await db.query(query);
        return rows;
      }

      var query = "SELECT * FROM hareketler";
      const [rows] = await db.query(query);
      return rows.map((row) => new Logs(row));
    } catch (err) {
      console.error("Logs.getLogs hata: ", err);
      throw err;
    }
  }

  static async getLast15DaysStockMovements() {
    try {
      const [rows] = await db.query(`
        SELECT 
          DATE(created_at) AS tarih,
          SUM(
            CASE
              WHEN hareket_turu = 'giris' THEN miktar
              WHEN hareket_turu = 'cikis' THEN -miktar
              ELSE 0
            END
          ) AS net_miktar,
          COUNT(*) AS hareket_adedi
        FROM hareketler
        WHERE created_at >= CURDATE() - INTERVAL 14 DAY
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `);

      return rows;
    } catch (err) {
      console.error("Logs.getLast15DaysStockMovements hata:", err);
      throw err;
    }
  }
}

module.exports = Logs;
