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

    // 🔹 Stok filtresi
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

    // 🔹 Kategori filtresi
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => "?").join(",");
      whereClauses.push(`u.kategori_id IN (${placeholders})`);
      params.push(...categories);
    }

    // 🔹 Fiyat filtresi
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

    // 🔹 Arama filtresi (ürün adı, sku, barkod, açıklama)
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

    // 🔹 Toplam kayıt
    const countSql = `
    SELECT COUNT(*) AS total
    FROM urunler u
    ${whereSql}
  `;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    // 🔹 Sıralama
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
}

module.exports = Product;
