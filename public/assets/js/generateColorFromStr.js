function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  const saturation = 65 + (hash % 20);
  const lightness = 85 + (hash % 10);

  return {
    background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: `hsl(${hue}, ${saturation}%, 25%)`,
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const badges = document.querySelectorAll(".category-badge");

  badges.forEach((badge) => {
    const label = badge.dataset.label;
    if (!label) return;
    const color = generateColorFromString(label);
    badge.innerHTML = label;
    badge.style.background = color.background;
    badge.style.color = color.text;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const flexIcons = document.querySelectorAll(".flexbox-icon");
  flexIcons.forEach((item) => {
    const icon = item.dataset.icon;
    if (!icon) return;
    const color = generateColorFromString(icon);

    item.classList.add("bx-" + icon);
    item.style.background = color.background;
    item.style.color = color.text;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const categoryBoxes = document.querySelectorAll(".category-box");

  categoryBoxes.forEach((box) => {
    const label = box.dataset.label;
    if (!label) return;
    const color = generateColorFromString(label);

    box.style.setProperty("--before-color", color.text);
  });
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;

      if (node.classList.contains("category-badge")) {
        const label = node.dataset.label;
        if (label) {
          const color = generateColorFromString(label);
          node.innerHTML = label;
          node.style.background = color.background;
          node.style.color = color.text;
        }
      }

      const badges = node.querySelectorAll?.(".category-badge") || [];
      badges.forEach((badge) => {
        const label = badge.dataset.label;
        if (!label) return;
        const color = generateColorFromString(label);
        badge.innerHTML = label;
        badge.style.background = color.background;
        badge.style.color = color.text;
      });

      const flexIcons = node.querySelectorAll?.(".flexbox-icon") || [];
      flexIcons.forEach((item) => {
        const icon = item.dataset.icon;
        if (!icon) return;
        const color = generateColorFromString(icon);
        item.classList.add("bx-" + icon);
        item.style.background = color.background;
        item.style.color = color.text;
      });

      const categoryBoxes = node.querySelectorAll?.(".category-box") || [];
      categoryBoxes.forEach((box) => {
        const label = box.dataset.label;
        if (!label) return;
        const color = generateColorFromString(label);
        box.style.setProperty("--before-color", color.text);
      });
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
