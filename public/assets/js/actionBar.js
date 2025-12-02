document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".action-container");

  // Sayfada tıklama yakalama
  document.addEventListener("click", (e) => {
    let clickedOnAnyButton = false;

    containers.forEach((container) => {
      const btn = container.querySelector(".act-btn");
      const menu = container.querySelector(".action-bar");

      // Butona tıklandıysa
      if (btn.contains(e.target)) {
        clickedOnAnyButton = true;

        // Önce tüm menüleri kapat
        document.querySelectorAll(".action-bar").forEach((m) => {
          m.style.display = "none";
          m.classList.remove("open-up");
        });

        // Şimdi bu butona ait menüyü açmadan konum hesapla
        // Önce block yap ki yüksekliği ölçelim
        menu.style.display = "block";
        menu.classList.remove("open-up");

        const btnRect = btn.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;

        // Aşağıda yer yok ama yukarıda yeterince yer varsa → yukarı aç
        if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
          menu.classList.add("open-up");
        } else {
          menu.classList.remove("open-up");
        }
      } else {
        // Butona değil, başka yere tıklandıysa
        // Eğer tıklanan yer bu menünün içinde değilse kapat
        if (!menu.contains(e.target)) {
          menu.style.display = "none";
          menu.classList.remove("open-up");
        }
      }
    });

    // Hiçbir butona tıklanmadıysa ve menü dışına basıldıysa hepsini kapat
    if (!clickedOnAnyButton && !e.target.closest(".action-bar")) {
      document.querySelectorAll(".action-bar").forEach((m) => {
        m.style.display = "none";
        m.classList.remove("open-up");
      });
    }
  });
});
