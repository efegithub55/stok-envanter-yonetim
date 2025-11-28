document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.querySelector(".filter-form");
  if (!filterForm) return;

  // FİYAT HIZLI SEÇİM kısmı (daha önce yazdığımız)
  const minInput = filterForm.querySelector('input[name="minPrice"]');
  const maxInput = filterForm.querySelector('input[name="maxPrice"]');
  const quickButtons = filterForm.querySelectorAll(".select-btn");

  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isAlreadySelected = btn.classList.contains("selected");

      quickButtons.forEach((b) => b.classList.remove("selected"));

      if (isAlreadySelected) {
        if (minInput) minInput.value = "";
        if (maxInput) maxInput.value = "";
      } else {
        btn.classList.add("selected");
        const min = btn.dataset.min ?? "";
        const max = btn.dataset.max ?? "";
        if (minInput) minInput.value = min;
        if (maxInput) maxInput.value = max;
      }
    });
  });

  // SIRALAMA SEÇİMİ
  const selectors = filterForm.querySelectorAll(".selectable");
  let sortInput = filterForm.querySelector('input[name="sort"]');

  if (!sortInput) {
    sortInput = document.createElement("input");
    sortInput.type = "hidden";
    sortInput.name = "sort";
    sortInput.value = "newest";
    filterForm.appendChild(sortInput);
  }

  selectors.forEach((item) => {
    item.addEventListener("click", () => {
      // Görsel kısım: selected + checkmark
      selectors.forEach((el) => {
        el.classList.remove("selected");
        const oldCheck = el.querySelector(".checkmark");
        if (oldCheck) oldCheck.remove();
      });

      item.classList.add("selected");

      const cols = item.querySelectorAll(".col");
      const contentArea = cols[cols.length - 1];

      if (contentArea && !contentArea.querySelector(".checkmark")) {
        const checkMark = document.createElement("div");
        checkMark.className = "checkmark";

        const icon = document.createElement("span");
        icon.className = "bxr bx-check";

        checkMark.appendChild(icon);
        contentArea.appendChild(checkMark);
      }

      // ✅ Backend'e gidecek sort paramını yaz
      const sortValue = item.dataset.sort || "newest";
      sortInput.value = sortValue;

      // ✅ Seçildiği anda formu gönder
      filterForm.submit();
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.querySelector(".filter-form");
  if (!filterForm) return;

  const searchInput = filterForm.querySelector('input[name="productSearch"]');
  const tbody = document.querySelector("#products-tbody");

  if (!searchInput || !tbody) return;

  let timer;

  searchInput.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      const formData = new FormData(filterForm);
      const params = new URLSearchParams(formData);

      // Arama yaparken sayfayı 1'e çek
      params.set("page", "1");

      fetch(`/urun-yonetimi/urunler/search?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.html !== undefined) {
            tbody.innerHTML = data.html;
            // renkler vs için yeniden init gerekirse burada çağır
            if (window.initCategoryBadges) {
              window.initCategoryBadges();
            }
          }
        })
        .catch((err) => {
          console.error("Arama hatası:", err);
        });
    }, 300); // debounce 300ms
  });
});
