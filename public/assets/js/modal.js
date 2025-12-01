document.addEventListener("DOMContentLoaded", () => {
  const openModal = document.querySelector(".addCategoryBtn");
  const modalContainer = document.querySelectorAll(".modal-container");
  const closeBtn = document.querySelector(".modal-close");
  modalContainer.forEach((container) => {
    openModal.addEventListener("click", () => {
      container.classList.remove("hidden");
    });
    closeBtn.addEventListener("click", () => {
      container.classList.add("hidden");
    });
  });
});
