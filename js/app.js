// Point d'entrée : routage, rendu, actions.
import { store } from "./store.js";
import {
  STATUS_LABEL, BADGES, uid, nowIso, projectOf, userOf, taskOf, basePoints, userStats,
  submitTask, reportProblem, validateTask, rejectTask, unblockTask, startNext, completeTutorial,
  canStudentMove, tutorialDone
} from "./logic.js";
import { TUTORIAL_STEPS, TUTORIAL_QUIZ, isCommitUrl } from "./tutorial.js";
import { esc, modal, confirmBox, toast } from "./ui.js";
import * as V from "./views.js";

const app = document.getElementById("app");
let lastBadges = null, lastUser = null, deferred = false;

function route() { return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean); }

function render() {
  const a = document.activeElement;
  if (a && app.contains(a) && a.matches("input:not([type=checkbox]):not([type=radio]),textarea")) { deferred = true; return; }
  deferred = false;
  if (!store.ready) { app.innerHTML = `<div class="login"><p class="muted">Chargement…</p></div>`; return; }
  if (!store.session) { app.innerHTML = V.loginView(); return; }
  if (store.session.pending) { app.innerHTML = V.pendingView(); return; }
  const r = route();
  const admin = store.isAdmin();
  let html;
  const [page, id, tab] = r;
  if (page === "projet") {
    const p = projectOf(id);
    const me = userOf(store.session.email);
    if (!p || (!admin && me?.projectId !== p.id)) html = `<div class="empty">Projet introuvable.</div>`;
    else html = V.projectView(p, tab);
  } else if (admin) {
    html = ({ validation: V.validationView, projets: V.projectsView, planning: V.planningView, etudiants: V.studentsView,
      classement: V.leaderboardView, reglages: V.settingsView, tutoriel: V.tutorialView }[page] || V.adminDashboard)();
  } else {
    html = ({ tutoriel: V.tutorialView, classement: store.data.settings.leaderboardVisible ? V.leaderboardView : V.studentHome }[page] || V.studentHome)();
  }
  const y = window.scrollY;
  app.innerHTML = V.shell(r, html);
  if (lastUser === store.session.email) window.scrollTo(0, y);
  checkRewards();
  wireDrag();
}

function checkRewards() {
  if (store.isAdmin()) { lastBadges = null; lastUser = store.session.email; return; }
  const st = userStats(store.session.email);
  if (lastUser === store.session.email && lastBadges) {
    const fresh = st.badges.filter(b => !lastBadges.includes(b));
    if (fresh.length) toast(`Badge débloqué : ${BADGES.find(b => b.id === fresh[0]).name}`, "reward");
  }
  lastBadges = st.badges; lastUser = store.session.email;
}

document.addEventListener("focusout", () => setTimeout(() => { if (deferred) render(); }, 0));
window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });
store.on(render);

// ---------- Actions ----------
const actions = {
  "open-task": el => openTask(el.dataset.id),
  "new-task": el => editTask(null, el.dataset.project || route()[1]),
  "new-project": () => editProject(null),
  "edit-project": el => editProject(el.dataset.id),
  "new-user": () => editUser(null),
  "edit-user": el => editUser(el.dataset.id),
  validate: async el => { const t = taskOf(el.dataset.id); await validateTask(el.dataset.id); toast(`Validée : +${taskOf(t.id).pointsAwarded} pts`, "reward"); },
  reject: el => rejectDialog(el.dataset.id),
  unblock: async el => { await unblockTask(el.dataset.id); toast("Tâche débloquée"); },
  "submit-task": el => submitDialog(el.dataset.id),
  problem: el => problemDialog(el.dataset.id),
  "start-next": async () => { const ok = await startNext(store.session.email); toast(ok ? "Nouvelle tâche attribuée" : "Aucune tâche disponible"); },
  "reset-demo": async () => { if (await confirmBox("Réinitialiser la démo", "Toutes les modifications faites dans ce navigateur seront effacées et les données d'exemple rechargées.", "Réinitialiser")) { store.resetDemo(); location.hash = "#/"; toast("Démo réinitialisée"); } },
  "seed-example": async () => { if (await confirmBox("Charger les données d'exemple", "Les 5 projets d'exemple et leurs étudiants fictifs remplaceront toutes les données actuelles.", "Remplacer")) { await store.seedExample(); toast("Données d'exemple chargées"); } },
  export: () => exportJson(),
  login: () => store.login().catch(e => toast("Connexion impossible : " + e.message)),
  logout: () => store.logout(),
  "add-ms": el => el.closest("form").querySelector("#ms-list").insertAdjacentHTML("beforeend", V.msRow({ week: 1 })),
  "del-ms": el => el.closest(".ms-row").remove()
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-action]");
  if (!el || el.tagName === "SELECT" || el.type === "checkbox" || el.type === "file") return;
  if (e.target.closest("a[href]") && !el.matches("a")) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); Promise.resolve(fn(el)).catch(err => { console.error(err); toast("Action refusée : " + (err.message || err)); }); }
});

document.addEventListener("change", async e => {
  const el = e.target;
  if (el.dataset.action === "demo-as") { await store.demoLogin(el.value); location.hash = "#/"; render(); }
  if (el.dataset.action === "tuto-step") {
    const me = userOf(store.session.email);
    const steps = { ...(me.tutorial?.steps || {}), [el.dataset.step]: el.checked };
    await store.put("users", { ...me, tutorial: { ...(me.tutorial || {}), steps } });
  }
  const quizForm = el.closest?.("[data-form=quiz]");
  if (quizForm && (el.type === "radio" || el.name === "proof")) {
    const me = userOf(store.session.email);
    const tuto = { ...(me.tutorial || {}) };
    if (el.type === "radio") tuto.quiz = { ...(tuto.quiz || {}), [el.name]: Number(el.value) };
    else tuto.proof = el.value.trim();
    await store.put("users", { ...me, tutorial: tuto });
  }
  if (el.dataset.action === "import" && el.files?.[0]) {
    try {
      const data = JSON.parse(await el.files[0].text());
      if (!Array.isArray(data.projects)) throw new Error("fichier sans projets");
      if (await confirmBox("Importer la sauvegarde", `${data.projects.length} projets, ${(data.users || []).length} étudiants et ${(data.tasks || []).length} tâches remplaceront les données actuelles.`, "Importer")) {
        await store.importAll(data); toast("Sauvegarde importée");
      }
    } catch (err) { toast("Import impossible : " + err.message); }
    el.value = "";
  }
});

document.addEventListener("submit", async e => {
  const f = e.target;
  if (f.dataset.form === "settings") {
    e.preventDefault();
    const fd = new FormData(f);
    const s = {};
    for (const k of ["pointsS", "pointsM", "pointsL", "onTimeBonus", "tutorialPoints", "bonusPerPoints", "bonusCap"]) s[k] = Math.max(0, Number(fd.get(k)) || 0);
    s.bonusPerPoints = s.bonusPerPoints || 1;
    s.leaderboardVisible = fd.get("leaderboardVisible") === "on";
    await store.commit([{ type: "put", col: "settings", obj: s }]);
    toast("Réglages enregistrés");
  }
  if (f.dataset.form === "quiz") {
    e.preventDefault();
    const fd = new FormData(f);
    const me = userOf(store.session.email);
    const quiz = {};
    TUTORIAL_QUIZ.forEach(q => { const v = fd.get(q.id); if (v != null) quiz[q.id] = Number(v); });
    const proof = String(fd.get("proof") || "").trim();
    const wrong = TUTORIAL_QUIZ.filter(q => quiz[q.id] !== q.answer);
    document.activeElement?.blur();
    await store.put("users", { ...me, tutorial: { ...(me.tutorial || {}), quiz, proof, quizChecked: true } });
    if (!TUTORIAL_STEPS.every(s => me.tutorial?.steps?.[s.id])) return toast("Cochez d'abord toutes les étapes");
    if (wrong.length) return toast(`${wrong.length} réponse${wrong.length > 1 ? "s" : ""} à revoir dans le quiz`);
    if (!isCommitUrl(proof)) return toast("Collez l'adresse d'un commit GitHub (…/commit/…)");
    await completeTutorial(me.id, proof);
    toast("Badge débloqué : Welcome to Git! (+" + store.data.settings.tutorialPoints + " pts)", "reward");
    lastBadges = userStats(me.id).badges;
  }
});

// ---------- Modales ----------
function openTask(id) {
  const t = taskOf(id);
  if (!t) return;
  if (store.isAdmin()) return editTask(t);
  const mine = t.assignee === store.session.email && t.status === "en_cours";
  const m = modal({
    title: t.title, body: V.taskReadOnly(t) + (mine ? `<div class="actions"><button type="button" class="btn primary" data-action="submit-task" data-id="${esc(t.id)}">J'ai terminé</button>${t.kind === "diagnostic" ? "" : `<button type="button" class="btn warn" data-action="problem" data-id="${esc(t.id)}">J'ai un problème</button>`}</div>` : ""),
    submit: "", cancel: "Fermer"
  });
  m.el.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => m.close()));
}

function editTask(t, projectId) {
  const m = modal({
    title: t ? "Modifier la tâche" : "Nouvelle tâche", body: V.taskForm(t, projectId), wide: true,
    submit: t ? "Enregistrer" : "Créer la tâche", danger: t ? "Supprimer" : "",
    onSubmit: async f => {
      const fd = new FormData(f);
      const ws = Number(fd.get("weekStart")), we = Number(fd.get("weekEnd"));
      if (we < ws) { toast("La semaine de fin doit suivre la semaine de début"); return false; }
      const status = fd.get("status");
      const obj = {
        ...(t || { id: uid("t"), kind: "normal", createdAt: nowIso(), order: Date.now() }),
        title: String(fd.get("title")).trim(), description: String(fd.get("description") || "").trim(),
        projectId: fd.get("projectId"), size: fd.get("size"), label: fd.get("label"),
        weekStart: ws, weekEnd: we, milestone: fd.get("milestone") || "",
        assignee: fd.get("assignee") || null, status, dependsOn: fd.getAll("dependsOn")
      };
      if (status === "fait" && t?.status !== "fait") { obj.validatedAt = nowIso(); obj.submittedAt = obj.submittedAt || nowIso(); obj.pointsAwarded = basePoints(obj); }
      if (status !== "fait") delete obj.pointsAwarded;
      if (status === "en_cours" && !obj.assignee) { toast("Une tâche en cours doit être assignée"); return false; }
      await store.commit([
        { type: "put", col: "tasks", obj },
        { type: "put", col: "events", obj: { id: uid("e"), at: nowIso(), actor: store.session.email, type: "edit", projectId: obj.projectId, text: `${t ? "Tâche modifiée" : "Nouvelle tâche"} : « ${obj.title} » (${STATUS_LABEL[status]})` } }
      ]);
      toast(t ? "Tâche enregistrée" : "Tâche créée");
    },
    onDanger: async () => {
      if (!(await confirmBox("Supprimer la tâche", `« ${esc(t.title)} » sera supprimée définitivement.`, "Supprimer"))) return false;
      const ops = [{ type: "del", col: "tasks", id: t.id }];
      store.data.tasks.filter(x => (x.dependsOn || []).includes(t.id))
        .forEach(x => ops.push({ type: "put", col: "tasks", obj: { ...x, dependsOn: x.dependsOn.filter(d => d !== t.id) } }));
      await store.commit(ops);
      toast("Tâche supprimée");
    }
  });
  m.el.querySelector("#f-project")?.addEventListener("change", e => {
    const draft = { ...(t || {}), projectId: e.target.value, milestone: "", assignee: null, dependsOn: [] };
    m.close(); editTask(t ? draft : null, e.target.value);
  });
}

function editProject(id) {
  const p = id ? projectOf(id) : null;
  modal({
    title: p ? "Modifier le projet" : "Nouveau projet", body: V.projectForm(p), wide: true,
    submit: p ? "Enregistrer" : "Créer le projet", danger: p ? "Supprimer le projet" : "",
    onSubmit: async f => {
      const fd = new FormData(f);
      const milestones = [...f.querySelectorAll(".ms-row")].map(r => ({
        id: r.dataset.ms, name: r.querySelector("[name=ms-name]").value.trim(), week: Math.max(1, Number(r.querySelector("[name=ms-week]").value) || 1)
      })).filter(m => m.name);
      const obj = {
        ...(p || { id: uid("p"), createdAt: nowIso() }),
        code: String(fd.get("code")).trim(), name: String(fd.get("name")).trim(), description: String(fd.get("description") || "").trim(),
        startDate: fd.get("startDate"), weeks: Math.max(1, Number(fd.get("weeks")) || 8), color: fd.get("color"),
        repoUrl: String(fd.get("repoUrl") || "").trim(), milestones
      };
      await store.put("projects", obj);
      toast(p ? "Projet enregistré" : "Projet créé");
      if (!p) location.hash = "#/projet/" + obj.id;
    },
    onDanger: async () => {
      const n = store.data.tasks.filter(t => t.projectId === p.id).length;
      if (!(await confirmBox("Supprimer le projet", `« ${esc(p.name)} » et ses ${n} tâches seront supprimés. Les étudiants du projet seront conservés, sans projet.`, "Supprimer"))) return false;
      const ops = [{ type: "del", col: "projects", id: p.id }];
      store.data.tasks.filter(t => t.projectId === p.id).forEach(t => ops.push({ type: "del", col: "tasks", id: t.id }));
      store.data.users.filter(u => u.projectId === p.id).forEach(u => ops.push({ type: "put", col: "users", obj: { ...u, projectId: "" } }));
      await store.commit(ops);
      location.hash = "#/projets";
      toast("Projet supprimé");
    }
  });
}

function editUser(id) {
  const u = id ? userOf(id) : null;
  if (!store.data.projects.length) return toast("Créez d'abord un projet");
  modal({
    title: u ? "Modifier l'étudiant" : "Ajouter un étudiant", body: V.userForm(u),
    submit: u ? "Enregistrer" : "Ajouter", danger: u ? "Supprimer" : "",
    onSubmit: async f => {
      const fd = new FormData(f);
      const email = String(fd.get("email")).trim().toLowerCase();
      if (!u && userOf(email)) { toast("Cet e-mail est déjà inscrit"); return false; }
      const obj = { ...(u || { id: email, email, role: "student", tutorial: { steps: {} }, createdAt: nowIso() }), name: String(fd.get("name")).trim(), projectId: fd.get("projectId") };
      if (fd.get("resetTuto") === "on") obj.tutorial = { steps: {} };
      const ops = [{ type: "put", col: "users", obj }];
      if (u && u.projectId !== obj.projectId) // les tâches non terminées restent dans l'ancien projet, libérées
        store.data.tasks.filter(t => t.assignee === u.id && t.status !== "fait")
          .forEach(t => ops.push({ type: "put", col: "tasks", obj: { ...t, assignee: null, status: t.status === "a_valider" ? "a_valider" : "backlog" } }));
      await store.commit(ops);
      toast(u ? "Étudiant enregistré" : "Étudiant ajouté");
    },
    onDanger: async () => {
      if (!(await confirmBox("Supprimer l'étudiant", `${esc(u.name)} sera retiré. Ses tâches non terminées redeviennent libres ; ses tâches validées restent dans l'historique.`, "Supprimer"))) return false;
      const ops = [{ type: "del", col: "users", id: u.id }];
      store.data.tasks.filter(t => t.assignee === u.id && t.status !== "fait")
        .forEach(t => ops.push({ type: "put", col: "tasks", obj: { ...t, assignee: null, status: "backlog" } }));
      await store.commit(ops);
      toast("Étudiant supprimé");
    }
  });
}

function submitDialog(id) {
  const t = taskOf(id);
  modal({
    title: "Tâche terminée", submit: "Envoyer à l'encadrant",
    body: `<p><b>${esc(t.title)}</b></p><p class="small muted">Collez le lien qui prouve le travail : un commit, une pull request, une photo ou une vidéo dans le dépôt. L'encadrant valide en réunion et vous recevez alors <b>+${basePoints(t)} points</b>${" "}(bonus si c'est dans les temps).</p>
      <div class="field"><label for="proof">Lien de la preuve</label><input id="proof" name="proof" type="url" placeholder="https://github.com/…/commit/…" value="${esc(t.proof || "")}"></div>`,
    onSubmit: async f => {
      const proof = String(new FormData(f).get("proof") || "").trim();
      if (!proof) { toast("Ajoutez un lien : sans preuve, l'encadrant ne peut pas valider"); return false; }
      const next = await submitTask(id, proof);
      toast(next ? `Envoyée. Nouvelle tâche : ${next.title}` : "Envoyée à l'encadrant", next ? "reward" : "");
    }
  });
}

function problemDialog(id) {
  const t = taskOf(id);
  modal({
    title: "Signaler un problème", submit: "Signaler",
    body: `<p><b>${esc(t.title)}</b></p><p class="small muted">La tâche passe en « Bloqué » et l'encadrant est prévenu. Vous recevez une tâche courte de diagnostic pour analyser le problème : elle rapporte des points et le badge « Débloqueur ».</p>
      <div class="field"><label for="ptext">Qu'est-ce qui bloque ?</label><textarea id="ptext" name="text" required placeholder="Ce que j'ai essayé, ce que j'attendais, ce que j'observe"></textarea></div>`,
    onSubmit: async f => {
      const text = String(new FormData(f).get("text") || "").trim();
      if (text.length < 15) { toast("Décrivez le problème en une ou deux phrases"); return false; }
      await reportProblem(id, text);
      toast("Problème signalé : tâche de diagnostic attribuée");
    }
  });
}

function rejectDialog(id) {
  const t = taskOf(id);
  modal({
    title: "Renvoyer la tâche", submit: "Renvoyer à l'étudiant",
    body: `<p><b>${esc(t.title)}</b> · ${esc(userOf(t.assignee)?.name || "")}</p>
      <div class="field"><label for="fb">Ce qu'il manque</label><textarea id="fb" name="fb" required placeholder="Ex. : ajouter la mesure de latence dans docs/"></textarea></div>`,
    onSubmit: async f => { await rejectTask(id, String(new FormData(f).get("fb")).trim()); toast("Tâche renvoyée"); }
  });
}

function exportJson() {
  const { projects, users, tasks, events, settings } = store.data;
  const json = JSON.stringify({ exportedAt: nowIso(), projects, users, tasks, events, settings }, null, 2);
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = `atelier-projets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch { /* téléchargement bloqué */ }
  const out = document.getElementById("export-out");
  if (out) { out.hidden = false; out.value = json; }
  toast("Export prêt (téléchargement, ou copiez le texte affiché)");
}

// ---------- Glisser-déposer (Kanban) ----------
function wireDrag() {
  app.querySelectorAll(".kcard[draggable=true]").forEach(c => c.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", c.dataset.id); e.dataTransfer.effectAllowed = "move";
  }));
  app.querySelectorAll(".col[data-drop]").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drop"); });
    col.addEventListener("dragleave", () => col.classList.remove("drop"));
    col.addEventListener("drop", async e => {
      e.preventDefault(); col.classList.remove("drop");
      const t = taskOf(e.dataTransfer.getData("text/plain"));
      const to = col.dataset.drop;
      if (!t || t.status === to) return;
      try {
        if (store.isAdmin()) {
          if (to === "fait") { if (t.status === "a_valider" || t.assignee) { await validateTask(t.id); toast(`Validée : +${taskOf(t.id).pointsAwarded} pts`, "reward"); } else toast("Assignez la tâche avant de la valider"); return; }
          if (to === "en_cours" && !t.assignee) { toast("Assignez d'abord la tâche (cliquez dessus)"); return; }
          const obj = { ...t, status: to };
          if (to === "backlog") { delete obj.pointsAwarded; }
          if (t.status === "fait") { delete obj.pointsAwarded; obj.validatedAt = null; }
          await store.put("tasks", obj);
          toast(`« ${t.title} » → ${STATUS_LABEL[to]}`);
        } else if (canStudentMove(t, to) && to === "a_valider") submitDialog(t.id);
        else toast("Utilisez « Mon espace » pour terminer une tâche ou signaler un problème");
      } catch (err) { toast("Action refusée : " + err.message); }
    });
  });
}

// ---------- Démarrage ----------
render();
store.init().then(render).catch(err => {
  console.error(err);
  app.innerHTML = `<div class="login"><div class="card"><h1>Démarrage impossible</h1><p>${esc(err.message)}</p><p class="muted small">Vérifiez la configuration Firebase dans js/config.js.</p></div></div>`;
});
