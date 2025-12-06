export function showToast(message: string, duration = 2500) {
  const existing = document.querySelector<HTMLDivElement>(".app-toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = "app-toast";
  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add("is-visible"));

  setTimeout(() => {
    el.classList.remove("is-visible");
    el.addEventListener(
      "transitionend",
      () => {
        el.remove();
      },
      { once: true }
    );
  }, duration);
}
