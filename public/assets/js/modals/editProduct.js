const buttons = document.querySelectorAll(".edit-product-btn");
const url = window.location.origin;

let modal;

buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    let productId = btn.dataset.productId;
    const response = await fetch(`${url}/api/urunler/${productId}`);
    const data = await response.json();

    const categoriesRes = await fetch(`${url}/api/kategoriler`);
    const categories = await categoriesRes.json();
    const categoryOptions = categories
      .map(
        (cat) =>
          `<option value="${cat.id}" ${
            cat.id == data.kategori_id ? "selected" : ""
          }>${cat.kategori_adi}</option>`
      )
      .join("");
    modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-close"><span class="bxr bx-x"></span></div>
        <div class="modal-header">Ürün Düzenle - ${data.urun_adi}</div>
        <div class="modal-content">
          <form action='/urun-yonetimi/urunler/duzenle/${data.id}' method='POST' class='modal-form'>
            <div class='modal-inp-row'>
              <label for='urun_adi'>Ürün adı</label>
              <input type='text' name='urun_adi' value='${data.urun_adi}' required placeholder='' />
            </div>
            <div class='modal-inp-row'>
              <label for='sku'>Stok kodu</label>
              <input type='text' value='${data.sku}' name='sku' required placeholder='' />
            </div>
            <div class='modal-inp-row'>
              <label for='kategori_id'>Kategori</label>
              <select name='kategori_id'>
                ${categoryOptions}
              </select>
            </div>
            <div class='modal-inp-row'>
              <label for='alis_fiyati'>Alış fiyatı</label>
              <input type='text' name='alis_fiyati' value='${data.alis_fiyati}' required placeholder='' />
            </div>
            <div class='modal-inp-row'>
              <label for='satis_fiyati'>Satış fiyatı</label>
              <input type='text' name='satis_fiyati' value='${data.satis_fiyati}' required placeholder='' />
            </div>
            <button type='submit' class='btn btn-primary center'>Kaydet</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector(".modal-close");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  });
});
