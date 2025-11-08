const buttons = document.querySelectorAll(".select-btn");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
});

const selectors = document.querySelectorAll(".selectable");

selectors.forEach((item) => {
  item.addEventListener("click", () => {
    selectors.forEach((el) => {
      el.classList.remove("selected");
      const oldCheck = el.querySelector(".checkmark");
      if (oldCheck) oldCheck.remove();
    });

    item.classList.add("selected");

    const contentArea = item.children[1];
    if (!contentArea.querySelector(".checkmark")) {
      const checkMark = document.createElement("div");
      checkMark.className = "checkmark";

      const icon = document.createElement("span");
      icon.className = "bx bx-check";

      checkMark.appendChild(icon);
      contentArea.appendChild(checkMark);
    }
  });
});
