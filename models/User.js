const db = require("../config/database.js");
const bcrypt = require("bcrypt");

class User {
  constructor(data) {
    this.id = data.id;
    this.ad_soyad = data.ad_soyad;
    this.email = data.email;
    this.sifre_hash = data.sifre_hash;
    this.avatar_url = data.avatar_url;
    this.telefon = data.telefon;
    this.son_giris_tarihi = data.son_giris_tarihi;
    this.olusturulma_tarihi = data.olusturulma_tarihi;
    this.guncellenme_tarihi = data.guncellenme_tarihi;
    this.role = data.role;
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows.map((row) => new User(row));
    } catch (err) {
      console.error("User.findByEmail hata:", err);
      throw err;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
      return rows.map((row) => new User(row));
    } catch (err) {
      console.error("User.findById hata: ", err);
      throw err;
    }
  }
}

module.exports = User;
