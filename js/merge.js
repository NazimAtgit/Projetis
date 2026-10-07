// Import « Ajouter / mettre à jour » : fusionne un fichier JSON avec les données en place.
// Règles : rien n'est jamais supprimé ; l'avancement des étudiants (état, assignation,
// preuves, points, tutoriel) n'est jamais modifié ; seuls les champs de planification le sont.
//
// Format accepté (toutes les listes sont facultatives) :
// {
//   "projects": [{ "code": "P6", "name": "…", "description": "…", "startDate": "2026-10-12",
//                  "weeks": 8, "color": "#2f7d5b", "repoUrl": "…",
//                  "milestones": [{ "name": "MVP", "week": 6 }] }],
//   "users":    [{ "email": "…@gmail.com", "name": "…", "project": "P6" }],
//   "tasks":    [{ "id": "p6-gps", "project": "P6", "title": "…", "description": "…",
//                  "size": "S|M|L", "label": "Firmware", "weekStart": 1, "weekEnd": 2,
//                  "milestone": "MVP", "dependsOn": ["p6-cdc"] }]
// }
// Un projet est reconnu par son "id" ou son "code" ; un étudiant par son e-mail ;
// une tâche par son "id" (sinon par projet + titre identique).

const SIZES = ["S", "M", "L"];
const LABELS = ["Matériel", "Firmware", "Logiciel", "Mécanique", "Tests", "Rapport"];
const PROJECT_FIELDS = ["code", "name", "description", "startDate", "weeks", "color", "repoUrl"];
const TASK_FIELDS = ["title", "description", "size", "label", "weekStart", "weekEnd", "milestone", "dependsOn", "order"];
const COLORS = ["#2f7d5b", "#b4602c", "#5b5fb0", "#2a7a9a", "#9a3b5a", "#6b7a2a", "#8a5a2b", "#3f6f8f"];

const rid = p => p + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const slug = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const norm = s => String(s ?? "").trim().toLowerCase();

// opts.defaultOwner : encadrant des nouveaux projets ; opts.allowOwner : le fichier peut choisir l'encadrant ("owner").
export function planMerge(input, current, now = new Date().toISOString(), opts = {}) {
  const defaultOwner = opts.defaultOwner || "";
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("le fichier doit contenir un objet JSON { projects, users, tasks }");
  const warnings = [];
  const summary = { projectsNew: 0, projectsUpd: 0, usersNew: 0, usersUpd: 0, tasksNew: 0, tasksUpd: 0 };
  const ops = [];

  // --- Projets ---
  const projects = current.projects.map(p => ({ ...p }));
  const findProject = ref => {
    if (!ref) return null;
    const r = norm(ref);
    return projects.find(p => norm(p.id) === r) || projects.find(p => norm(p.code) === r) || null;
  };
  (input.projects || []).forEach((src, i) => {
    const where = `projet n°${i + 1}`;
    let p = findProject(src.id) || findProject(src.code);
    const isNew = !p;
    if (isNew) {
      if (!src.name) { warnings.push(`${where} ignoré : il manque "name"`); return; }
      p = {
        id: src.id || rid("p"), code: src.code || "P" + (projects.length + 1), name: src.name,
        description: "", startDate: now.slice(0, 10), weeks: 8,
        color: COLORS[projects.length % COLORS.length], repoUrl: "", milestones: [], createdAt: now,
        owner: (opts.allowOwner && src.owner ? norm(src.owner) : defaultOwner)
      };
      projects.push(p);
    }
    for (const k of PROJECT_FIELDS) if (src[k] !== undefined && src[k] !== null) p[k] = src[k];
    p.weeks = Math.max(1, Math.min(30, Number(p.weeks) || 8));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)) { warnings.push(`${where} (${p.code}) : date de début "${p.startDate}" invalide, format attendu AAAA-MM-JJ`); p.startDate = now.slice(0, 10); }
    if (Array.isArray(src.milestones)) {
      const old = p.milestones || [];
      p.milestones = src.milestones.filter(m => m && m.name).map((m, j) => {
        const same = old.find(o => o.id === m.id) || old.find(o => norm(o.name) === norm(m.name));
        return { id: m.id || same?.id || "m" + (j + 1) + "_" + slug(m.name).slice(0, 12), name: m.name, week: Math.max(1, Number(m.week) || 1) };
      });
    }
    ops.push({ type: "put", col: "projects", obj: p });
    isNew ? summary.projectsNew++ : summary.projectsUpd++;
  });

  // --- Étudiants ---
  (input.users || []).forEach((src, i) => {
    const email = norm(src.email || src.id);
    const where = `étudiant n°${i + 1}`;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { warnings.push(`${where} ignoré : adresse e-mail manquante ou invalide`); return; }
    const p = findProject(src.projectId || src.project);
    if ((src.projectId || src.project) && !p) warnings.push(`${where} (${email}) : projet "${src.projectId || src.project}" introuvable`);
    const existing = current.users.find(u => u.id === email);
    const u = existing
      ? { ...existing }
      : { id: email, email, role: "student", tutorial: { steps: {} }, createdAt: now, name: email, projectId: "" };
    if (src.name) u.name = String(src.name).trim();
    if (p) { u.projectId = p.id; u.owner = p.owner; }
    if (!u.owner) u.owner = defaultOwner;
    ops.push({ type: "put", col: "users", obj: u });
    existing ? summary.usersUpd++ : summary.usersNew++;
  });

  // --- Tâches (deux passes : création des identifiants, puis dépendances) ---
  const tasks = current.tasks.map(t => ({ ...t }));
  const fileIds = new Map(); // id donné dans le fichier -> id réel
  const pending = [];
  (input.tasks || []).forEach((src, i) => {
    const where = `tâche n°${i + 1}${src.title ? ` « ${src.title} »` : ""}`;
    let t = src.id ? tasks.find(x => x.id === src.id) : null;
    const p = findProject(src.projectId || src.project) || (t ? findProject(t.projectId) : null);
    if (!p) { warnings.push(`${where} ignorée : projet "${src.projectId || src.project || "?"}" introuvable`); return; }
    if (!t && src.title) t = tasks.find(x => x.projectId === p.id && norm(x.title) === norm(src.title));
    const isNew = !t;
    if (isNew) {
      if (!src.title) { warnings.push(`${where} ignorée : il manque "title"`); return; }
      t = {
        id: src.id || rid("t"), projectId: p.id, owner: p.owner, kind: "normal", title: "", description: "",
        size: "M", label: "Logiciel", weekStart: 1, weekEnd: 1, milestone: "", dependsOn: [],
        assignee: null, status: "backlog", order: tasks.filter(x => x.projectId === p.id).length, createdAt: now
      };
      tasks.push(t);
    }
    if (src.id) fileIds.set(src.id, t.id);
    pending.push({ src, t, p, where, isNew });
  });
  for (const { src, t, p, where, isNew } of pending) {
    for (const k of TASK_FIELDS) if (src[k] !== undefined && src[k] !== null && k !== "dependsOn" && k !== "milestone") t[k] = src[k];
    if (!SIZES.includes(t.size)) { warnings.push(`${where} : taille "${t.size}" inconnue, M retenue`); t.size = "M"; }
    if (!LABELS.includes(t.label)) { warnings.push(`${where} : étiquette "${t.label}" inconnue, Logiciel retenue`); t.label = "Logiciel"; }
    t.weekStart = Math.max(1, Math.min(p.weeks, Number(t.weekStart) || 1));
    t.weekEnd = Math.max(t.weekStart, Math.min(p.weeks, Number(t.weekEnd) || t.weekStart));
    if (src.milestone !== undefined) {
      const m = (p.milestones || []).find(m => m.id === src.milestone || norm(m.name) === norm(src.milestone));
      if (src.milestone && !m) warnings.push(`${where} : jalon "${src.milestone}" introuvable dans ${p.code}`);
      t.milestone = m ? m.id : "";
    }
    if (Array.isArray(src.dependsOn)) {
      t.dependsOn = src.dependsOn.map(d => {
        const real = fileIds.get(d) || tasks.find(x => x.id === d)?.id || tasks.find(x => x.projectId === p.id && norm(x.title) === norm(d))?.id;
        if (!real) warnings.push(`${where} : dépendance "${d}" introuvable`);
        return real;
      }).filter(id => id && id !== t.id);
    }
    ops.push({ type: "put", col: "tasks", obj: t });
    isNew ? summary.tasksNew++ : summary.tasksUpd++;
  }

  return { ops, summary, warnings };
}

export function describeSummary(s) {
  const part = (n, u, label, f) => n || u ? `${label} : ${n} ajouté${f}${n > 1 ? "s" : ""}, ${u} mis${f ? "e" : ""}${u > 1 && f ? "s" : ""} à jour` : "";
  return [part(s.projectsNew, s.projectsUpd, "Projets", ""), part(s.usersNew, s.usersUpd, "Étudiants", ""), part(s.tasksNew, s.tasksUpd, "Tâches", "e")].filter(Boolean);
}
