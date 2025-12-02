document.addEventListener("DOMContentLoaded", () => {
  const selectBtn = document.querySelector(".select-all");
  const selectableItems = document.querySelectorAll(".select-checkbox");

  selectBtn.addEventListener("change", (e) => {
    selectableItems.forEach((item) => {
      item.checked = e.target.checked;
    });
  });
});
