// Règles métier : semaines, points, niveaux, badges, attribution automatique.
import { store } from "./store.js";

export const STATUSES = [
  { id: "backlog", label: "Backlog" },
  { id: "en_cours", label: "En cours" },
  { id: "bloque", label: "Bloqué" },
  { id: "a_valider", label: "À valider" },
  { id: "fait", label: "Fait" }
];
export const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.id, s.label]));
export const LABELS = ["Matériel", "Firmware", "Logiciel", "Mécanique", "Tests", "Rapport"];
export const SIZES = { S: "S · ½ à 1 jour", M: "M · 1 à 2 jours", L: "L · 2 à 4 jours" };

export const LEVELS = [
  { min: 0, name: "Apprenti" },
  { min: 60, name: "Bricoleur" },
  { min: 150, name: "Technicien" },
  { min: 300, name: "Ingénieur" },
  { min: 500, name: "Expert" }
];

export const BADGES = [
  { id: "welcome-git", color: "#2563C9", name: "Welcome to Git!", desc: "Tutoriel GitHub terminé : premier commit poussé.", glyph: "git" },
  { id: "premier-pas", color: "#0E8A74", name: "Premier pas", desc: "Première tâche du projet validée.", glyph: "step" },
  { id: "debloqueur", color: "#B4486F", name: "Débloqueur", desc: "Un problème analysé et résolu.", glyph: "key" },
  { id: "gros-morceau", color: "#6B4FC8", name: "Gros morceau", desc: "Une tâche de taille L validée.", glyph: "weight" },
  { id: "dans-les-temps", color: "#C27A12", name: "Dans les temps", desc: "5 tâches rendues avant leur échéance.", glyph: "clock" },
  { id: "regulier", color: "#1F7FA8", name: "Régulier", desc: "Des tâches validées sur 3 semaines différentes.", glyph: "wave" },
  { id: "jalon-tenu", color: "#0E2747", name: "Jalon tenu", desc: "Toutes les tâches d'un jalon validées à temps (badge du binôme).", glyph: "flag" },
  { id: "machine", color: "#5B6B82", name: "Machine", desc: "10 tâches validées.", glyph: "gear" }
];

const DAY = 864e5;
export const uid = (p = "t") => p + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const nowIso = () => new Date().toISOString();

export function weekOf(project, date = new Date()) {
  if (!project?.startDate) return 1;
  const start = Date.parse(project.startDate + "T00:00:00");
  return Math.floor((new Date(date).getTime() - start) / (7 * DAY)) + 1;
}
export function weekEndDate(project, week) {
  const start = Date.parse(project.startDate + "T00:00:00");
  return new Date(start + week * 7 * DAY - 1);
}
export function weekStartDate(project, week) {
  const start = Date.parse(project.startDate + "T00:00:00");
  return new Date(start + (week - 1) * 7 * DAY);
}

export const projectOf = id => store.data.projects.find(p => p.id === id);
export const userOf = id => store.data.users.find(u => u.id === id);
export const taskOf = id => store.data.tasks.find(t => t.id === id);
export const tasksOf = projectId => store.data.tasks.filter(t => t.projectId === projectId)
  .sort((a, b) => (a.weekStart - b.weekStart) || ((a.order ?? 0) - (b.order ?? 0)) || a.title.localeCompare(b.title));
export const membersOf = projectId => store.data.users.filter(u => u.projectId === projectId);

export function basePoints(task) {
  const s = store.data.settings;
  return task.size === "L" ? s.pointsL : task.size === "M" ? s.pointsM : s.pointsS;
}

export function onTime(task) {
  const p = projectOf(task.projectId);
  if (!p || !task.submittedAt) return false;
  return Date.parse(task.submittedAt) <= weekEndDate(p, task.weekEnd).getTime();
}

export function levelFor(points) {
  let lvl = LEVELS[0], idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.min) { lvl = l; idx = i; } });
  const next = LEVELS[idx + 1];
  return { ...lvl, index: idx + 1, next, progress: next ? (points - lvl.min) / (next.min - lvl.min) : 1 };
}

export function tutorialDone(user) { return !!user?.tutorial?.completedAt; }

export function userStats(email) {
  const u = userOf(email);
  const s = store.data.settings;
  const done = store.data.tasks.filter(t => t.assignee === email && t.status === "fait");
  let points = done.reduce((acc, t) => acc + (t.pointsAwarded ?? basePoints(t)), 0);
  if (tutorialDone(u)) points += s.tutorialPoints;
  const normal = done.filter(t => t.kind !== "diagnostic");
  const weeks = new Set(done.map(t => { const p = projectOf(t.projectId); return p ? weekOf(p, t.validatedAt) : 0; }));
  const badges = new Set();
  if (tutorialDone(u)) badges.add("welcome-git");
  if (normal.length >= 1) badges.add("premier-pas");
  if (done.some(t => t.kind === "diagnostic")) badges.add("debloqueur");
  if (normal.some(t => t.size === "L")) badges.add("gros-morceau");
  if (done.filter(onTime).length >= 5) badges.add("dans-les-temps");
  if (weeks.size >= 3) badges.add("regulier");
  if (done.length >= 10) badges.add("machine");
  if (u && milestonesHeld(u.projectId).length) badges.add("jalon-tenu");
  const level = levelFor(points);
  const bonus = Math.min(s.bonusCap, Math.floor((points / s.bonusPerPoints) * 2) / 2);
  return { user: u, points, done: done.length, badges: [...badges], level, bonus };
}

export function milestonesHeld(projectId) {
  const p = projectOf(projectId);
  if (!p) return [];
  return (p.milestones || []).filter(m => {
    const ts = store.data.tasks.filter(t => t.projectId === projectId && t.milestone === m.id);
    if (!ts.length) return false;
    const limit = weekEndDate(p, m.week).getTime();
    return ts.every(t => t.status === "fait" && t.submittedAt && Date.parse(t.submittedAt) <= limit);
  });
}

export function projectHealth(project) {
  const ts = store.data.tasks.filter(t => t.projectId === project.id);
  const wk = weekOf(project);
  const late = ts.filter(t => t.status !== "fait" && t.status !== "a_valider" && t.weekEnd < wk);
  const blocked = ts.filter(t => t.status === "bloque");
  const toValidate = ts.filter(t => t.status === "a_valider");
  const total = ts.reduce((a, t) => a + basePoints(t), 0) || 1;
  const doneP = ts.filter(t => t.status === "fait").reduce((a, t) => a + basePoints(t), 0);
  let state = "ok";
  if (late.length) state = "retard";
  if (late.length >= 3 || (blocked.length && late.length)) state = "alerte";
  return { week: wk, late, blocked, toValidate, progress: doneP / total, state, total: ts.length, done: ts.filter(t => t.status === "fait").length };
}

export const STATE_LABEL = { ok: "À l'heure", retard: "En retard", alerte: "En alerte" };

function depsMet(task) {
  return (task.dependsOn || []).every(id => {
    const d = taskOf(id);
    return !d || d.status === "fait" || d.status === "a_valider";
  });
}

export function nextTaskFor(email) {
  const u = userOf(email);
  if (!u) return null;
  const p = projectOf(u.projectId);
  const horizon = weekOf(p) + 1; // pas de tâche prévue plus d'une semaine à l'avance
  return tasksOf(u.projectId).find(t =>
    t.status === "backlog" && t.kind !== "diagnostic" && (!t.assignee || t.assignee === email) && depsMet(t) && t.weekStart <= horizon) || null;
}

export function currentTasks(email) {
  return store.data.tasks.filter(t => t.assignee === email && (t.status === "en_cours" || t.status === "bloque"))
    .sort((a, b) => (a.status === "bloque") - (b.status === "bloque"));
}

function event(type, text, projectId, extra = {}) {
  return { type: "put", col: "events", obj: { id: uid("e"), at: nowIso(), actor: store.session?.email || "", type, text, projectId: projectId || "", owner: store.ownerFor(projectId), ...extra } };
}

// --- Actions étudiant ---
export function opsStartNext(email) {
  const u = userOf(email);
  if (!u || !tutorialDone(u)) return [];
  if (store.data.tasks.some(t => t.assignee === email && t.status === "en_cours")) return [];
  const next = nextTaskFor(email);
  if (!next) return [];
  return [
    { type: "put", col: "tasks", obj: { ...next, assignee: email, status: "en_cours", startedAt: nowIso() } },
    event("assign", `${u.name} reçoit automatiquement « ${next.title} »`, u.projectId)
  ];
}

export async function startNext(email) {
  const ops = opsStartNext(email);
  if (ops.length) await store.commit(ops);
  return ops.length > 0;
}

export async function submitTask(taskId, proof) {
  const t = taskOf(taskId);
  const u = userOf(t.assignee);
  const updated = { ...t, status: "a_valider", submittedAt: nowIso(), proof: proof || "", feedback: "" };
  // On calcule la tâche suivante comme si celle-ci était déjà rendue.
  const idx = store.data.tasks.findIndex(x => x.id === t.id);
  const saved = store.data.tasks[idx];
  store.data.tasks[idx] = updated;
  const nextOps = opsStartNext(t.assignee);
  store.data.tasks[idx] = saved;
  await store.commit([
    { type: "put", col: "tasks", obj: updated },
    event("submit", `${u?.name || t.assignee} a terminé « ${t.title} » (à valider)`, t.projectId),
    ...nextOps
  ]);
  return nextOps.find(o => o.col === "tasks")?.obj || null;
}

export async function reportProblem(taskId, text) {
  const t = taskOf(taskId);
  const u = userOf(t.assignee);
  const p = projectOf(t.projectId);
  const wk = Math.max(1, Math.min(p?.weeks || 8, weekOf(p)));
  const diag = {
    id: uid("t"), projectId: t.projectId, owner: t.owner, kind: "diagnostic", parentTaskId: t.id,
    title: `Analyser le problème : ${t.title}`,
    description: "1. Décrire précisément ce qui ne marche pas (ce que vous attendiez, ce que vous observez).\n2. Isoler : tester chaque élément séparément (montage minimal, code minimal).\n3. Noter les mesures, captures et messages d'erreur.\n4. Proposer au moins une piste de solution et la tester.\n5. Mettre le compte rendu dans le dépôt (docs/) et coller le lien comme preuve.",
    size: "S", label: t.label, weekStart: wk, weekEnd: wk, dependsOn: [], milestone: "",
    assignee: t.assignee, status: "en_cours", startedAt: nowIso(), createdAt: nowIso(), order: (t.order ?? 0) + 0.5
  };
  await store.commit([
    { type: "put", col: "tasks", obj: { ...t, status: "bloque", problem: { text, at: nowIso(), diagnosticId: diag.id } } },
    { type: "put", col: "tasks", obj: diag },
    event("problem", `${u?.name || t.assignee} signale un problème sur « ${t.title} » : ${text}`, t.projectId, { alert: true })
  ]);
  return diag;
}

export async function completeTutorial(email, proof) {
  const u = userOf(email);
  const updated = { ...u, tutorial: { ...(u.tutorial || {}), proof, completedAt: nowIso() } };
  const idx = store.data.users.findIndex(x => x.id === email);
  const saved = store.data.users[idx];
  store.data.users[idx] = updated;
  const nextOps = opsStartNext(email);
  store.data.users[idx] = saved;
  await store.commit([
    { type: "put", col: "users", obj: updated },
    event("badge", `${u.name} a terminé le tutoriel GitHub : badge « Welcome to Git! »`, u.projectId),
    ...nextOps
  ]);
}

// --- Actions encadrant ---
export async function validateTask(taskId) {
  const t = taskOf(taskId);
  const pts = basePoints(t) + (onTime(t) ? store.data.settings.onTimeBonus : 0);
  const ops = [
    { type: "put", col: "tasks", obj: { ...t, status: "fait", validatedAt: nowIso(), pointsAwarded: pts } },
    event("validate", `« ${t.title} » validée (+${pts} pts pour ${userOf(t.assignee)?.name || "—"})`, t.projectId)
  ];
  if (t.kind === "diagnostic" && t.parentTaskId) {
    const parent = taskOf(t.parentTaskId);
    if (parent && parent.status === "bloque")
      ops.push({ type: "put", col: "tasks", obj: { ...parent, status: "en_cours", problem: { ...(parent.problem || {}), resolvedAt: nowIso() } } });
  }
  await store.commit(ops);
}

export async function rejectTask(taskId, feedback) {
  const t = taskOf(taskId);
  await store.commit([
    { type: "put", col: "tasks", obj: { ...t, status: "en_cours", feedback, submittedAt: null } },
    event("reject", `« ${t.title} » renvoyée : ${feedback}`, t.projectId)
  ]);
}

export async function unblockTask(taskId) {
  const t = taskOf(taskId);
  await store.commit([
    { type: "put", col: "tasks", obj: { ...t, status: "en_cours", problem: { ...(t.problem || {}), resolvedAt: nowIso() } } },
    event("unblock", `« ${t.title} » débloquée par l'encadrant`, t.projectId)
  ]);
}

export function canStudentMove(task, to) {
  const me = store.session?.email;
  if (task.assignee !== me) return false;
  return ["en_cours", "a_valider"].includes(to) && task.status !== "fait";
}
