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
      let sql = "SELECT * FROM kategoriler";
      const [rows] = await db.query(sql);
      return rows.map((row) => new Category(row));
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
}

module.exports = Category;
