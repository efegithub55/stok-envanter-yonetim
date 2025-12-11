const btn = document.querySelector(".add-category-btn");
let modal;
btn.addEventListener("click", () => {
  modal = document.createElement("div");
  modal.className = "modal-container";
  modal.innerHTML = `
      <div class='modal'>
        <div class='modal-close'><span class='bxr bx-x'></span></div>
        <div class='modal-header'>Kategori Ekle</div>
        <div class='modal-content'>
          <form action='/urun-yonetimi/kategoriler/ekle' method='POST' class='modal-form'>
            <div class='modal-inp-row'>
              <label for='kategori_adi'>Kategori Adı</label>
              <input type='text' placeholder='' name='kategori_adi' />
            </div>
            <div class='modal-inp-row'>
              <label for='aciklama'>Kategori Açıklaması</label>
              <textarea placeholder='' name='aciklama' /></textarea>
            </div>
            <button type='submit' class='btn btn-primary center'>Ekle</button>
          </form>
        </div>
      </div>
    `;
  document.body.appendChild(modal);
  var closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
});
