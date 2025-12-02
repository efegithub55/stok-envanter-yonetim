document.addEventListener("click", async (e) => {
  // Düzenle butonu
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    const row = document.querySelector(`tr[data-id="${id}"]`);

    // view mode -> edit mode geçiş
    row
      .querySelectorAll(".view-mode")
      .forEach((el) => (el.style.display = "none"));
    row
      .querySelectorAll(".edit-mode")
      .forEach((el) => (el.style.display = "block"));

    // KAYDET + İPTAL BUTONLARINI EKLE
    if (!row.querySelector(".edit-buttons")) {
      const btns = document.createElement("div");
      btns.className = "edit-buttons";

      btns.innerHTML = `
        <button class="save-btn" data-id="${id}">Kaydet</button>
        <button class="cancel-btn" data-id="${id}">İptal</button>
      `;

      row.lastElementChild.appendChild(btns);
    }
  }

  // İptal butonu
  if (e.target.classList.contains("cancel-btn")) {
    const id = e.target.dataset.id;
    const row = document.querySelector(`tr[data-id="${id}"]`);

    // edit-mode'u gizle, view-mode'u göster
    row.querySelectorAll(".view-mode").forEach((el) => (el.style.display = ""));
    row
      .querySelectorAll(".edit-mode")
      .forEach((el) => (el.style.display = "none"));

    // butonları kaldır
    row.querySelector(".edit-buttons").remove();
  }

  // Kaydet butonu
  if (e.target.classList.contains("save-btn")) {
    const id = e.target.dataset.id;
    const row = document.querySelector(`tr[data-id="${id}"]`);

    // input verilerini çek
    const newData = {
      urun_adi: row.querySelector(".edit-name").value,
      sku: row.querySelector(".edit-sku").value,
      kategori_adi: row.querySelector(".edit-category").value,
      stok: row.querySelector(".edit-stock").value,
      fiyat: row.querySelector(".edit-price").value,
    };

    // ***** AJAX ile backend'e gönder *****
    const res = await fetch(`/urunler/${id}/guncelle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });

    const result = await res.json();

    if (result.success) {
      // Ekranı güncelle
      row.querySelector(".product-name-cell .view-mode a").textContent =
        newData.urun_adi;
      row.querySelector(".product-name-cell .view-mode p").textContent =
        "#" + newData.sku;
      row.querySelector(".category-cell .view-mode").textContent =
        newData.kategori_adi;
      row.querySelector(".stock-cell .view-mode").textContent = newData.stok;
      row.querySelector(
        ".price-cell .view-mode"
      ).innerHTML = `<span class="bxr bx-lira"></span>${newData.fiyat}`;

      // görünüm moduna dön
      row
        .querySelectorAll(".view-mode")
        .forEach((el) => (el.style.display = ""));
      row
        .querySelectorAll(".edit-mode")
        .forEach((el) => (el.style.display = "none"));

      // butonları kaldır
      row.querySelector(".edit-buttons").remove();
    } else {
      alert("Güncelleme başarısız!");
    }
  }
});
