const STORAGE_KEY = "sarsan-theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage puede fallar en modo privado; seguimos con la preferencia del sistema.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Aplica el tema en <html>, no en un wrapper interno — ver la nota en src/styles.css
// sobre el bug de modo oscuro del prototipo de Lovable.
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // per-viewer only; no pasa nada si no se puede guardar.
  }
}
