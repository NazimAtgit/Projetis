// Vues (HTML) de l'encadrant et des étudiants.
import { store } from "./store.js";
import { CONFIG } from "./config.js";
import {
  STATUSES, STATUS_LABEL, STATE_LABEL, LABELS, SIZES, BADGES, LEVELS,
  projectOf, userOf, taskOf, tasksOf, membersOf, weekOf, weekEndDate, basePoints, onTime,
  userStats, projectHealth, tutorialDone, currentTasks, nextTaskFor, milestonesHeld
} from "./logic.js";
import { esc, avatar, fmtDate, ago, badgeSvg, brandMark } from "./ui.js";
import { gantt, ganttLegend } from "./gantt.js";
import { TUTORIAL_STEPS, TUTORIAL_QUIZ } from "./tutorial.js";

const pill = (cls, label) => `<span class="pill ${cls}">${esc(label)}</span>`;
const statusPill = s => pill(s, STATUS_LABEL[s] || s);
const sizeTag = s => `<span class="size ${s}" title="${esc(SIZES[s] || "")}">${esc(s)}</span>`;
const pct = x => Math.round(x * 100);
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// ---------- Cadre ----------
export function shell(route, content) {
  const admin = store.isAdmin();
  const s = store.session;
  const tv = store.data.tasks.filter(t => t.status === "a_valider").length;
  const pb = store.data.tasks.filter(t => t.status === "bloque").length;
  const me = userOf(s.email);
  const link = (href, label, extra = "") => {
    const cur = "#/" + route.join("/");
    const on = (cur === href || (href !== "#/" && cur.startsWith(href + "/"))) ? "on" : "";
    return `<a href="${href}" class="${on}">${label}${extra}</a>`;
  };
  const nav = admin ? `
      <div class="nav-label">Encadrant</div>
      ${link("#/", "Tableau de bord")}
      ${link("#/validation", "À traiter", tv + pb ? `<span class="count">${tv + pb}</span>` : "")}
      ${link("#/planning", "Planning global")}
      ${link("#/projets", "Projets")}
      ${link("#/etudiants", "Étudiants")}
      ${link("#/classement", "Classement")}
      ${link("#/reglages", "Réglages")}
      <div class="nav-label">Projets</div>
      ${store.data.projects.map(p => link(`#/projet/${p.id}`, `<span class="row" style="gap:8px"><i class="dot" style="background:${esc(p.color)}"></i>${esc(p.code)}</span>`)).join("")}`
    : `
      ${link("#/", "Mon espace")}
      ${link("#/tutoriel", tutorialDone(me) ? "Tutoriel GitHub" : "Tutoriel GitHub", tutorialDone(me) ? "" : `<span class="count">1</span>`)}
      ${me ? link(`#/projet/${me.projectId}`, "Mon projet") : ""}
      ${store.data.settings.leaderboardVisible ? link("#/classement", "Classement") : ""}`;
  const demo = store.mode === "demo" ? demoBar() : "";
  return `${demo}<div class="shell">
    <aside class="side">
      <div class="brand">${brandMark}<div><b>${esc(CONFIG.appName)}</b><span>Projets L2/L3 · 8 semaines</span></div></div>
      <nav class="nav" aria-label="Navigation">${nav}</nav>
      <div class="side-foot">
        <div class="who">${avatar(s.name)}<div><b class="small">${esc(s.name)}</b><small>${admin ? "Encadrant" : esc(projectOf(me?.projectId)?.code || "")}</small></div></div>
        ${store.mode === "firebase" ? `<button class="btn small" data-action="logout">Se déconnecter</button>` : ""}
      </div>
    </aside>
    <main class="main" id="main">${content}</main>
  </div>`;
}

function demoBar() {
  const opts = [`<option value="${esc(store.adminSession().email)}" ${store.isAdmin() ? "selected" : ""}>Encadrant</option>`]
    .concat(store.data.projects.map(p => `<optgroup label="${esc(p.code + " · " + p.name)}">${membersOf(p.id).map(u =>
      `<option value="${esc(u.id)}" ${store.session.email === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</optgroup>`)).join("");
  return `<div class="demo-bar"><b>Mode démo</b><span>Données d'exemple, enregistrées dans ce navigateur.</span>
    <label for="demo-as">Voir l'outil en tant que</label><select id="demo-as" data-action="demo-as">${opts}</select>
    <button class="btn small" data-action="reset-demo">Réinitialiser la démo</button></div>`;
}

export function loginView() {
  return `<div class="login"><div class="card">${brandMark.replace('class="brand-mark"', 'class="brand-mark" style="width:56px;height:56px"')}
    <h1>${esc(CONFIG.appName)}</h1>
    <p class="muted">Connectez-vous avec le compte Google dont l'adresse a été donnée à votre encadrant.</p>
    <button class="btn primary big" data-action="login">Se connecter avec Google</button></div></div>`;
}

export function pendingView() {
  return `<div class="login"><div class="card"><h1>Compte pas encore inscrit</h1>
    <p>Vous êtes connecté avec <b>${esc(store.session.email)}</b>, mais cette adresse n'est inscrite dans aucun projet.</p>
    <p class="muted">Envoyez cette adresse à votre encadrant pour qu'il vous ajoute, puis rechargez la page.</p>
    <button class="btn" data-action="logout">Changer de compte</button></div></div>`;
}

// ---------- Tableau de bord encadrant ----------
export function adminDashboard() {
  const ps = store.data.projects;
  const now = new Date();
  const wk = ps[0] ? weekOf(ps[0]) : 1;
  const tv = store.data.tasks.filter(t => t.status === "a_valider").length;
  const pb = store.data.tasks.filter(t => t.status === "bloque").length;
  const health = ps.map(p => ({ p, h: projectHealth(p) }));
  const late = health.filter(x => x.h.state !== "ok").length;
  const students = store.data.users;
  const tuto = students.filter(tutorialDone).length;
  return `<div class="page-head"><div><h1>Semaine S${wk}</h1><p>${JOURS[now.getDay()]} ${fmtDate(now.toISOString())} · ${ps.length} projets, ${students.length} étudiants</p></div>
    <div class="actions"><a class="btn" href="#/planning">Planning global</a><button class="btn primary" data-action="new-task">Nouvelle tâche</button></div></div>
  <div class="kpis">
    <a class="kpi ${tv ? "warn" : ""}" href="#/validation"><b>${tv}</b><span>tâches à valider</span></a>
    <a class="kpi ${pb ? "alert" : ""}" href="#/validation"><b>${pb}</b><span>problèmes ouverts</span></a>
    <a class="kpi ${late ? "warn" : ""}" href="#/projets"><b>${late}</b><span>groupes en retard ou en alerte</span></a>
    <a class="kpi" href="#/etudiants"><b>${tuto}/${students.length}</b><span>tutoriels GitHub terminés</span></a>
  </div>
  <div class="grid grid-3">${health.map(({ p, h }) => projectCard(p, h)).join("") || `<div class="empty">Aucun projet. <a href="#/projets">Créer un projet</a></div>`}</div>
  <div class="card stack"><h2>Activité récente</h2>${feed(store.data.events.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12))}</div>`;
}

function projectCard(p, h) {
  const mem = membersOf(p.id);
  return `<article class="card proj-card" style="--pc:${esc(p.color)}">
    <div class="head"><div><div class="code">${esc(p.code)} · S${h.week}</div><h3><a class="title" href="#/projet/${esc(p.id)}">${esc(p.name)}</a></h3></div>${pill(h.state, STATE_LABEL[h.state])}</div>
    <div class="stack" style="gap:4px"><div class="row small"><span class="muted">Avancement (points validés)</span><span class="spacer"></span><b>${pct(h.progress)} %</b></div>
    <div class="bar"><i style="width:${pct(h.progress)}%;background:${esc(p.color)}"></i></div></div>
    <div class="facts"><span><b>${h.done}/${h.total}</b> faites</span><span><b>${h.toValidate.length}</b> à valider</span><span><b>${h.blocked.length}</b> bloquée${h.blocked.length > 1 ? "s" : ""}</span><span><b>${h.late.length}</b> en retard</span></div>
    <div class="members">${mem.map(u => {
      const cur = currentTasks(u.id)[0];
      return `<div class="member">${avatar(u.name)}<div><b>${esc(u.name)}</b>${tutorialDone(u) ? "" : ` <span class="tag" style="color:var(--warn)">tutoriel à faire</span>`}<div class="muted small">${cur ? esc(cur.title) : "Aucune tâche en cours"}</div></div></div>`;
    }).join("") || `<span class="muted small">Aucun étudiant</span>`}</div>
  </article>`;
}

function feed(events) {
  if (!events.length) return `<div class="empty">Rien pour l'instant.</div>`;
  return `<ul class="feed">${events.map(e => `<li><time>${esc(ago(e.at))}</time><span class="${e.alert ? "alert" : ""}">${esc(e.text)}</span></li>`).join("")}</ul>`;
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
      <div class="head"><div><div class="code">${esc(p.code)} · début ${esc(fmtDate(p.startDate + "T12:00:00"))} · ${p.weeks} semaines</div><h3><a class="title" href="#/projet/${esc(p.id)}">${esc(p.name)}</a></h3></div>${pill(h.state, STATE_LABEL[h.state])}</div>
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
  <div class="table-wrap"><table><thead><tr><th>Étudiant</th><th>Projet</th><th>Tutoriel</th><th>Tâche en cours</th><th class="num">Points</th><th>Niveau</th><th>Badges</th><th></th></tr></thead><tbody>
  ${us.map(u => {
    const st = userStats(u.id);
    const cur = currentTasks(u.id)[0];
    return `<tr><td><div class="row" style="flex-wrap:nowrap">${avatar(u.name)}<div><b>${esc(u.name)}</b><div class="muted small">${esc(u.email)}</div></div></div></td>
      <td>${esc(projectOf(u.projectId)?.code || "—")}</td>
      <td>${tutorialDone(u) ? pill("fait", "Terminé") : pill("a_valider", "À faire")}</td>
      <td class="small">${cur ? esc(cur.title) : `<span class="muted">—</span>`}</td>
      <td class="num">${st.points}</td><td class="small">${st.level.index} · ${esc(st.level.name)}</td><td class="num">${st.badges.length}</td>
      <td><button class="btn small" data-action="edit-user" data-id="${esc(u.id)}">Modifier</button></td></tr>`;
  }).join("") || `<tr><td colspan="8" class="muted">Aucun étudiant.</td></tr>`}
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
  return `<div class="page-head"><div><h1>Réglages</h1><p>Barème des points, conversion en bonus de note, sauvegardes.</p></div></div>
  <form class="card stack" data-form="settings"><h2>Points et récompenses</h2>
    <div class="form-grid">${num("pointsS", "Tâche S", s.pointsS)}${num("pointsM", "Tâche M", s.pointsM)}${num("pointsL", "Tâche L", s.pointsL)}${num("onTimeBonus", "Bonus « dans les temps »", s.onTimeBonus)}${num("tutorialPoints", "Tutoriel GitHub", s.tutorialPoints)}</div>
    <div class="form-grid">${num("bonusPerPoints", "Points pour +1 point de note", s.bonusPerPoints, "Bonus arrondi au demi-point.")}${num("bonusCap", "Bonus maximum (sur 20)", s.bonusCap)}</div>
    <label class="check"><input type="checkbox" name="leaderboardVisible" ${s.leaderboardVisible ? "checked" : ""}> Classement visible par les étudiants</label>
    <div class="small muted">Niveaux : ${LEVELS.map(l => `${esc(l.name)} (${l.min} pts)`).join(" · ")}</div>
    <div><button class="btn primary" type="submit">Enregistrer les réglages</button></div>
  </form>
  <section class="card stack"><h2>Sauvegarde</h2>
    <p class="small muted">Exportez toutes les données en JSON (projets, étudiants, tâches, historique) avant la soutenance ou pour les archiver. L'import remplace toutes les données actuelles.</p>
    <div class="actions"><button class="btn" data-action="export">Exporter en JSON</button>
      <label class="btn" for="import-file">Importer un JSON</label><input id="import-file" type="file" accept="application/json" hidden data-action="import">
      ${store.mode === "demo" ? `<button class="btn danger" data-action="reset-demo">Réinitialiser la démo</button>` : `<button class="btn" data-action="seed-example">Charger les 5 projets d'exemple</button>`}</div>
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
  let hero;
  if (!tutorialDone(me)) {
    const n = Object.values(me.tutorial?.steps || {}).filter(Boolean).length;
    hero = `<section class="hero-task"><div class="eyebrow">Première mission · obligatoire</div><h2>Le tutoriel GitHub</h2>
      <p>Avant votre première tâche, apprenez à utiliser Git et GitHub : cloner le dépôt, faire un commit, travailler sur une branche. À la fin, vous débloquez le badge <b>Welcome to Git!</b> et +${store.data.settings.tutorialPoints} points, et votre première tâche vous est attribuée automatiquement.</p>
      <div class="stack" style="gap:4px"><div class="small muted">${n}/${TUTORIAL_STEPS.length} étapes faites</div><div class="bar"><i style="width:${pct(n / TUTORIAL_STEPS.length)}%"></i></div></div>
      <div><a class="btn primary big" href="#/tutoriel">${n ? "Reprendre le tutoriel" : "Commencer le tutoriel"}</a></div></section>`;
  } else if (cur.length) {
    hero = cur.map(t => {
      if (t.status === "bloque") return `<section class="hero-task"><div class="eyebrow" style="color:var(--crit)">En attente · problème signalé</div><h2>${esc(t.title)}</h2>
        <div class="problem-text">${esc(t.problem?.text || "")}</div><p class="small muted">Commencez par la tâche de diagnostic. L'encadrant débloquera cette tâche quand le diagnostic sera validé.</p></section>`;
      return `<section class="hero-task"><div class="eyebrow">${t.kind === "diagnostic" ? "Diagnostic en cours" : "Votre tâche en cours"}</div><h2>${esc(t.title)}</h2>
        <div class="row small">${sizeTag(t.size)}<span class="tag">${esc(t.label || "")}</span><span class="muted">S${t.weekStart}–S${t.weekEnd} · à rendre avant le ${esc(fmtDate(weekEndDate(p, t.weekEnd).toISOString()))}</span><span class="spacer"></span><b style="color:var(--copper)">+${basePoints(t)} pts</b></div>
        ${t.description ? `<p class="desc">${esc(t.description)}</p>` : ""}
        ${t.feedback ? `<div class="feedback-text"><b>Renvoyée par l'encadrant :</b> ${esc(t.feedback)}</div>` : ""}
        <div class="actions"><button class="btn primary big" data-action="submit-task" data-id="${esc(t.id)}">J'ai terminé</button>${t.kind === "diagnostic" ? "" : `<button class="btn warn big" data-action="problem" data-id="${esc(t.id)}">J'ai un problème</button>`}</div></section>`;
    }).join("");
  } else {
    const next = nextTaskFor(me.id);
    hero = `<section class="hero-task"><div class="eyebrow">Aucune tâche en cours</div><h2>${next ? "Prêt pour la suite ?" : "Plus de tâche disponible pour l'instant"}</h2>
      <p>${next ? `La prochaine tâche libre de votre projet est « ${esc(next.title)} ».` : "Les tâches restantes attendent qu'une autre soit terminée, ou sont prises par votre binôme. Parlez-en à l'encadrant."}</p>
      ${next ? `<div><button class="btn primary big" data-action="start-next">Prendre cette tâche</button></div>` : ""}</section>`;
  }
  return `<div class="page-head"><div><h1>Bonjour ${esc(me.name.split(" ")[0])}</h1><p>${esc(p?.name || "")} · semaine S${weekOf(p)}${partner.length ? " · avec " + partner.map(u => esc(u.name)).join(", ") : ""}</p></div></div>
  ${hero}
  <div class="grid grid-2">
    <section class="card stack"><h2>Ma progression</h2>
      <div class="xp"><div class="points">${st.points}<span class="small muted" style="font-size:.9rem"> pts</span></div>
      <div class="lvl"><div class="row small"><b>Niveau ${st.level.index} · ${esc(st.level.name)}</b><span class="spacer"></span><span class="muted">${st.level.next ? `${st.level.next.min - st.points} pts avant ${esc(st.level.next.name)}` : "Niveau maximum"}</span></div><div class="bar copper"><i style="width:${pct(st.level.progress)}%"></i></div></div></div>
      <div class="small">Bonus de note estimé : <b>+${st.bonus}</b> / ${store.data.settings.bonusCap}</div>
    </section>
    <section class="card stack"><h2>En attente de validation</h2>
      ${waiting.length ? waiting.map(t => `<div class="row small"><span class="pill a_valider">À valider</span><span>${esc(t.title)}</span><span class="spacer"></span><span class="muted">+${basePoints(t)}</span></div>`).join("") : `<p class="muted small">Rien en attente.</p>`}
      ${done.length ? `<h3 style="margin-top:6px">Validées</h3>${done.slice(0, 6).map(t => `<div class="row small"><span class="pill fait">Fait</span><span>${esc(t.title)}</span><span class="spacer"></span><b style="color:var(--copper)">+${t.pointsAwarded ?? basePoints(t)}</b></div>`).join("")}` : ""}
    </section>
  </div>
  <section class="card stack"><h2>Mes badges <span class="muted">(${st.badges.length}/${BADGES.length})</span></h2>
    <div class="badges">${BADGES.map(b => { const has = st.badges.includes(b.id); return `<div class="badge ${has ? "" : "locked"}">${badgeSvg(b, has)}<b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`; }).join("")}</div>
  </section>`;
}

export function tutorialView() {
  const me = userOf(store.session.email);
  if (!me) return `<div class="page-head"><div><h1>Tutoriel GitHub</h1><p>Cette page est destinée aux étudiants. Passez en mode étudiant dans la barre de démo pour la tester.</p></div></div>${tutorialPreview()}`;
  const p = projectOf(me.projectId);
  const steps = me.tutorial?.steps || {};
  const quiz = me.tutorial?.quiz || {};
  const repo = repoName(p);
  const allSteps = TUTORIAL_STEPS.every(s => steps[s.id]);
  const done = tutorialDone(me);
  const welcome = BADGES.find(b => b.id === "welcome-git");
  return `<div class="page-head"><div><h1>Tutoriel GitHub</h1><p>${TUTORIAL_STEPS.length} étapes, un quiz de ${TUTORIAL_QUIZ.length} questions, puis le lien de votre premier commit. Comptez 45 minutes.</p></div></div>
  <div class="tuto"><div class="stack">${TUTORIAL_STEPS.map((s, i) => `<article class="step ${steps[s.id] ? "done" : ""}"><div class="step-num">${steps[s.id] ? "✓" : i + 1}</div><div class="step-body">
      <h3>${esc(s.title)}</h3>${s.body}${s.code ? `<pre class="cmd"><code>${esc(s.code.replaceAll("{ORG}", CONFIG.githubOrg).replaceAll("{REPO}", repo))}</code></pre>` : ""}
      ${s.tip ? `<p class="tip">${esc(s.tip)}</p>` : ""}
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
  const ms = p?.milestones || [{ id: "m1", name: "Cahier des charges", week: 1 }, { id: "m2", name: "Démo technique", week: 4 }, { id: "m3", name: "MVP fonctionnel", week: 6 }, { id: "m4", name: "Soutenance", week: 8 }];
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
    <div class="field"><label for="p-color">Couleur</label><input id="p-color" name="color" type="color" value="${esc(p?.color || "#1d6a48")}" style="height:40px;padding:3px"></div>
  </div>
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
