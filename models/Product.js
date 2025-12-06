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
      const [rows] = await db.query(
        "SELECT u.*, k.kategori_adi AS kategori_adi FROM urunler u JOIN kategoriler k ON u.kategori_id = k.id"
      );
      return rows;
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

  static async getCritical(filter) {
    try {
      if (filter == "top5") {
        const [rows] = await db.query(
          "SELECT u.*, k.kategori_adi as urun_kategori FROM urunler u JOIN kategoriler k ON u.kategori_id = k.id WHERE u.mevcut_stok <= u.min_stok LIMIT 5"
        );
        return rows;
      }
      const [rows] = await db.query(
        "SELECT * FROM urunler WHERE mevcut_stok <= min_stok"
      );
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getCritical hata: ", err);
      throw err;
    }
  }

  static async getLowest() {
    try {
      let sql = `SELECT * FROM urunler WHERE mevcut_stok <= min_stok / 2`;
      const [rows] = await db.query(sql);
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getLowest hata: ", err);
      throw err;
    }
  }
  static async getLow() {
    try {
      let sql = `SELECT * FROM urunler WHERE mevcut_stok <= min_stok AND mevcut_stok > min_stok / 2`;
      const [rows] = await db.query(sql);
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getLow hata: ", err);
      throw err;
    }
  }

  static async getNormal() {
    try {
      let sql = `SELECT * FROM urunler WHERE mevcut_stok > min_stok`;
      const [rows] = await db.query(sql);
      return rows.map((row) => new Product(row));
    } catch (err) {
      console.error("Product.getNormal hata: ", err);
      throw err;
    }
  }

  static async getPaginated(
    page = 1,
    limit = 20,
    categories = [],
    selectedStock = [],
    minPrice,
    maxPrice,
    sort = "newest",
    search = ""
  ) {
    if (limit === "all") limit = "all";

    let perPage = 20;
    if (limit !== "all") {
      perPage = Number(limit) || 20;
    }

    const currentPage = Number(page) || 1;
    const offset = limit === "all" ? 0 : (currentPage - 1) * perPage;

    const whereClauses = [];
    const params = [];

    if (selectedStock && selectedStock.length > 0) {
      const stockSqlParts = [];

      if (selectedStock.includes("normal")) {
        stockSqlParts.push("u.mevcut_stok > u.min_stok");
      }
      if (selectedStock.includes("low")) {
        stockSqlParts.push(
          "u.mevcut_stok <= u.min_stok AND u.mevcut_stok > (u.min_stok / 2)"
        );
      }
      if (selectedStock.includes("critical")) {
        stockSqlParts.push(
          "u.mevcut_stok <= (u.min_stok / 2) AND u.mevcut_stok > 0"
        );
      }
      if (selectedStock.includes("empty")) {
        stockSqlParts.push("u.mevcut_stok = 0");
      }

      if (stockSqlParts.length > 0) {
        whereClauses.push("(" + stockSqlParts.join(" OR ") + ")");
      }
    }

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => "?").join(",");
      whereClauses.push(`u.kategori_id IN (${placeholders})`);
      params.push(...categories);
    }

    const min =
      minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
    const max =
      maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;

    if (min !== null && !Number.isNaN(min)) {
      whereClauses.push("u.alis_fiyati >= ?");
      params.push(min);
    }

    if (max !== null && !Number.isNaN(max)) {
      whereClauses.push("u.alis_fiyati <= ?");
      params.push(max);
    }

    if (search && search.trim() !== "") {
      const like = `%${search.trim()}%`;
      whereClauses.push(
        "(u.urun_adi LIKE ? OR u.sku LIKE ? OR u.barkod LIKE ? OR u.aciklama LIKE ?)"
      );
      params.push(like, like, like, like);
    }

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const countSql = `
    SELECT COUNT(*) AS total
    FROM urunler u
    ${whereSql}
  `;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    let orderBySql = "u.created_at DESC";

    switch (sort) {
      case "oldest":
        orderBySql = "u.created_at ASC";
        break;
      case "name_asc":
        orderBySql = "u.urun_adi ASC";
        break;
      case "name_desc":
        orderBySql = "u.urun_adi DESC";
        break;
      case "price_asc":
        orderBySql = "u.alis_fiyati ASC";
        break;
      case "price_desc":
        orderBySql = "u.alis_fiyati DESC";
        break;
      case "stock_asc":
        orderBySql = "u.mevcut_stok ASC";
        break;
      case "stock_desc":
        orderBySql = "u.mevcut_stok DESC";
        break;
      case "popular":
      case "best_seller":
        orderBySql = "u.created_at DESC";
        break;
    }

    let query = `
    SELECT 
      u.*, 
      k.kategori_adi
    FROM urunler u
    LEFT JOIN kategoriler k ON u.kategori_id = k.id
    ${whereSql}
    ORDER BY ${orderBySql}
  `;

    const queryParams = [...params];

    if (limit !== "all") {
      query += " LIMIT ? OFFSET ?";
      queryParams.push(perPage, offset);
    }

    const [rows] = await db.query(query, queryParams);

    const totalPages =
      limit === "all" ? 1 : Math.max(1, Math.ceil(total / perPage));

    return {
      products: rows,
      total,
      page: currentPage,
      perPage: limit === "all" ? "all" : perPage,
      totalPages,
    };
  }

  static async getStockGroup() {
    let query = `SELECT 
    CASE
        WHEN mevcut_stok = 0 THEN 'empty'
        WHEN mevcut_stok <= (min_stok / 2) THEN 'critical'
        WHEN mevcut_stok <= min_stok THEN 'low'
        ELSE 'normal'
      END AS durum,
      COUNT(*) AS adet
      FROM urunler
      GROUP BY durum;
`;
    const [rows] = await db.query(query);
    return rows;
  }

  static async addProduct(data) {
    const sql = `
    INSERT INTO urunler
      (urun_adi, kategori_id, barkod, sku, aciklama, resim_url,
       mevcut_stok, min_stok, max_stok, birim_id, alis_fiyati,
       satis_fiyati, kdv, tedarikci, raf_konumu, garanti,
       son_kullanma_tarihi, urun_link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      data.urun_adi,
      data.kategori_id,
      data.barkod,
      data.sku,
      data.aciklama,
      data.resim_url,
      data.mevcut_stok,
      data.min_stok,
      data.max_stok,
      data.birim_id,
      data.alis_fiyati,
      data.satis_fiyati,
      data.kdv,
      data.tedarikci,
      data.raf_konumu,
      data.garanti,
      data.son_kullanma_tarihi,
      data.urun_link,
      data.created_at,
    ];

    return db.query(sql, values);
  }

  static async getProduct(id) {
    try {
      let sql = "SELECT * FROM urunler WHERE id = ?";
      const [[row]] = await db.query(sql, [id]);
      return row;
    } catch (err) {
      console.error("Product.getProduct hata: ", err);
      throw err;
    }
  }

  static async updateProduct(id, data) {
    try {
      const fields = [];
      const values = [];

      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });

      if (fields.length === 0) {
        throw new Error("Güncellenecek alan yok");
      }
      values.push(id);
      const sql = `
      UPDATE urunler
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

      const [result] = await db.query(sql, values);

      return result;
    } catch (err) {
      console.error("Product.updateProduct hata:", err);
      throw err;
    }
  }

  static async deleteProduct(id) {
    try {
      let sql = "DELETE FROM urunler WHERE id = ?";
      const result = await db.query(sql, [id]);
      return result;
    } catch (err) {
      console.error("Product.deleteProduct hata:", err);
      throw err;
    }
  }

  static async getFiltered({ category, sort }) {
    let sql = "SELECT * FROM urunler WHERE 1=1";
    const params = [];

    if (category) {
      sql += " AND kategori_id = ?";
      params.push(category);
    }

    if (sort === "lower") {
      sql += " ORDER BY mevcut_stok ASC";
    } else if (sort === "upper") {
      sql += " ORDER BY mevcut_stok DESC";
    } else if (sort === "asc") {
      sql += " ORDER BY urun_adi ASC";
    } else if (sort === "desc") {
      sql += " ORDER BY urun_adi DESC";
    } else {
      sql += `
      ORDER BY 
        CASE 
          WHEN mevcut_stok <= min_stok / 2 THEN 0
          WHEN mevcut_stok <= min_stok THEN 1
          ELSE 2
        END,
        urun_adi ASC
    `;
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async addStock(id, count) {
    try {
      const sql = `UPDATE urunler SET mevcut_stok = mevcut_stok + ? WHERE id = ?`;
      const result = await db.query(sql, [count, id]);
      return result;
    } catch (err) {
      console.error("Product.addStock hata: ", err);
      throw err;
    }
  }

  static async decreaseStock(id, count) {
    try {
      const sql = `UPDATE urunler SET mevcut_stok = mevcut_stok - ? WHERE id = ?`;
      const result = await db.query(sql, [count, id]);
      return result;
    } catch (err) {
      console.error("Product.decreaseStock hata: ", err);
      throw err;
    }
  }
}

module.exports = Product;
