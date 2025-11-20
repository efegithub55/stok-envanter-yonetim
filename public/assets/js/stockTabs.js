const buttons = document.querySelectorAll(".ct-tab-btn");
const containers = document.querySelectorAll(".product-container");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    target = btn.dataset.target;
    // Butonlar arası geçiş
    buttons.forEach((item) => {
      item.classList.remove("active");
    });
    btn.classList.add("active");

    // Sekmeler arası geçiş
    containers.forEach((container) => {
      container.classList.add("hidden");
      if (container.dataset.id == target) {
        container.classList.remove("hidden");
      }
    });
  });
});
