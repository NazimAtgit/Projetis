// Petits outils d'interface : échappement, avatars, dates, toasts, modales, badges.
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const AV_COLORS = ["#2f7d5b", "#b4602c", "#5b5fb0", "#2a7a9a", "#9a3b5a", "#6b7a2a", "#8a5a2b", "#3f6f8f"];
export function initials(name) {
  const words = String(name || "?").split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  return (words.slice(0, 2).map(w => w[0].toUpperCase()).join("")) || "?";
}
export function avatar(name, cls = "") {
  let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="avatar ${cls}" style="background:${AV_COLORS[h % AV_COLORS.length]}" title="${esc(name)}">${esc(initials(name))}</span>`;
}

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}
export function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function ago(iso) {
  if (!iso) return "";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return fmtDate(iso);
}

let toastTimer;
export function toast(msg, kind = "") {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.setAttribute("role", "status");
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), kind === "reward" ? 4200 : 2600);
}

// Modale : renvoie { el, close }. onSubmit(form) peut renvoyer false pour garder la modale ouverte.
export function modal({ title, body, submit = "Enregistrer", cancel = "Annuler", danger = "", onSubmit, onDanger, wide = false }) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<form class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="${wide ? "width:min(820px,100%)" : ""}">
    <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Fermer">✕</button></div>
    <div class="stack">${body}</div>
    <div class="modal-foot">
      ${danger ? `<button type="button" class="btn danger" data-danger>${esc(danger)}</button><span class="spacer"></span>` : ""}
      ${cancel ? `<button type="button" class="btn" data-close>${esc(cancel)}</button>` : ""}
      ${submit ? `<button type="submit" class="btn primary">${esc(submit)}</button>` : ""}
    </div></form>`;
  const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("click", e => { if (e.target === back || e.target.closest("[data-close]")) close(); });
  const form = back.querySelector("form");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!onSubmit) { close(); return; }
    const r = await onSubmit(form);
    if (r !== false) close();
  });
  back.querySelector("[data-danger]")?.addEventListener("click", async () => {
    const r = await onDanger?.();
    if (r !== false) close();
  });
  document.body.appendChild(back);
  setTimeout(() => form.querySelector("input:not([type=checkbox]),textarea,select")?.focus(), 30);
  return { el: back, close };
}

export function confirmBox(title, text, okLabel = "Confirmer") {
  return new Promise(resolve => {
    let done = false;
    const m = modal({
      title, body: `<p>${text}</p>`, submit: okLabel,
      onSubmit: () => { done = true; resolve(true); }
    });
    const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } });
    obs.observe(document.body, { childList: true });
  });
}

// --- Badges dessinés (médaille hexagonale cuivre + pictogramme) ---
const GLYPHS = {
  git: `<circle cx="9" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/><circle cx="16" cy="10" r="2.2"/><path d="M9 9.2v5.6M16 12.2c0 3-3 3-6.2 4" fill="none" stroke-width="1.8"/>`,
  step: `<path d="M6 17h4v-4h4V9h4" fill="none" stroke-width="2"/><path d="M15 6l3 3-3 3" fill="none" stroke-width="2"/>`,
  key: `<circle cx="9" cy="12" r="3.4" fill="none" stroke-width="2"/><path d="M12.4 12H19M16.5 12v2.6M19 12v2" fill="none" stroke-width="2"/>`,
  weight: `<path d="M7 18l1.6-8h6.8L17 18z"/><circle cx="12" cy="7.5" r="2" fill="none" stroke-width="1.8"/>`,
  clock: `<circle cx="12" cy="12" r="6" fill="none" stroke-width="2"/><path d="M12 8.5V12l2.6 1.8" fill="none" stroke-width="2"/>`,
  wave: `<path d="M5 14c2-4 3-4 4.5 0s2.5 4 4.5 0 3-4 5 0" fill="none" stroke-width="2"/>`,
  flag: `<path d="M8 19V5" fill="none" stroke-width="2"/><path d="M8 5.5h9l-2 3 2 3H8z"/>`,
  gear: `<circle cx="12" cy="12" r="2.4" fill="none" stroke-width="2"/><path d="M12 5v2.2M12 16.8V19M5 12h2.2M16.8 12H19M7 7l1.6 1.6M15.4 15.4L17 17M7 17l1.6-1.6M15.4 8.6L17 7" fill="none" stroke-width="2"/>`
};
export function badgeSvg(badge, earned = true) {
  const g = GLYPHS[badge.glyph] || GLYPHS.step;
  return `<svg viewBox="0 0 48 48" role="img" aria-label="${esc(badge.name)}${earned ? "" : " (à débloquer)"}">
    <path d="M24 2.5l18.6 10.75v21.5L24 45.5 5.4 34.75v-21.5z" fill="var(--copper)"/>
    <path d="M24 7l14.7 8.5v17L24 41 9.3 32.5v-17z" fill="var(--copper-soft)"/>
    <g transform="translate(12 12)" fill="var(--copper)" stroke="var(--copper)" stroke-linecap="round" stroke-linejoin="round">${g}</g>
  </svg>`;
}

export const brandMark = `<svg class="brand-mark" viewBox="0 0 34 34" aria-hidden="true">
  <rect x="1" y="1" width="32" height="32" rx="8" fill="var(--accent)"/>
  <path d="M8 11h8l4 4h6M8 23h5l4-4h9" fill="none" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round"/>
  <circle cx="26" cy="15" r="2.3" fill="var(--copper)"/><circle cx="26" cy="19" r="2.3" fill="var(--accent-ink)"/>
  <circle cx="8" cy="11" r="1.8" fill="var(--accent-ink)"/><circle cx="8" cy="23" r="1.8" fill="var(--accent-ink)"/>
</svg>`;
