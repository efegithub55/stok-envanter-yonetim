const togglers = document.querySelectorAll(".view-toggle-btn");

togglers.forEach((btn) => {
  btn.addEventListener("click", () => {
    var data = btn.dataset.view;
    togglers.forEach((toggler) => {
      var dataset = toggler.dataset.view;
      document.querySelector("." + dataset + "-view").classList.add("hidden");
      toggler.classList.remove("active");
    });
    btn.classList.add("active");
    document.querySelector("." + data + "-view").classList.remove("hidden");
  });
});
