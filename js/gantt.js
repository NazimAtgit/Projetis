// Diagramme de Gantt en SVG (un ou plusieurs projets), semaines en colonnes.
import { esc, initials, fmtDate } from "./ui.js";
import { tasksOf, weekOf, weekStartDate, userOf, STATUS_LABEL } from "./logic.js";

const COLOR = { backlog: "var(--muted)", en_cours: "var(--info)", bloque: "var(--crit)", a_valider: "var(--warn)", fait: "var(--good)" };

export function ganttLegend() {
  return `<div class="legend">${Object.entries(COLOR).map(([k, c]) =>
    `<span><i class="dot" style="background:${c}"></i>${STATUS_LABEL[k]}</span>`).join("")}
    <span><svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 0l6 6-6 6-6-6z" fill="var(--copper)"/></svg>Jalon noté</span>
    <span><i class="dot" style="background:var(--accent-soft);border:1px solid var(--line)"></i>Semaine en cours</span></div>`;
}

export function gantt(projects, { compact = false } = {}) {
  if (!projects.length) return `<div class="empty">Aucun projet.</div>`;
  const weeks = Math.max(...projects.map(p => p.weeks || 8));
  const labelW = compact ? 230 : 300, weekW = 84, rowH = compact ? 26 : 30, headH = 58;
  const W = labelW + weeks * weekW + 16;
  const multi = projects.length > 1;
  const rows = [];
  for (const p of projects) {
    if (multi) rows.push({ type: "group", p });
    for (const t of tasksOf(p.id)) rows.push({ type: "task", p, t });
    if (!tasksOf(p.id).length) rows.push({ type: "none", p });
  }
  const H = headH + rows.length * rowH + 12;
  const ref = projects[0];
  const cur = weekOf(ref);
  const x = w => labelW + (w - 1) * weekW;
  let s = `<svg class="gantt" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagramme de Gantt">`;
  if (cur >= 1 && cur <= weeks) s += `<rect class="today" x="${x(cur)}" y="${headH - 22}" width="${weekW}" height="${H - headH + 22}"/>`;
  for (let w = 1; w <= weeks; w++) {
    s += `<text class="wk" x="${x(w) + weekW / 2}" y="${headH - 30}" text-anchor="middle">S${w}</text>`;
    s += `<text class="lbl-sec" x="${x(w) + weekW / 2}" y="${headH - 16}" text-anchor="middle">${esc(fmtDate(weekStartDate(ref, w).toISOString()))}</text>`;
    s += `<line class="gridl" x1="${x(w)}" x2="${x(w)}" y1="${headH - 22}" y2="${H}"/>`;
  }
  s += `<line class="gridl" x1="${x(weeks + 1)}" x2="${x(weeks + 1)}" y1="${headH - 22}" y2="${H}"/>`;
  s += `<line class="gridl" x1="0" x2="${W}" y1="${headH}" y2="${headH}"/>`;
  // Jalons (du premier projet si un seul, sinon communs) dans l'en-tête.
  const msSet = multi ? (ref.milestones || []) : (ref.milestones || []);
  for (const m of msSet) {
    const mx = x(m.week + 1);
    s += `<path class="ms" d="M${mx} ${headH - 8}l6 6-6 6-6-6z"><title>${esc(m.name)} (fin S${m.week})</title></path>`;
    s += `<line x1="${mx}" x2="${mx}" y1="${headH + 4}" y2="${H}" stroke="var(--copper)" stroke-dasharray="3 4" opacity=".55"/>`;
  }
  rows.forEach((r, i) => {
    const y = headH + i * rowH;
    const cy = y + rowH / 2;
    if (r.type === "group") {
      s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="var(--surface-2)"/>`;
      s += `<rect x="12" y="${cy - 6}" width="12" height="12" rx="3" fill="${esc(r.p.color)}"/>`;
      s += `<a href="#/projet/${esc(r.p.id)}/gantt"><text class="grp" x="32" y="${cy + 4.5}">${esc(r.p.code)} · ${esc(r.p.name)}</text></a>`;
      return;
    }
    if (r.type === "none") { s += `<text class="lbl-sec" x="16" y="${cy + 4}">Aucune tâche</text>`; return; }
    const t = r.t;
    const maxChars = Math.floor((labelW - 30) / 6.6);
    const title = t.title.length > maxChars ? t.title.slice(0, maxChars - 1) + "…" : t.title;
    s += `<g class="bar-r" data-action="open-task" data-id="${esc(t.id)}">`;
    s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>`;
    s += `<text class="lbl" x="16" y="${cy + 4}">${t.kind === "diagnostic" ? "⚠ " : ""}${esc(title)}<title>${esc(t.title)}</title></text>`;
    const bx = x(t.weekStart) + 4, bw = Math.max(10, (t.weekEnd - t.weekStart + 1) * weekW - 8);
    const c = COLOR[t.status] || COLOR.backlog;
    s += `<rect x="${bx}" y="${cy - 8}" width="${bw}" height="16" rx="5" fill="${c}" fill-opacity="${t.status === "backlog" ? .22 : .85}" stroke="${c}"/>`;
    const who = t.assignee ? userOf(t.assignee)?.name : "";
    if (who) s += `<text class="lbl-sec" x="${bx + bw + 6}" y="${cy + 4}">${esc(initials(who))}</text>`;
    s += `<title>${esc(t.title)} · S${t.weekStart}–S${t.weekEnd} · ${esc(STATUS_LABEL[t.status])}${who ? " · " + esc(who) : ""}</title></g>`;
  });
  s += `</svg>`;
  return `<div class="gantt-wrap">${s}</div>`;
}
