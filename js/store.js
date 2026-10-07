// Couche de données : mode démo (localStorage) ou Firebase (Firestore + Auth Google).
// Rôles : "admin" (adresse dans CONFIG.adminEmails, voit tout), "supervisor" (encadrant
// inscrit par l'admin, ne voit que ses projets), "student" (voit les projets de son encadrant).
// Chaque projet, étudiant, tâche et événement porte un champ "owner" = e-mail de son encadrant.
import { CONFIG } from "./config.js";
import { seedData } from "./seed.js";

const COLLECTIONS = ["projects", "users", "tasks", "events"];
const LS_KEY = "atelier-esst-demo-v2";
const LS_SESSION = "atelier-esst-session-v2";
const ADMINS = CONFIG.adminEmails.map(e => e.toLowerCase());
const DEMO_COLLEAGUE = "collegue.demo@exemple.dz";

export const DEFAULT_SETTINGS = {
  pointsS: 10, pointsM: 25, pointsL: 50,
  onTimeBonus: 5,
  tutorialPoints: 10,
  bonusPerPoints: 100, bonusCap: 2,
  leaderboardVisible: true
};

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, v) { try { localStorage.setItem(key, v); } catch { /* stockage indisponible */ } }

const emptyData = () => ({ projects: [], users: [], tasks: [], events: [], supervisors: [], settings: { ...DEFAULT_SETTINGS } });

// Ce que la session a le droit de voir (en ligne, Firestore filtre déjà ; ce filtre sert au mode démo).
function scope(raw, session) {
  if (!session || session.role === "admin") return raw;
  let owner = session.email;
  if (session.role === "student") owner = raw.users.find(u => u.id === session.email)?.owner;
  const mine = x => x.owner === owner;
  return {
    projects: raw.projects.filter(mine), users: raw.users.filter(mine), tasks: raw.tasks.filter(mine),
    events: raw.events.filter(mine), supervisors: raw.supervisors.filter(s => s.id === owner), settings: raw.settings
  };
}

export const store = {
  // ?demo dans l'adresse force le mode démo (données d'exemple locales), même en ligne.
  mode: CONFIG.firebase && !/[?&]demo\b/.test(location.search) ? "firebase" : "demo",
  raw: emptyData(),
  data: emptyData(),
  session: null, // { email, name, role, pending? }
  ready: false,
  _listeners: new Set(),
  _fb: null,

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  emit() { this.data = scope(this.raw, this.session); for (const fn of this._listeners) fn(this.data); },

  // isAdmin() = droits d'encadrement (admin ou encadrant) ; isRoot() = administrateur principal.
  isAdmin() { return this.session?.role === "admin" || this.session?.role === "supervisor"; },
  isRoot() { return this.session?.role === "admin"; },
  // Encadrant à qui rattacher un nouvel élément créé par la session courante.
  ownerFor(projectId) {
    const p = projectId && this.raw.projects.find(x => x.id === projectId);
    return p?.owner || this.session?.email || ADMINS[0];
  },
  supervisorName(email) {
    if (ADMINS.includes(email)) return "Administrateur";
    return this.raw.supervisors.find(s => s.id === email)?.name || email;
  },

  async init() {
    if (this.mode === "demo") {
      let parsed = null;
      const raw = safeGet(LS_KEY);
      if (raw) { try { parsed = JSON.parse(raw); } catch { parsed = null; } }
      this.raw = { ...emptyData(), ...(parsed || seedData({ admin: ADMINS[0], colleague: DEMO_COLLEAGUE })) };
      this.raw.settings = { ...DEFAULT_SETTINGS, ...(this.raw.settings || {}) };
      const s = safeGet(LS_SESSION);
      if (s) { try { this.session = JSON.parse(s); } catch { this.session = null; } }
      if (!this.session) this.session = this.adminSession();
      this.ready = true;
      this.emit();
      return;
    }
    await this._initFirebase();
  },

  adminSession() { return { email: ADMINS[0] || "admin@exemple.dz", name: "Administrateur", role: "admin" }; },

  // --- Session (démo) ---
  async demoLogin(email) {
    if (ADMINS.includes(email)) this.session = this.adminSession();
    else if (this.raw.supervisors.some(s => s.id === email)) {
      const s = this.raw.supervisors.find(x => x.id === email);
      this.session = { email, name: s.name, role: "supervisor" };
    } else {
      const u = this.raw.users.find(x => x.id === email);
      if (!u) return;
      this.session = { email: u.id, name: u.name, role: "student" };
    }
    safeSet(LS_SESSION, JSON.stringify(this.session));
    this.emit();
  },

  async login() {
    if (this.mode !== "firebase") return;
    const { auth, mod } = this._fb;
    await mod.auth.signInWithPopup(auth, new mod.auth.GoogleAuthProvider());
  },

  async logout() {
    if (this.mode === "firebase") { await this._fb.mod.auth.signOut(this._fb.auth); return; }
    this.session = this.adminSession();
    safeSet(LS_SESSION, JSON.stringify(this.session));
    this.emit();
  },

  resetDemo() {
    this.raw = { ...emptyData(), ...seedData({ admin: ADMINS[0], colleague: DEMO_COLLEAGUE }) };
    this.session = this.adminSession();
    safeSet(LS_SESSION, JSON.stringify(this.session));
    this._save();
    this.emit();
  },

  _save() { if (this.mode === "demo") safeSet(LS_KEY, JSON.stringify(this.raw)); },

  // --- Écritures ---
  // ops: [{ type: "put"|"del", col, obj|id }]
  async commit(ops) {
    if (this.mode === "demo") {
      for (const op of ops) {
        if (op.col === "settings") { this.raw.settings = { ...this.raw.settings, ...op.obj }; continue; }
        const list = this.raw[op.col];
        const i = list.findIndex(x => x.id === (op.obj?.id ?? op.id));
        if (op.type === "put") { if (i >= 0) list[i] = op.obj; else list.push(op.obj); }
        else if (i >= 0) list.splice(i, 1);
      }
      this._save();
      this.emit();
      return;
    }
    const { fs, mod } = this._fb;
    for (let i = 0; i < ops.length; i += 450) {
      const b = mod.fs.writeBatch(fs);
      for (const op of ops.slice(i, i + 450)) {
        if (op.col === "settings") { b.set(mod.fs.doc(fs, "settings", "main"), op.obj, { merge: true }); continue; }
        const ref = mod.fs.doc(fs, op.col, op.obj?.id ?? op.id);
        if (op.type === "put") b.set(ref, clean(op.obj)); else b.delete(ref);
      }
      await b.commit();
    }
  },
  put(col, obj) { return this.commit([{ type: "put", col, obj }]); },
  del(col, id) { return this.commit([{ type: "del", col, id }]); },

  // --- Firebase ---
  async _initFirebase() {
    const v = "10.12.2";
    const base = `https://www.gstatic.com/firebasejs/${v}`;
    const [app, auth, fsm] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`),
      import(`${base}/firebase-firestore.js`)
    ]);
    const fbApp = app.initializeApp(CONFIG.firebase);
    const a = auth.getAuth(fbApp);
    const fs = fsm.getFirestore(fbApp);
    this._fb = { auth: a, fs, mod: { auth, fs: fsm } };
    let unsubs = [];
    auth.onAuthStateChanged(a, async user => {
      unsubs.forEach(u => u()); unsubs = [];
      this.raw = emptyData();
      if (!user) { this.session = null; this.ready = true; this.emit(); return; }
      const email = (user.email || "").toLowerCase();
      this.session = { email, name: user.displayName || email, role: "student", pending: true };
      // 1. Quel rôle ?
      let owner = null;
      try {
        if (ADMINS.includes(email)) this.session.role = "admin";
        else {
          const sup = await fsm.getDoc(fsm.doc(fs, "supervisors", email));
          if (sup.exists()) { this.session.role = "supervisor"; this.session.name = sup.data().name || this.session.name; }
          else {
            const me = await fsm.getDoc(fsm.doc(fs, "users", email));
            if (me.exists()) { owner = me.data().owner || null; this.session.name = me.data().name || this.session.name; }
          }
        }
      } catch (err) { console.error("rôle", err); }
      const role = this.session.role;
      if (role === "admin" || role === "supervisor") owner = role === "supervisor" ? email : null;
      this.session.pending = role === "student" && !owner;
      this.ready = true;
      if (this.session.pending) { this.emit(); return; }
      // 2. Abonnements, filtrés par encadrant sauf pour l'administrateur.
      const watch = (col, q) => fsm.onSnapshot(q, snap => {
        this.raw[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (col === "events") this.raw.events.sort((x, y) => (y.at || "").localeCompare(x.at || ""));
        this.emit();
      }, err => console.error(col, err));
      for (const col of COLLECTIONS) {
        const ref = fsm.collection(fs, col);
        const q = role === "admin"
          ? (col === "events" ? fsm.query(ref, fsm.orderBy("at", "desc"), fsm.limit(300)) : ref)
          : fsm.query(ref, fsm.where("owner", "==", owner));
        unsubs.push(watch(col, q));
      }
      if (role === "admin") unsubs.push(watch("supervisors", fsm.collection(fs, "supervisors")));
      else if (role === "supervisor") unsubs.push(fsm.onSnapshot(fsm.doc(fs, "supervisors", email), d => {
        this.raw.supervisors = d.exists() ? [{ id: d.id, ...d.data() }] : []; this.emit();
      }, () => {}));
      unsubs.push(fsm.onSnapshot(fsm.doc(fs, "settings", "main"), d => {
        this.raw.settings = { ...DEFAULT_SETTINGS, ...(d.data() || {}) };
        this.emit();
      }, () => {}));
      this.emit();
      if (role === "admin") setTimeout(() => this.migrateOwners(), 2500);
    });
  },

  // Données créées avant l'arrivée des encadrants : on les rattache à l'administrateur.
  async migrateOwners() {
    if (!this.isRoot()) return;
    const admin = this.session.email;
    const projOwner = id => this.raw.projects.find(p => p.id === id)?.owner || admin;
    const ops = [];
    for (const p of this.raw.projects) if (!p.owner) ops.push({ type: "put", col: "projects", obj: { ...p, owner: admin } });
    for (const col of ["users", "tasks", "events"])
      for (const x of this.raw[col]) if (!x.owner) ops.push({ type: "put", col, obj: { ...x, owner: projOwner(x.projectId) } });
    if (ops.length) { console.info(`Migration : ${ops.length} éléments rattachés à un encadrant`); await this.commit(ops); }
  },

  // Restauration d'une sauvegarde complète (administrateur uniquement).
  async importAll(data) {
    const ops = [];
    for (const col of [...COLLECTIONS, "supervisors"]) {
      for (const x of this.raw[col]) ops.push({ type: "del", col, id: x.id });
      for (const x of data[col] || []) ops.push({ type: "put", col, obj: x });
    }
    if (data.settings) ops.push({ type: "put", col: "settings", obj: data.settings });
    await this.commit(ops);
  },
  seedExample() { return this.importAll(seedData({ admin: this.session.email })); }
};

function clean(o) {
  // Firestore refuse les valeurs undefined.
  return JSON.parse(JSON.stringify(o));
}
