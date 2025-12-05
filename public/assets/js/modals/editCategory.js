const buttons = document.querySelectorAll(".edit-category-btn");
const url = window.location.origin;

buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    let modal;
    let categoryId = btn.dataset.categoryId;

    const response = await fetch(`${url}/api/kategori/${categoryId}`);
    const data = await response.json();

    modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-close"><span class="bxr bx-x"></span></div>
        <div class="modal-header">Kategori Düzenle - ${data.kategori_adi}</div>
        <div class="modal-content">
          <form action='/urun-yonetimi/kategoriler/duzenle/${data.id}' method='POST' class='modal-form'>
            <div class='modal-inp-row'>
              <label for='kategori_adi'>Kategori adı</label>
              <input type='text' name='kategori_adi' value='${data.kategori_adi}' required placeholder='' />
            </div>
            <div class='modal-inp-row'>
              <label for='aciklama'>Kategori açıklaması</label>
              <textarea name='aciklama'>${data.aciklama}</textarea>
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
