const db = require("../config/database");

class Product {
  constructor(row) {
    this.id = row.id;
    this.urun_adi = row.urun_adi || null;
    this.kategori_id = row.kategori_id || null;
    this.barkod = row.barkod || null;
    this.sku = row.sku || null;
    this.aciklama = row.aciklama || null;
    this.resim_url = row.resim_url || null;
    this.mevcut_stok = row.mevcut_stok || null;
    this.min_stok = row.min_stok || null;
    this.max_stok = row.max_stok || null;
    this.birim_id = row.birim_id || null;
    this.alis_fiyati = row.alis_fiyati || null;
    this.satis_fiyati = row.satis_fiyati || null;
    this.kdv = row.kdv || null;
    this.tedarikci = row.tedarikci || null;
    this.raf_konumu = row.raf_konumu || null;
    this.garanti = row.garanti || null;
    this.son_kullanma_tarihi = row.son_kullanma_tarihi || null;
    this.urun_link = row.urun_link || null;
  }

  static async getAllProducts() {
    try {
      const [rows] = await db.query("SELECT * FROM urunler");
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getAllProducts hata:", err);
      throw err;
    }
  }

  static async getTotalValue() {
    try {
      var total = 0;
      const [rows] = await db.query(
        "SELECT mevcut_stok, alis_fiyati FROM urunler"
      );
      rows.map((row) => {
        total += row.alis_fiyati * row.mevcut_stok;
      });
      return total;
    } catch (err) {
      console.error("Product.getTotalValue hata:", err);
      throw err;
    }
  }

  static async getCritical() {
    try {
      const [rows] = await db.query(
        "SELECT * FROM urunler WHERE mevcut_stok <= min_stok"
      );
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getCritical hata: ", err);
      throw err;
    }
  }
}

module.exports = Product;
