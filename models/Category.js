const db = require("../config/database");

class Category {
  constructor(row) {
    this.id = row.id;
    this.kategori_adi = row.kategori_adi;
    this.aciklama = row.aciklama;
    this.is_active = row.is_active;
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
  }

  static async getAllCategories() {
    try {
      let sql = `SELECT 
    k.*,
    COUNT(p.id) AS urun_sayisi,
    COALESCE(SUM(p.alis_fiyati), 0) AS kategori_degeri
FROM kategoriler k
LEFT JOIN urunler p ON p.kategori_id = k.id
GROUP BY k.id;
`;
      const [rows] = await db.query(sql);
      return rows;
    } catch (err) {
      console.error("Category.getAllCategories hata: ", err);
      throw err;
    }
  }

  static async getCategoryStats() {
    try {
      const [rows] = await db.query(`
            SELECT
                k.id,
                k.kategori_adi,
                COUNT(u.id) AS adet
            FROM kategoriler k
            LEFT JOIN urunler u ON u.kategori_id = k.id
            GROUP BY k.id, k.kategori_adi
            ORDER BY k.id    
        `);
      return rows;
    } catch (err) {
      console.error("Categories.getCategoryStats hata: ", err);
      throw err;
    }
  }

  static async getLastAdded() {
    try {
      let sql = `SELECT * FROM kategoriler ORDER BY created_at DESC LIMIT 1`;
      const [[row]] = await db.query(sql);
      return row;
    } catch (err) {
      console.error("Category.getLastAdded hata:", err);
      throw err;
    }
  }

  static async addCategory(kategori_adi, aciklama) {
    try {
      const result = await db.query(
        "INSERT INTO kategoriler (kategori_adi, aciklama) VALUES (?, ?)",
        [kategori_adi, aciklama]
      );
      return result;
    } catch (err) {
      console.error("Category.addCategory hata:", err);
      throw err;
    }
  }

  static async deleteCategory(id) {
    try {
      const result = await db.query("DELETE FROM kategoriler WHERE id = ?", [
        id,
      ]);
      return result;
    } catch (err) {
      console.log("Category.deleteCategory hata:", err);
      throw err;
    }
  }
}

module.exports = Category;
