// Vues (HTML) de l'encadrant et des étudiants.
import { store } from "./store.js";
import { CONFIG } from "./config.js";
import {
  STATUSES, STATUS_LABEL, STATE_LABEL, LABELS, SIZES, BADGES, LEVELS,
  projectOf, userOf, taskOf, tasksOf, membersOf, weekOf, weekEndDate, basePoints, onTime,
  userStats, projectHealth, tutorialDone, currentTasks, nextTaskFor, milestonesHeld
} from "./logic.js";
import { esc, avatar, fmtDate, ago, badgeSvg } from "./ui.js";
import { gantt, ganttLegend } from "./gantt.js";
import { TUTORIAL_STEPS, TUTORIAL_QUIZ, GUIDE_URL } from "./tutorial.js";

const pill = (cls, label) => `<span class="pill ${cls}">${esc(label)}</span>`;
const statusPill = s => pill(s, STATUS_LABEL[s] || s);
const sizeTag = s => `<span class="size ${s}" title="${esc(SIZES[s] || "")}">${esc(s)}</span>`;
const pct = x => Math.round(x * 100);
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// ---------- Icônes (traits 1.8 px, 20 × 20) ----------
const ICONS = {
  home: '<path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z"/>',
  inbox: '<path d="M3 11h4l1.5 2h3L13 11h4"/><path d="M5 4h10l2 7v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z"/>',
  calendar: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h4l1.5 2H16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="7.5" cy="7.5" r="2.8"/><path d="M2.5 16c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/><circle cx="14" cy="8" r="2.2"/><path d="M13.5 12.1c1.9.2 3.3 1.5 3.8 3.4"/>',
  trophy: '<path d="M6.5 3.5h7v4a3.5 3.5 0 0 1-7 0z"/><path d="M6.5 5H4v1.5A2.5 2.5 0 0 0 6.5 9M13.5 5H16v1.5A2.5 2.5 0 0 1 13.5 9M10 11v3M7 16.5h6"/>',
  shield: '<path d="M10 3 16 5.5V10c0 3.5-2.6 6-6 7-3.4-1-6-3.5-6-7V5.5z"/><path d="m7.5 10 1.8 1.8 3.2-3.3"/>',
  settings: '<circle cx="10" cy="10" r="2.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v12H5.5A1.5 1.5 0 0 0 4 16.5z"/><path d="M4 16.5A1.5 1.5 0 0 0 5.5 18H16v-3"/>',
  git: '<circle cx="6.5" cy="5" r="1.8"/><circle cx="6.5" cy="15" r="1.8"/><circle cx="13.5" cy="8" r="1.8"/><path d="M6.5 6.8v6.4M13.5 9.8c0 3-3.5 3.2-6.2 4"/>',
  star: '<path d="m10 3 2.1 4.4 4.9.6-3.6 3.3.9 4.8L10 13.8 5.7 16.1l.9-4.8L3 8l4.9-.6z"/>',
  logout: '<path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 6.5 15.5 10 12 13.5M15.5 10H8"/>'
};
const icon = name => `<svg class="ico" viewBox="0 0 20 20" aria-hidden="true">${ICONS[name] || ""}</svg>`;

export function logoMark(cls = "") {
  // « solid » = sur fond clair : logo couleur ; sinon fond bleu marine : logo blanc s'il existe.
  const white = cls !== "solid" && CONFIG.logoWhiteUrl;
  return CONFIG.logoUrl
    ? `<span class="logo-tile ${cls} ${white ? "white" : ""}"><img src="${esc(white || CONFIG.logoUrl)}" alt="ESST, École Supérieure des Sciences et Technologies"></span>`
    : `<span class="logo-mark ${cls}" aria-label="ESST">ESST</span>`;
}

// ---------- Cadre ----------
export function shell(route, content) {
  const admin = store.isAdmin();
  const s = store.session;
  const tv = store.data.tasks.filter(t => t.status === "a_valider").length;
  const pb = store.data.tasks.filter(t => t.status === "bloque").length;
  const me = userOf(s.email);
  const link = (href, ic, label, extra = "") => {
    const cur = "#/" + route.join("/");
    const on = (cur === href || (href !== "#/" && cur.startsWith(href + "/"))) ? "on" : "";
    return `<a href="${href}" class="${on}" ${on ? 'aria-current="page"' : ""}>${ic ? icon(ic) : ""}<span>${label}</span>${extra}</a>`;
  };
  const ext = `<a href="${GUIDE_URL}" target="_blank" rel="noopener">${icon("book")}<span>Guide Git</span></a>`;
  const nav = admin ? `
      ${link("#/", "home", "Tableau de bord")}
      ${link("#/validation", "inbox", "À traiter", tv + pb ? `<span class="count">${tv + pb}</span>` : "")}
      ${link("#/planning", "calendar", "Planning")}
      ${link("#/projets", "folder", "Projets")}
      ${link("#/etudiants", "users", "Étudiants")}
      ${link("#/classement", "trophy", "Classement")}
      ${store.isRoot() ? link("#/encadrants", "shield", "Encadrants") : ""}
      ${link("#/reglages", "settings", "Réglages")}
      ${ext}
      ${store.data.projects.length ? `<div class="nav-label">Projets</div>` : ""}
      ${store.data.projects.map(p => link(`#/projet/${p.id}`, "", `<i class="dot" style="background:${esc(p.color)}"></i>${esc(p.code)} <span class="nav-sub">${esc(p.name)}</span>`)).join("")}`
    : `
      ${link("#/", "home", "Mon espace")}
      ${link("#/tutoriel", "git", "Tutoriel GitHub", tutorialDone(me) ? "" : `<span class="count">1</span>`)}
      ${me ? link(`#/projet/${me.projectId}`, "folder", "Mon projet") : ""}
      ${store.data.settings.leaderboardVisible ? link("#/classement", "trophy", "Classement") : ""}
      ${ext}`;
  const demo = store.mode === "demo" ? demoBar() : "";
  const role = store.isRoot() ? "Administrateur" : admin ? "Encadrant" : esc(projectOf(me?.projectId)?.name || "");
  return `${demo}<div class="shell">
    <aside class="side">
      <a class="brand ${CONFIG.logoUrl ? "has-logo" : ""}" href="#/">${logoMark()}<div><b>${esc(CONFIG.appName)}</b><span>${esc(CONFIG.schoolName || "ESST")}</span></div></a>
      <nav class="nav" aria-label="Navigation">${nav}</nav>
      <div class="side-foot">
        <div class="who">${avatar(s.name)}<div><b>${esc(s.name)}</b><small>${role}</small></div></div>
        ${store.mode === "firebase" ? `<button class="icon-btn on-dark" data-action="logout" title="Se déconnecter" aria-label="Se déconnecter">${icon("logout")}</button>` : ""}
      </div>
    </aside>
    <main class="main" id="main">${content}</main>
  </div>`;
}

function demoBar() {
  const sel = v => store.session.email === v ? "selected" : "";
  const opts = [`<option value="${esc(store.adminSession().email)}" ${store.isRoot() ? "selected" : ""}>Administrateur</option>`]
    .concat(store.raw.supervisors.length ? [`<optgroup label="Encadrants">${store.raw.supervisors.map(x => `<option value="${esc(x.id)}" ${sel(x.id)}>${esc(x.name)}</option>`).join("")}</optgroup>`] : [])
    .concat(store.raw.projects.map(p => `<optgroup label="${esc(p.code + " – " + p.name)}">${store.raw.users.filter(u => u.projectId === p.id).map(u =>
      `<option value="${esc(u.id)}" ${sel(u.id)}>${esc(u.name)}</option>`).join("")}</optgroup>`)).join("");
  return `<div class="demo-bar"><b>Mode démo</b><span>Données d'exemple, enregistrées dans ce navigateur.</span>
    <label for="demo-as">Voir en tant que</label><select id="demo-as" data-action="demo-as">${opts}</select>
    <button class="btn small" data-action="reset-demo">Réinitialiser</button></div>`;
}

const GOOGLE_G = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
const TRACES = `<svg class="traces" viewBox="0 0 620 520" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="2.5"><path d="M20 80h180l60 60h200M20 200h120l40-40h260l40 40h120M80 320h220l60 60h240M20 440h300l40-40h220"/><rect x="300" y="240" width="140" height="90" rx="10"/></g><g fill="currentColor"><circle cx="460" cy="140" r="8"/><circle cx="580" cy="200" r="8"/><circle cx="600" cy="380" r="8"/><circle cx="580" cy="400" r="8"/><circle cx="20" cy="80" r="6"/><circle cx="20" cy="200" r="6"/><circle cx="80" cy="320" r="6"/><circle cx="20" cy="440" r="6"/></g></svg>`;

function authFrame(inner) {
  const np = store.raw.projects.length, nt = store.raw.tasks.length;
  return `<div class="auth">
    <section class="auth-brand">
      <div class="auth-logo">${logoMark("on-navy")}${CONFIG.logoUrl ? `<div><b>${esc(CONFIG.appName)}</b></div>` : `<div><b>${esc(CONFIG.schoolFullName || "École Supérieure des Sciences et Technologies")}</b><span>${esc(CONFIG.appName)}</span></div>`}</div>
      <h1>PROJETIS : Construisez. Livrez. <span class="hl">Progressez.</span></h1>
      <p>Tâches planifiées, diagramme de Gantt, validation par l'encadrant et progression récompensée, pour chaque groupe.</p>
      ${np ? `<dl class="auth-stats"><div><dt>${np}</dt><dd>projets en cours</dd></div><div><dt>${nt}</dt><dd>tâches planifiées</dd></div></dl>` : ""}
      ${TRACES}
    </section>
    <section class="auth-panel"><div class="auth-card">${inner}</div></section>
  </div>`;
}

export function loginView() {
  return authFrame(`${logoMark("solid")}
    <h2>Bienvenue</h2>
    <p class="muted">Connectez-vous avec le compte Google que vous avez communiqué à votre encadrant.</p>
    <button class="gbtn" data-action="login">${GOOGLE_G}Se connecter avec Google</button>
    <ul class="roles"><li><b>Étudiant</b>vos tâches et vos badges</li><li><b>Encadrant</b>le suivi de vos groupes</li><li><b>Administrateur</b>la vue d'ensemble</li></ul>
    <p class="small muted">Première connexion ? Lisez d'abord le <a href="${GUIDE_URL}" target="_blank" rel="noopener">guide Git et GitHub</a>.</p>`);
}

export function pendingView() {
  return authFrame(`${logoMark("solid")}
    <h2>Compte pas encore inscrit</h2>
    <p>Vous êtes connecté avec <b>${esc(store.session.email)}</b>, mais cette adresse n'est rattachée à aucun projet.</p>
    <p class="muted">Envoyez cette adresse à votre encadrant pour qu'il vous inscrive, puis rechargez la page.</p>
    <button class="btn" data-action="logout">Changer de compte</button>`);
}

// ---------- Tableau de bord encadrant ----------
function progressChart(health) {
  if (!health.length) return "";
  const rowH = 44, labelW = 210, barW = 400, W = labelW + barW + 120, H = health.length * rowH + 34;
  const goal = 0.75;
  const gx = labelW + goal * barW;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Avancement de chaque projet en points validés">`;
  s += `<line x1="${gx}" x2="${gx}" y1="4" y2="${H - 22}" class="goal"/><text x="${gx}" y="${H - 6}" text-anchor="middle" class="axis">objectif 75 %</text>`;
  health.forEach(({ p, h }, i) => {
    const y = 8 + i * rowH, v = Math.max(0, Math.min(1, h.progress));
    const w = Math.max(v * barW, v > 0 ? 8 : 0);
    s += `<a href="#/projet/${esc(p.id)}"><g class="bar-row"><title>${esc(p.name)} : ${pct(v)} % des points validés</title>
      <text x="0" y="${y + 15}" class="lbl">${esc(p.code)} <tspan class="lbl-sub">${esc(p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name)}</tspan></text>
      <rect x="${labelW}" y="${y + 2}" width="${barW}" height="18" rx="9" class="track"/>
      ${w ? `<rect x="${labelW}" y="${y + 2}" width="${w}" height="18" rx="9" fill="${esc(p.color)}"/>` : ""}
      <text x="${labelW + w + 8}" y="${y + 15}" class="val">${pct(v)} %</text>
      ${h.state !== "ok" ? `<text x="${labelW + w + 52}" y="${y + 15}" class="flag ${h.state}">${esc(STATE_LABEL[h.state].toLowerCase())}</text>` : ""}
    </g></a>`;
  });
  return s + `</svg>`;
}

export function adminDashboard() {
  const ps = store.data.projects;
  const now = new Date();
  const wk = ps[0] ? weekOf(ps[0]) : 1;
  const wks = ps[0]?.weeks || 8;
  const tasks = store.data.tasks;
  const tv = tasks.filter(t => t.status === "a_valider");
  const pb = tasks.filter(t => t.status === "bloque");
  const health = ps.map(p => ({ p, h: projectHealth(p) }));
  const avg = health.length ? health.reduce((a, x) => a + x.h.progress, 0) / health.length : 0;
  const late = health.filter(x => x.h.state !== "ok").length;
  const students = store.data.users;
  const tuto = students.filter(tutorialDone).length;
  const oldest = tv.slice().sort((a, b) => (a.submittedAt || "").localeCompare(b.submittedAt || ""))[0];
  const first = store.session.name.split(" ").find(w => w && w !== w.toUpperCase()) || store.session.name.split(" ")[0];
  const ring = v => `<svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="22" class="ring-track"/><circle cx="28" cy="28" r="22" class="ring-val" stroke-dasharray="${(v * 138.2).toFixed(1)} 138.2" transform="rotate(-90 28 28)"/></svg>`;
  return `<div class="page-head"><div><h1>Bonjour ${esc(first)}</h1><p>Semaine ${wk} sur ${wks}, ${JOURS[now.getDay()]} ${fmtDate(now.toISOString())}</p></div>
    <div class="actions"><a class="btn" href="#/planning">Planning</a><button class="btn primary" data-action="new-task">Nouvelle tâche</button></div></div>
  <div class="kpis">
    <a class="kpi" href="#/validation"><span class="k-lbl">À valider</span><b class="${tv.length ? "warn" : ""}">${tv.length}</b><span class="k-sub">${oldest ? `la plus ancienne ${esc(ago(oldest.submittedAt))}` : "rien en attente"}</span></a>
    <a class="kpi" href="#/validation"><span class="k-lbl">Problèmes ouverts</span><b class="${pb.length ? "crit" : ""}">${pb.length}</b><span class="k-sub">${pb[0] ? esc(projectOf(pb[0].projectId)?.code + " : " + pb[0].title) : "aucun blocage"}</span></a>
    <a class="kpi" href="#/projets"><span class="k-lbl">Avancement moyen</span><b>${pct(avg)} %</b><span class="k-sub">${late ? `${late} groupe${late > 1 ? "s" : ""} en retard` : "tous les groupes à l'heure"}</span>${ring(avg)}</a>
    <a class="kpi" href="#/etudiants"><span class="k-lbl">Tutoriels GitHub</span><b>${tuto}<small>/${students.length}</small></b><span class="k-sub">${students.length - tuto ? `${students.length - tuto} à terminer` : "tous terminés"}</span></a>
  </div>
  <div class="dash-grid">
    <section class="card"><div class="card-head"><h2>Avancement par projet</h2><span class="muted small">points validés sur le total prévu</span></div>
      ${health.length ? `<div class="chart-wrap">${progressChart(health)}</div>` : `<div class="empty">Aucun projet. <a href="#/projets">Créer un projet</a></div>`}</section>
    <section class="card"><div class="card-head"><h2>Activité récente</h2><a class="small" href="#/validation">À traiter</a></div>
      ${feed(store.data.events.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5))}</section>
  </div>
  <div class="grid grid-3">${health.map(({ p, h }) => projectCard(p, h)).join("")}</div>`;
}

function projectCard(p, h) {
  const mem = membersOf(p.id);
  return `<article class="card proj-card" style="--pc:${esc(p.color)}">
    <div class="head"><span class="code">${esc(p.code)}, semaine ${h.week}${store.isRoot() ? `, ${esc(store.supervisorName(p.owner))}` : ""}</span>${pill(h.state, STATE_LABEL[h.state])}</div>
    <h3><a class="title" href="#/projet/${esc(p.id)}">${esc(p.name)}</a></h3>
    <div class="bar"><i style="width:${pct(h.progress)}%;background:${esc(p.color)}"></i></div>
    <div class="row"><div class="avs">${mem.map(u => avatar(u.name)).join("")}</div><span class="spacer"></span>
      <span class="muted small">${h.done}/${h.total} tâches${h.toValidate.length ? `, ${h.toValidate.length} à valider` : ""}${h.blocked.length ? `, ${h.blocked.length} bloquée${h.blocked.length > 1 ? "s" : ""}` : ""}</span></div>
    ${mem.filter(u => !tutorialDone(u)).map(u => `<div class="small" style="color:var(--warn)">${esc(u.name)} n'a pas terminé le tutoriel GitHub</div>`).join("")}
  </article>`;
}

const EVENT_TONE = { problem: "crit", submit: "warn", validate: "good", badge: "info", assign: "info", reject: "warn", unblock: "good" };
function feed(events) {
  if (!events.length) return `<div class="empty">Rien pour l'instant.</div>`;
  return `<ul class="feed">${events.map(e => `<li><i class="dot ${EVENT_TONE[e.type] || ""}"></i><div><span class="${e.alert ? "alert" : ""}">${esc(e.text)}</span><time>${esc(ago(e.at))}</time></div></li>`).join("")}</ul>`;
}

// ---------- À traiter ----------
export function validationView() {
  const blocked = store.data.tasks.filter(t => t.status === "bloque");
  const tv = store.data.tasks.filter(t => t.status === "a_valider").sort((a, b) => (a.submittedAt || "").localeCompare(b.submittedAt || ""));
  const tutos = store.data.users.filter(tutorialDone).sort((a, b) => b.tutorial.completedAt.localeCompare(a.tutorial.completedAt));
  return `<div class="page-head"><div><h1>À traiter</h1><p>Problèmes signalés d'abord, puis les tâches rendues, de la plus ancienne à la plus récente.</p></div></div>
  <section class="card stack"><h2>Problèmes signalés <span class="muted">(${blocked.length})</span></h2>
    ${blocked.length ? blocked.map(t => {
      const u = userOf(t.assignee), p = projectOf(t.projectId), d = taskOf(t.problem?.diagnosticId);
      return `<div class="item">${avatar(u?.name || "?")}<div class="body">
        <div class="row"><span class="title">${esc(t.title)}</span><span class="tag">${esc(p?.code)}</span></div>
        <div class="muted small">${esc(u?.name || "")} · ${esc(ago(t.problem?.at))}</div>
        <div class="problem-text">${esc(t.problem?.text || "")}</div>
        ${d ? `<div class="small">Tâche de diagnostic : ${statusPill(d.status)} ${d.proof ? `<a href="${esc(d.proof)}" target="_blank" rel="noopener">compte rendu</a>` : ""}</div>` : ""}
      </div><div class="actions"><button class="btn small" data-action="open-task" data-id="${esc(t.id)}">Ouvrir</button><button class="btn small primary" data-action="unblock" data-id="${esc(t.id)}">Débloquer</button></div></div>`;
    }).join("") : `<div class="empty">Aucun problème ouvert.</div>`}
  </section>
  <section class="card stack"><h2>Tâches à valider <span class="muted">(${tv.length})</span></h2>
    ${tv.length ? tv.map(t => {
      const u = userOf(t.assignee), p = projectOf(t.projectId);
      const ok = onTime(t);
      const pts = basePoints(t) + (ok ? store.data.settings.onTimeBonus : 0);
      return `<div class="item">${avatar(u?.name || "?")}<div class="body">
        <div class="row"><span class="title">${esc(t.title)}</span>${sizeTag(t.size)}<span class="tag">${esc(p?.code)}</span>${t.kind === "diagnostic" ? `<span class="tag" style="color:var(--crit)">diagnostic</span>` : ""}</div>
        <div class="muted small">${esc(u?.name || "")} · rendue ${esc(ago(t.submittedAt))} · échéance fin S${t.weekEnd} · ${ok ? `<span style="color:var(--good)">dans les temps (+${store.data.settings.onTimeBonus})</span>` : "en retard"}</div>
        ${t.proof ? `<a class="proof" href="${esc(t.proof)}" target="_blank" rel="noopener">${esc(t.proof)}</a>` : `<span class="muted small">Aucune preuve jointe</span>`}
      </div><div class="actions"><button class="btn small" data-action="reject" data-id="${esc(t.id)}">Renvoyer</button><button class="btn small primary" data-action="validate" data-id="${esc(t.id)}">Valider · +${pts} pts</button></div></div>`;
    }).join("") : `<div class="empty">Rien à valider.</div>`}
  </section>
  <section class="card stack"><h2>Tutoriels GitHub terminés <span class="muted">(${tutos.length}/${store.data.users.length})</span></h2>
    ${tutos.length ? `<div class="table-wrap"><table><thead><tr><th>Étudiant</th><th>Projet</th><th>Terminé</th><th>Preuve</th></tr></thead><tbody>${tutos.map(u =>
      `<tr><td>${esc(u.name)}</td><td>${esc(projectOf(u.projectId)?.code || "")}</td><td>${esc(fmtDate(u.tutorial.completedAt))}</td><td>${u.tutorial.proof ? `<a href="${esc(u.tutorial.proof)}" target="_blank" rel="noopener">voir le commit</a>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Aucun pour l'instant.</div>`}
  </section>`;
}

// ---------- Projets ----------
export function projectsView() {
  return `<div class="page-head"><div><h1>Projets</h1><p>Créer, modifier ou supprimer un projet et ses jalons.</p></div>
    <div class="actions"><button class="btn primary" data-action="new-project">Nouveau projet</button></div></div>
  <div class="grid grid-3">${store.data.projects.map(p => {
    const h = projectHealth(p);
    return `<article class="card proj-card" style="--pc:${esc(p.color)}">
      <div class="head"><div><div class="code">${esc(p.code)} · début ${esc(fmtDate(p.startDate + "T12:00:00"))} · ${p.weeks} semaines${store.isRoot() ? ` · ${esc(store.supervisorName(p.owner))}` : ""}</div><h3><a class="title" href="#/projet/${esc(p.id)}">${esc(p.name)}</a></h3></div>${pill(h.state, STATE_LABEL[h.state])}</div>
      <p class="small muted">${esc(p.description || "")}</p>
      <div class="facts"><span><b>${h.total}</b> tâches</span><span><b>${membersOf(p.id).length}</b> étudiants</span><span><b>${(p.milestones || []).length}</b> jalons</span></div>
      <div class="actions"><a class="btn small" href="#/projet/${esc(p.id)}">Ouvrir</a><button class="btn small" data-action="edit-project" data-id="${esc(p.id)}">Modifier</button></div>
    </article>`;
  }).join("") || `<div class="empty">Aucun projet pour l'instant.</div>`}</div>`;
}

export function projectView(p, tab) {
  const admin = store.isAdmin();
  const h = projectHealth(p);
  const tabs = [["kanban", "Kanban"], ["gantt", "Gantt"], ["taches", "Liste des tâches"], ["equipe", "Équipe"]];
  let body = "";
  if (tab === "gantt") body = `${ganttLegend()}${gantt([p])}`;
  else if (tab === "taches") body = taskTable(p);
  else if (tab === "equipe") body = teamView(p);
  else body = kanban(p);
  return `<div class="page-head"><div><div class="row"><i class="dot" style="background:${esc(p.color)};width:14px;height:14px"></i><span class="mono muted">${esc(p.code)} · semaine S${h.week}</span>${pill(h.state, STATE_LABEL[h.state])}</div>
    <h1 style="margin-top:6px">${esc(p.name)}</h1><p>${esc(p.description || "")}${p.repoUrl ? ` · <a href="${esc(p.repoUrl)}" target="_blank" rel="noopener">dépôt GitHub</a>` : ""}</p></div>
    ${admin ? `<div class="actions"><button class="btn" data-action="edit-project" data-id="${esc(p.id)}">Modifier le projet</button><button class="btn primary" data-action="new-task" data-project="${esc(p.id)}">Nouvelle tâche</button></div>` : ""}</div>
  <nav class="tabs">${tabs.map(([k, l]) => `<a href="#/projet/${esc(p.id)}/${k}" class="${(tab || "kanban") === k ? "on" : ""}">${l}</a>`).join("")}</nav>
  ${body}`;
}

function kanban(p) {
  const ts = tasksOf(p.id);
  const me = store.session.email;
  return `<p class="small muted">${store.isAdmin() ? "Glissez une carte pour changer son état. Déposer dans « Fait » valide la tâche et attribue les points." : "Vos cartes sont encadrées en vert. Utilisez « Mon espace » pour terminer une tâche ou signaler un problème."}</p>
  <div class="kanban">${STATUSES.map(s => {
    const cards = ts.filter(t => t.status === s.id);
    return `<div class="col" data-drop="${s.id}"><div class="col-head">${esc(s.label)}<span>${cards.length}</span></div>
      ${cards.map(t => {
        const u = t.assignee ? userOf(t.assignee) : null;
        const drag = store.isAdmin() || t.assignee === me;
        return `<div class="kcard ${t.kind === "diagnostic" ? "diag" : ""} ${t.assignee === me ? "mine" : ""}" data-action="open-task" data-id="${esc(t.id)}" ${drag ? `draggable="true"` : ""}>
          <div>${esc(t.title)}</div>
          <div class="meta">${sizeTag(t.size)}<span class="tag">${esc(t.label || "")}</span><span>S${t.weekStart}${t.weekEnd !== t.weekStart ? "–S" + t.weekEnd : ""}</span><span class="spacer"></span>${u ? avatar(u.name) : ""}</div>
        </div>`;
      }).join("")}
    </div>`;
  }).join("")}</div>`;
}

function taskTable(p) {
  const ts = tasksOf(p.id);
  if (!ts.length) return `<div class="empty">Aucune tâche. ${store.isAdmin() ? `<button class="btn small primary" data-action="new-task" data-project="${esc(p.id)}">Créer la première</button>` : ""}</div>`;
  const ms = Object.fromEntries((p.milestones || []).map(m => [m.id, m.name]));
  return `<div class="table-wrap"><table><thead><tr><th>Tâche</th><th>Taille</th><th>Semaines</th><th>Jalon</th><th>Assignée à</th><th>État</th><th class="num">Points</th></tr></thead><tbody>
    ${ts.map(t => `<tr class="click" data-action="open-task" data-id="${esc(t.id)}"><td>${t.kind === "diagnostic" ? "⚠ " : ""}${esc(t.title)}<div class="muted small">${esc(t.label || "")}${(t.dependsOn || []).length ? ` · dépend de ${t.dependsOn.length} tâche${t.dependsOn.length > 1 ? "s" : ""}` : ""}</div></td>
      <td>${sizeTag(t.size)}</td><td class="mono">S${t.weekStart}–S${t.weekEnd}</td><td>${esc(ms[t.milestone] || "")}</td>
      <td>${t.assignee ? esc(userOf(t.assignee)?.name || t.assignee) : `<span class="muted">libre</span>`}</td><td>${statusPill(t.status)}</td>
      <td class="num">${t.status === "fait" ? (t.pointsAwarded ?? basePoints(t)) : `<span class="muted">${basePoints(t)}</span>`}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function teamView(p) {
  const mem = membersOf(p.id);
  const held = milestonesHeld(p.id);
  return `<div class="grid grid-2">${mem.map(u => {
    const st = userStats(u.id);
    return `<div class="card stack"><div class="row">${avatar(u.name, "lg")}<div><h3>${esc(u.name)}</h3><div class="muted small">${esc(u.email)}</div></div><span class="spacer"></span><div class="rank-pts" style="color:var(--copper)">${st.points} pts</div></div>
      <div class="small">Niveau ${st.level.index} · ${esc(st.level.name)} · ${st.done} tâche${st.done > 1 ? "s" : ""} validée${st.done > 1 ? "s" : ""} · bonus estimé +${st.bonus}</div>
      <div class="badge-row">${st.badges.map(id => badgeSvg(BADGES.find(b => b.id === id))).join("") || `<span class="muted small">Pas encore de badge</span>`}</div>
      ${tutorialDone(u) ? "" : `<div class="feedback-text">Le tutoriel GitHub n'est pas encore terminé : aucune tâche ne peut lui être attribuée.</div>`}
    </div>`;
  }).join("") || `<div class="empty">Aucun étudiant dans ce projet.</div>`}</div>
  <div class="card stack"><h3>Jalons</h3>${(p.milestones || []).map(m => {
    const ts = store.data.tasks.filter(t => t.projectId === p.id && t.milestone === m.id);
    const done = ts.filter(t => t.status === "fait").length;
    const ok = held.some(x => x.id === m.id);
    return `<div class="row small"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 0l6 6-6 6-6-6z" fill="var(--copper)"/></svg><b>${esc(m.name)}</b><span class="muted">fin S${m.week} · ${esc(fmtDate(weekEndDate(p, m.week).toISOString()))}</span><span class="spacer"></span><span>${done}/${ts.length} tâches validées</span>${ok ? pill("ok", "Jalon tenu") : ""}</div>`;
  }).join("") || `<span class="muted">Aucun jalon.</span>`}</div>`;
}

export function planningView() {
  return `<div class="page-head"><div><h1>Planning global</h1><p>Toutes les tâches des ${store.data.projects.length} projets. Cliquez sur une barre pour ouvrir la tâche.</p></div></div>
  ${ganttLegend()}${gantt(store.data.projects, { compact: true })}`;
}

// ---------- Étudiants ----------
export function studentsView() {
  const us = store.data.users.slice().sort((a, b) => (a.projectId || "").localeCompare(b.projectId || "") || a.name.localeCompare(b.name));
  return `<div class="page-head"><div><h1>Étudiants</h1><p>${CONFIG.firebase ? "L'adresse e-mail doit être celle du compte Google de l'étudiant : c'est elle qui lui donne accès." : "En ligne, l'adresse e-mail doit être celle du compte Google de l'étudiant."}</p></div>
    <div class="actions"><button class="btn primary" data-action="new-user">Ajouter un étudiant</button></div></div>
  <div class="table-wrap"><table><thead><tr><th>Étudiant</th><th>Projet</th>${store.isRoot() ? "<th>Encadrant</th>" : ""}<th>Tutoriel</th><th>Tâche en cours</th><th class="num">Points</th><th>Niveau</th><th>Badges</th><th></th></tr></thead><tbody>
  ${us.map(u => {
    const st = userStats(u.id);
    const cur = currentTasks(u.id)[0];
    return `<tr><td><div class="row" style="flex-wrap:nowrap">${avatar(u.name)}<div><b>${esc(u.name)}</b><div class="muted small">${esc(u.email)}</div></div></div></td>
      <td>${esc(projectOf(u.projectId)?.code || "—")}</td>
      ${store.isRoot() ? `<td class="small">${esc(store.supervisorName(u.owner))}</td>` : ""}
      <td>${tutorialDone(u) ? pill("fait", "Terminé") : pill("a_valider", "À faire")}</td>
      <td class="small">${cur ? esc(cur.title) : `<span class="muted">—</span>`}</td>
      <td class="num">${st.points}</td><td class="small">${st.level.index} · ${esc(st.level.name)}</td><td class="num">${st.badges.length}</td>
      <td><button class="btn small" data-action="edit-user" data-id="${esc(u.id)}">Modifier</button></td></tr>`;
  }).join("") || `<tr><td colspan="9" class="muted">Aucun étudiant.</td></tr>`}
  </tbody></table></div>`;
}

// ---------- Classement ----------
export function leaderboardView() {
  const me = store.session.email;
  const groups = store.data.projects.map(p => {
    const mem = membersOf(p.id);
    const pts = mem.reduce((a, u) => a + userStats(u.id).points, 0);
    return { p, pts, mem };
  }).sort((a, b) => b.pts - a.pts);
  const people = store.data.users.map(u => ({ u, st: userStats(u.id) })).sort((a, b) => b.st.points - a.st.points);
  const max = Math.max(1, ...groups.map(g => g.pts));
  return `<div class="page-head"><div><h1>Classement</h1><p>Les points ne comptent qu'une fois la tâche validée par l'encadrant. Taille S = ${store.data.settings.pointsS}, M = ${store.data.settings.pointsM}, L = ${store.data.settings.pointsL}, +${store.data.settings.onTimeBonus} si rendue dans les temps.</p></div></div>
  <div class="grid grid-2">
    <section class="card stack"><h2>Binômes</h2><div class="rank">${groups.map((g, i) => `<div class="rank-row ${i === 0 ? "top" : ""} ${g.mem.some(u => u.id === me) ? "me-row" : ""}">
      <div class="rank-pos">${i + 1}</div><div class="stack" style="gap:5px"><div class="row"><i class="dot" style="background:${esc(g.p.color)}"></i><b>${esc(g.p.name)}</b></div><div class="bar copper"><i style="width:${pct(g.pts / max)}%"></i></div><div class="muted small">${g.mem.map(u => esc(u.name)).join(" · ")}</div></div><div class="rank-pts">${g.pts}</div></div>`).join("")}</div></section>
    <section class="card stack"><h2>Individuel</h2><div class="rank">${people.map(({ u, st }, i) => `<div class="rank-row ${i < 3 ? "top" : ""} ${u.id === me ? "me-row" : ""}">
      <div class="rank-pos">${i + 1}</div><div class="row" style="flex-wrap:nowrap">${avatar(u.name)}<div><b>${esc(u.name)}</b><div class="muted small">Niv. ${st.level.index} · ${esc(st.level.name)} · ${st.badges.length} badge${st.badges.length > 1 ? "s" : ""}</div></div></div><div class="rank-pts">${st.points}</div></div>`).join("")}</div></section>
  </div>`;
}

// ---------- Réglages ----------
export function settingsView() {
  const s = store.data.settings;
  const num = (id, label, v, hint = "") => `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="number" min="0" step="1" value="${v}">${hint ? `<span class="muted small">${hint}</span>` : ""}</div>`;
  const root = store.isRoot();
  return `<div class="page-head"><div><h1>Réglages</h1><p>${root ? "Barème des points, conversion en bonus de note, sauvegardes." : "Import de projets et sauvegarde de vos données. Le barème des points est fixé par l'administrateur."}</p></div></div>
  ${root ? `<form class="card stack" data-form="settings"><h2>Points et récompenses</h2>
    <div class="form-grid">${num("pointsS", "Tâche S", s.pointsS)}${num("pointsM", "Tâche M", s.pointsM)}${num("pointsL", "Tâche L", s.pointsL)}${num("onTimeBonus", "Bonus « dans les temps »", s.onTimeBonus)}${num("tutorialPoints", "Tutoriel GitHub", s.tutorialPoints)}</div>
    <div class="form-grid">${num("bonusPerPoints", "Points pour +1 point de note", s.bonusPerPoints, "Bonus arrondi au demi-point.")}${num("bonusCap", "Bonus maximum (sur 20)", s.bonusCap)}</div>
    <label class="check"><input type="checkbox" name="leaderboardVisible" ${s.leaderboardVisible ? "checked" : ""}> Classement visible par les étudiants</label>
    <div class="small muted">Niveaux : ${LEVELS.map(l => `${esc(l.name)} (${l.min} pts)`).join(" · ")}</div>
    <div><button class="btn primary" type="submit">Enregistrer les réglages</button></div>
  </form>` : `<section class="card stack"><h2>Barème</h2><p class="small">Tâche S = ${s.pointsS} pts · M = ${s.pointsM} · L = ${s.pointsL} · +${s.onTimeBonus} si rendue dans les temps · tutoriel GitHub = ${s.tutorialPoints} · +1 point de note par tranche de ${s.bonusPerPoints} pts (maximum +${s.bonusCap}).</p></section>`}
  <section class="card stack"><h2>Ajouter ou mettre à jour depuis un fichier</h2>
    <p class="small muted">Importez un fichier JSON de projets, d'étudiants ou de tâches (par exemple préparé avec Claude).${root ? "" : " Les projets importés vous sont rattachés."} Les nouveaux éléments sont ajoutés, ceux qui existent déjà sont mis à jour. Rien n'est supprimé, et l'avancement des étudiants (état des tâches, preuves, points, tutoriel) n'est jamais modifié. Un résumé s'affiche avant de confirmer.</p>
    <div class="actions"><label class="btn primary" for="merge-file">Choisir un fichier JSON</label><input id="merge-file" type="file" accept="application/json,.json" hidden data-action="merge-import"></div>
  </section>
  <section class="card stack"><h2>Sauvegarde</h2>
    <p class="small muted">${root ? "Exportez toutes les données en JSON (projets, encadrants, étudiants, tâches, historique) avant l'évaluation finale ou pour les archiver. La restauration remplace toutes les données actuelles, pour tous les encadrants." : "Exportez vos projets, étudiants et tâches en JSON pour les archiver."}</p>
    <div class="actions"><button class="btn" data-action="export">Exporter en JSON</button>
      ${root ? `<label class="btn" for="import-file">Restaurer une sauvegarde (remplace tout)</label><input id="import-file" type="file" accept="application/json" hidden data-action="import">
      ${store.mode === "demo" ? `<button class="btn danger" data-action="reset-demo">Réinitialiser la démo</button>` : `<button class="btn" data-action="seed-example">Charger les 5 projets d'exemple</button>`}` : ""}</div>
    <textarea id="export-out" class="mono" readonly hidden style="width:100%;min-height:160px;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface-2)"></textarea>
  </section>`;
}

// ---------- Espace étudiant ----------
export function studentHome() {
  const me = userOf(store.session.email);
  if (!me) return `<div class="empty">Compte introuvable.</div>`;
  const p = projectOf(me.projectId);
  const st = userStats(me.id);
  const cur = currentTasks(me.id);
  const waiting = store.data.tasks.filter(t => t.assignee === me.id && t.status === "a_valider");
  const done = store.data.tasks.filter(t => t.assignee === me.id && t.status === "fait").sort((a, b) => (b.validatedAt || "").localeCompare(a.validatedAt || ""));
  const partner = membersOf(me.projectId).filter(u => u.id !== me.id);
  const ringFor = (value, sub, frac) => `<div class="hero-ring"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="74" class="t"/><circle cx="90" cy="90" r="74" class="v" stroke-dasharray="${(Math.max(0, Math.min(1, frac)) * 465).toFixed(0)} 465" transform="rotate(-90 90 90)"/></svg><div><b>${value}</b><span>${sub}</span></div></div>`;
  const xpRing = ringFor(st.points, st.level.next ? `points, ${st.level.next.min - st.points} avant ${esc(st.level.next.name)}` : "points, niveau maximum", st.level.progress);
  let hero;
  if (!tutorialDone(me)) {
    const n = Object.values(me.tutorial?.steps || {}).filter(Boolean).length;
    hero = `<section class="hero"><div class="hero-body"><p class="hero-kicker">Première mission, obligatoire</p><h2>Le tutoriel GitHub</h2>
      <p>Avant votre première tâche, apprenez à utiliser Git et GitHub : cloner le dépôt, enregistrer une version, travailler sur une branche. À la fin, vous obtenez le badge <b>Welcome to Git!</b>, ${store.data.settings.tutorialPoints} points, et votre première tâche.</p>
      <div class="hero-actions"><a class="btn light big" href="#/tutoriel">${n ? "Reprendre le tutoriel" : "Commencer le tutoriel"}</a></div></div>
      ${ringFor(`${n}/${TUTORIAL_STEPS.length}`, "étapes faites", n / TUTORIAL_STEPS.length)}</section>`;
  } else if (cur.length) {
    hero = cur.map((t, i) => {
      if (t.status === "bloque") return `<section class="hero blocked"><div class="hero-body"><p class="hero-kicker">En attente : problème signalé</p><h2>${esc(t.title)}</h2>
        <p class="problem-text">${esc(t.problem?.text || "")}</p><p>Commencez par la tâche de diagnostic. Votre encadrant débloquera cette tâche quand le diagnostic sera validé.</p></div></section>`;
      return `<section class="hero"><div class="hero-body"><p class="hero-kicker">${t.kind === "diagnostic" ? "Diagnostic en cours" : "Votre tâche en cours"}</p><h2>${esc(t.title)}</h2>
        <div class="hero-tags"><span>${esc(t.label || "")}</span><span>Taille ${esc(t.size)}</span><span>À rendre avant le ${esc(fmtDate(weekEndDate(p, t.weekEnd).toISOString()))}</span><span>+${basePoints(t)} points</span></div>
        ${t.description ? `<p class="desc">${esc(t.description)}</p>` : ""}
        ${t.feedback ? `<p class="feedback-text"><b>Renvoyée par l'encadrant :</b> ${esc(t.feedback)}</p>` : ""}
        <div class="hero-actions"><button class="btn light big" data-action="submit-task" data-id="${esc(t.id)}">J'ai terminé</button>${t.kind === "diagnostic" ? "" : `<button class="btn outline-light big" data-action="problem" data-id="${esc(t.id)}">J'ai un problème</button>`}</div></div>
        ${i === 0 ? xpRing : ""}</section>`;
    }).join("");
  } else {
    const next = nextTaskFor(me.id);
    hero = `<section class="hero"><div class="hero-body"><p class="hero-kicker">Aucune tâche en cours</p><h2>${next ? "Prêt pour la suite ?" : "Plus de tâche disponible pour l'instant"}</h2>
      <p>${next ? `La prochaine tâche libre de votre projet est « ${esc(next.title)} ».` : "Les tâches restantes attendent qu'une autre soit terminée, ou sont prises par votre binôme. Parlez-en à votre encadrant."}</p>
      ${next ? `<div class="hero-actions"><button class="btn light big" data-action="start-next">Prendre cette tâche</button></div>` : ""}</div>${xpRing}</section>`;
  }
  return `<div class="page-head"><div><h1>Bonjour ${esc(me.name.split(" ")[0])}</h1><p>${esc(p?.name || "")}, semaine ${weekOf(p)}${partner.length ? `, avec ${partner.map(u => esc(u.name)).join(" et ")}` : ""}</p></div></div>
  ${hero}
  <div class="dash-grid">
    <section class="card"><div class="card-head"><h2>Mes badges</h2><span class="muted small">${st.badges.length} sur ${BADGES.length}</span></div>
      <div class="badges">${BADGES.map(b => { const has = st.badges.includes(b.id); return `<div class="badge ${has ? "" : "locked"}" title="${esc(b.desc)}">${badgeSvg(b, has)}<b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`; }).join("")}</div></section>
    <section class="card stack"><div class="card-head"><h2>Ma progression</h2><span class="muted small">bonus estimé +${st.bonus} sur ${store.data.settings.bonusCap}</span></div>
      <div><div class="row"><b>Niveau ${st.level.index}, ${esc(st.level.name)}</b><span class="spacer"></span><span class="muted small">${st.level.next ? `${st.level.next.min - st.points} points avant ${esc(st.level.next.name)}` : "niveau maximum"}</span></div><div class="bar thick"><i style="width:${pct(st.level.progress)}%"></i></div></div>
      <div class="list">
        ${waiting.map(t => `<div class="list-row"><span class="pill a_valider">À valider</span><span>${esc(t.title)}</span><span class="spacer"></span><span class="muted">+${basePoints(t)}</span></div>`).join("")}
        ${done.slice(0, 5).map(t => `<div class="list-row"><span class="pill fait">Validée</span><span>${esc(t.title)}</span><span class="spacer"></span><b class="pts">+${t.pointsAwarded ?? basePoints(t)}</b></div>`).join("")}
        ${!waiting.length && !done.length ? `<p class="muted small">Vos tâches rendues et validées apparaîtront ici.</p>` : ""}
      </div></section>
  </div>`;
}

export function tutorialView() {
  const me = userOf(store.session.email);
  if (!me) return `<div class="page-head"><div><h1>Tutoriel GitHub</h1><p>Cette page est destinée aux étudiants. Passez en mode étudiant dans la barre de démo pour la tester.</p></div><div class="actions"><a class="btn" href="${GUIDE_URL}" target="_blank" rel="noopener">Ouvrir le guide Git complet</a></div></div>${tutorialPreview()}`;
  const p = projectOf(me.projectId);
  const steps = me.tutorial?.steps || {};
  const quiz = me.tutorial?.quiz || {};
  const repo = repoName(p);
  const allSteps = TUTORIAL_STEPS.every(s => steps[s.id]);
  const done = tutorialDone(me);
  const welcome = BADGES.find(b => b.id === "welcome-git");
  return `<div class="page-head"><div><h1>Tutoriel GitHub</h1><p>${TUTORIAL_STEPS.length} étapes, un quiz de ${TUTORIAL_QUIZ.length} questions, puis le lien de votre premier commit. Comptez 1 h 30.</p></div>
    <div class="actions"><a class="btn" href="${GUIDE_URL}" target="_blank" rel="noopener">Ouvrir le guide Git complet</a></div></div>
  <div class="tuto"><div class="stack">${TUTORIAL_STEPS.map((s, i) => `<article class="step ${steps[s.id] ? "done" : ""}"><div class="step-num">${steps[s.id] ? "✓" : i + 1}</div><div class="step-body">
      <h3>${esc(s.title)}</h3>${s.body}${s.code ? `<pre class="cmd"><code>${esc(s.code.replaceAll("{ORG}", CONFIG.githubOrg).replaceAll("{REPO}", repo))}</code></pre>` : ""}
      ${s.tip ? `<p class="tip">${esc(s.tip)}</p>` : ""}
      ${s.guide ? `<a class="small" href="${GUIDE_URL}${s.guide}" target="_blank" rel="noopener">Lire le chapitre correspondant du guide →</a>` : ""}
      ${done ? "" : `<label class="check"><input type="checkbox" data-action="tuto-step" data-step="${s.id}" ${steps[s.id] ? "checked" : ""}> C'est fait</label>`}</div></article>`).join("")}
  </div>
  <aside class="tuto-side">
    ${done ? `<div class="unlock">${badgeSvg(welcome)}<h2>Welcome to Git!</h2><p>Badge débloqué le ${esc(fmtDate(me.tutorial.completedAt))}. Votre première tâche vous attend dans « Mon espace ».</p><a class="btn primary" href="#/">Aller à Mon espace</a></div>` : `
    <form class="card stack" data-form="quiz"><h3>Quiz</h3>${TUTORIAL_QUIZ.map(q => `<div class="quiz-q ${me.tutorial?.quizChecked && quiz[q.id] != null && Number(quiz[q.id]) !== q.answer ? "wrong" : ""}"><div class="q small"><b>${esc(q.q)}</b></div>
      ${q.options.map((o, i) => `<label><input type="radio" name="${q.id}" value="${i}" ${String(quiz[q.id]) === String(i) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`).join("")}
      <div class="field"><label for="tuto-proof">Lien de votre premier commit</label><input id="tuto-proof" name="proof" placeholder="https://github.com/${esc(CONFIG.githubOrg)}/${esc(repo)}/commit/…" value="${esc(me.tutorial?.proof || "")}">
      <span class="muted small">Sur GitHub : onglet « Commits » du dépôt, cliquez sur votre commit, copiez l'adresse.</span></div>
      <button class="btn primary" type="submit" ${allSteps ? "" : "disabled"}>${allSteps ? "Valider et débloquer le badge" : "Cochez d'abord les " + TUTORIAL_STEPS.length + " étapes"}</button>
    </form>
    <div class="card stack" style="align-items:center;text-align:center">${badgeSvg(welcome, false)}<b>Welcome to Git!</b><span class="small muted">+${store.data.settings.tutorialPoints} points et votre première tâche attribuée automatiquement.</span></div>`}
  </aside></div>`;
}

function tutorialPreview() {
  return `<div class="stack">${TUTORIAL_STEPS.map((s, i) => `<article class="step"><div class="step-num">${i + 1}</div><div class="step-body"><h3>${esc(s.title)}</h3>${s.body}${s.code ? `<pre class="cmd"><code>${esc(s.code.replaceAll("{ORG}", CONFIG.githubOrg).replaceAll("{REPO}", "p1-bus-gps"))}</code></pre>` : ""}${s.tip ? `<p class="tip">${esc(s.tip)}</p>` : ""}</div></article>`).join("")}</div>`;
}

export function repoName(p) {
  if (p?.repoUrl) { const m = p.repoUrl.match(/github\.com\/[^/]+\/([^/#?]+)/); if (m) return m[1].replace(/\.git$/, ""); }
  return (p?.code || "projet").toLowerCase();
}

// ---------- Formulaires (corps de modales) ----------
export function taskForm(t, projectId) {
  const pid = t?.projectId || projectId || store.data.projects[0]?.id;
  const p = projectOf(pid);
  const others = tasksOf(pid).filter(x => x.id !== t?.id && x.kind !== "diagnostic");
  const mem = membersOf(pid);
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${sel ? "selected" : ""}>${esc(l)}</option>`;
  const weeks = Array.from({ length: p?.weeks || 8 }, (_, i) => i + 1);
  return `
  <div class="field"><label for="f-title">Titre (le résultat vérifiable)</label><input id="f-title" name="title" required value="${esc(t?.title || "")}" placeholder="Le piézo 1 envoie une note MIDI"></div>
  <div class="field"><label for="f-desc">Description</label><textarea id="f-desc" name="description" placeholder="Ce qu'il faut faire, ce qui prouve que c'est fait">${esc(t?.description || "")}</textarea></div>
  <div class="form-grid">
    <div class="field"><label for="f-project">Projet</label><select id="f-project" name="projectId">${store.data.projects.map(x => opt(x.id, x.code + " · " + x.name, x.id === pid)).join("")}</select></div>
    <div class="field"><label for="f-size">Taille</label><select id="f-size" name="size">${Object.entries(SIZES).map(([k, l]) => opt(k, l, (t?.size || "M") === k)).join("")}</select></div>
    <div class="field"><label for="f-label">Étiquette</label><select id="f-label" name="label">${LABELS.map(l => opt(l, l, t?.label === l)).join("")}</select></div>
  </div>
  <div class="form-grid">
    <div class="field"><label for="f-ws">Semaine de début</label><select id="f-ws" name="weekStart">${weeks.map(w => opt(w, "S" + w, (t?.weekStart || 1) === w)).join("")}</select></div>
    <div class="field"><label for="f-we">Semaine de fin</label><select id="f-we" name="weekEnd">${weeks.map(w => opt(w, "S" + w, (t?.weekEnd || 1) === w)).join("")}</select></div>
    <div class="field"><label for="f-ms">Jalon</label><select id="f-ms" name="milestone">${opt("", "Aucun", !t?.milestone)}${(p?.milestones || []).map(m => opt(m.id, `${m.name} (S${m.week})`, t?.milestone === m.id)).join("")}</select></div>
  </div>
  <div class="form-grid">
    <div class="field"><label for="f-as">Assignée à</label><select id="f-as" name="assignee">${opt("", "Libre (attribution automatique)", !t?.assignee)}${mem.map(u => opt(u.id, u.name, t?.assignee === u.id)).join("")}</select></div>
    <div class="field"><label for="f-st">État</label><select id="f-st" name="status">${STATUSES.map(s => opt(s.id, s.label, (t?.status || "backlog") === s.id)).join("")}</select></div>
  </div>
  <div class="field"><label>Dépend de (la tâche ne sera attribuée qu'une fois celles-ci rendues)</label><div class="multi">${others.map(o => `<label><input type="checkbox" name="dependsOn" value="${esc(o.id)}" ${(t?.dependsOn || []).includes(o.id) ? "checked" : ""}> S${o.weekStart} · ${esc(o.title)}</label>`).join("") || `<span class="muted small">Aucune autre tâche dans ce projet.</span>`}</div></div>
  ${t?.proof ? `<div class="small">Preuve : <a href="${esc(t.proof)}" target="_blank" rel="noopener">${esc(t.proof)}</a></div>` : ""}
  ${t?.problem?.text ? `<div class="problem-text">${esc(t.problem.text)}</div>` : ""}`;
}

export function taskReadOnly(t) {
  const u = t.assignee ? userOf(t.assignee) : null;
  const p = projectOf(t.projectId);
  const ms = (p?.milestones || []).find(m => m.id === t.milestone);
  return `<div class="row">${statusPill(t.status)}${sizeTag(t.size)}<span class="tag">${esc(t.label || "")}</span><span class="muted small">S${t.weekStart}–S${t.weekEnd}${ms ? " · jalon " + esc(ms.name) : ""}</span></div>
  ${t.description ? `<p style="white-space:pre-line">${esc(t.description)}</p>` : `<p class="muted">Pas de description.</p>`}
  <div class="small">${u ? `Assignée à <b>${esc(u.name)}</b>` : "Tâche libre : elle sera attribuée automatiquement."} · ${t.status === "fait" ? `<b style="color:var(--copper)">+${t.pointsAwarded ?? basePoints(t)} pts</b>` : `${basePoints(t)} pts à la validation`}</div>
  ${(t.dependsOn || []).length ? `<div class="small muted">Dépend de : ${t.dependsOn.map(id => esc(taskOf(id)?.title || "")).join(" · ")}</div>` : ""}
  ${t.problem?.text ? `<div class="problem-text">${esc(t.problem.text)}</div>` : ""}
  ${t.feedback ? `<div class="feedback-text">${esc(t.feedback)}</div>` : ""}
  ${t.proof ? `<div class="small">Preuve : <a href="${esc(t.proof)}" target="_blank" rel="noopener">${esc(t.proof)}</a></div>` : ""}`;
}

export function projectForm(p) {
  const ms = p?.milestones || [{ id: "m1", name: "Cahier des charges", week: 1 }, { id: "m2", name: "Démo technique", week: 4 }, { id: "m3", name: "MVP fonctionnel", week: 6 }, { id: "m4", name: "Évaluation finale", week: 8 }];
  const today = new Date().toISOString().slice(0, 10);
  return `
  <div class="form-grid">
    <div class="field"><label for="p-code">Code</label><input id="p-code" name="code" required maxlength="6" value="${esc(p?.code || "P" + (store.data.projects.length + 1))}"></div>
    <div class="field" style="grid-column:span 2"><label for="p-name">Nom du projet</label><input id="p-name" name="name" required value="${esc(p?.name || "")}"></div>
  </div>
  <div class="field"><label for="p-desc">Description</label><textarea id="p-desc" name="description">${esc(p?.description || "")}</textarea></div>
  <div class="form-grid">
    <div class="field"><label for="p-start">Début (lundi de S1)</label><input id="p-start" name="startDate" type="date" required value="${esc(p?.startDate || today)}"></div>
    <div class="field"><label for="p-weeks">Durée (semaines)</label><input id="p-weeks" name="weeks" type="number" min="1" max="30" value="${p?.weeks || 8}"></div>
    <div class="field"><label for="p-color">Couleur</label><input id="p-color" name="color" type="color" value="${esc(p?.color || "#2a78d6")}" style="height:40px;padding:3px"></div>
  </div>
  ${store.isRoot() ? `<div class="field"><label for="p-owner">Encadrant du projet</label><select id="p-owner" name="owner">${[{ id: store.adminSession().email, name: "Administrateur (moi)" }, ...store.raw.supervisors].map(x => `<option value="${esc(x.id)}" ${(p?.owner || store.session.email) === x.id ? "selected" : ""}>${esc(x.name)} · ${esc(x.id)}</option>`).join("")}</select>${p ? `<span class="muted small">Changer d'encadrant transfère aussi les étudiants et les tâches du projet.</span>` : ""}</div>` : ""}
  <div class="field"><label for="p-repo">Dépôt GitHub</label><input id="p-repo" name="repoUrl" placeholder="https://github.com/${esc(CONFIG.githubOrg)}/p1-bus-gps" value="${esc(p?.repoUrl || "")}"></div>
  <div class="field"><label>Jalons notés</label><div class="ms-list" id="ms-list">${ms.map(m => msRow(m)).join("")}</div>
    <div><button type="button" class="btn small" data-action="add-ms">Ajouter un jalon</button></div></div>`;
}
export function msRow(m = {}) {
  return `<div class="ms-row" data-ms="${esc(m.id || "m" + Math.random().toString(36).slice(2, 6))}"><input aria-label="Nom du jalon" name="ms-name" value="${esc(m.name || "")}" placeholder="Nom du jalon"><input aria-label="Semaine" name="ms-week" type="number" min="1" value="${m.week || 1}"><button type="button" class="icon-btn" data-action="del-ms" aria-label="Retirer">✕</button></div>`;
}

export function userForm(u) {
  return `
  <div class="field"><label for="u-name">Nom complet</label><input id="u-name" name="name" required value="${esc(u?.name || "")}"></div>
  <div class="field"><label for="u-email">Adresse e-mail (compte Google)</label><input id="u-email" name="email" type="email" required value="${esc(u?.email || "")}" ${u ? "readonly" : ""}>${u ? `<span class="muted small">L'adresse sert d'identifiant : pour la changer, supprimez puis recréez l'étudiant.</span>` : ""}</div>
  <div class="field"><label for="u-project">Projet</label><select id="u-project" name="projectId">${store.data.projects.map(p => `<option value="${esc(p.id)}" ${u?.projectId === p.id ? "selected" : ""}>${esc(p.code + " · " + p.name)}</option>`).join("")}</select></div>
  ${u ? `<label class="check"><input type="checkbox" name="resetTuto"> Remettre le tutoriel GitHub à zéro</label>` : ""}`;
}

// ---------- Encadrants (administrateur) ----------
export function supervisorsView() {
  const sups = store.raw.supervisors.slice().sort((a, b) => a.name.localeCompare(b.name));
  const rows = [{ id: store.session.email, name: "Administrateur (vous)", self: true }, ...sups];
  return `<div class="page-head"><div><h1>Encadrants</h1><p>Chaque encadrant se connecte avec son compte Google. Il crée ses projets, inscrit ses étudiants et ne voit que les siens. Vous voyez tout.</p></div>
    <div class="actions"><button class="btn primary" data-action="new-supervisor">Ajouter un encadrant</button></div></div>
  <div class="table-wrap"><table><thead><tr><th>Encadrant</th><th class="num">Projets</th><th class="num">Étudiants</th><th class="num">À valider</th><th class="num">Problèmes</th><th></th></tr></thead><tbody>
  ${rows.map(x => {
    const ps = store.raw.projects.filter(p => p.owner === x.id);
    const ts = store.raw.tasks.filter(t => t.owner === x.id);
    return `<tr><td><div class="row" style="flex-wrap:nowrap">${avatar(x.name)}<div><b>${esc(x.name)}</b><div class="muted small">${esc(x.id)}</div></div></div></td>
      <td class="num">${ps.length}</td><td class="num">${store.raw.users.filter(u => u.owner === x.id).length}</td>
      <td class="num">${ts.filter(t => t.status === "a_valider").length}</td><td class="num">${ts.filter(t => t.status === "bloque").length}</td>
      <td>${x.self ? "" : `<button class="btn small" data-action="edit-supervisor" data-id="${esc(x.id)}">Modifier</button>`}</td></tr>`;
  }).join("")}
  </tbody></table></div>
  <p class="small muted">Pour confier un projet existant à un encadrant : ouvrez le projet, « Modifier le projet », puis choisissez l'encadrant.</p>`;
}

export function supervisorForm(x) {
  return `<div class="field"><label for="s-name">Nom</label><input id="s-name" name="name" required value="${esc(x?.name || "")}"></div>
  <div class="field"><label for="s-email">Adresse e-mail (compte Google)</label><input id="s-email" name="email" type="email" required value="${esc(x?.id || "")}" ${x ? "readonly" : ""}></div>`;
}
