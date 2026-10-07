// Couche de données : mode démo (localStorage) ou Firebase (Firestore + Auth Google).
import { CONFIG } from "./config.js";
import { seedData } from "./seed.js";

const COLLECTIONS = ["projects", "users", "tasks", "events"];
const LS_KEY = "atelier-esst-demo-v1";
const LS_SESSION = "atelier-esst-session-v1";

export const DEFAULT_SETTINGS = {
  pointsS: 10, pointsM: 25, pointsL: 50,
  onTimeBonus: 5,
  tutorialPoints: 10,
  bonusPerPoints: 100, bonusCap: 2,
  leaderboardVisible: true
};

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, v) { try { localStorage.setItem(key, v); } catch { /* stockage indisponible */ } }
function safeDel(key) { try { localStorage.removeItem(key); } catch { /* rien */ } }

export const store = {
  // ?demo dans l'adresse force le mode démo (données d'exemple locales), même en ligne.
  mode: CONFIG.firebase && !/[?&]demo\b/.test(location.search) ? "firebase" : "demo",
  data: { projects: [], users: [], tasks: [], events: [], settings: { ...DEFAULT_SETTINGS } },
  session: null, // { email, name, role }
  ready: false,
  _listeners: new Set(),
  _fb: null,

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  emit() { for (const fn of this._listeners) fn(this.data); },

  async init() {
    if (this.mode === "demo") {
      const raw = safeGet(LS_KEY);
      let parsed = null;
      if (raw) { try { parsed = JSON.parse(raw); } catch { parsed = null; } }
      this.data = parsed || seedData();
      this.data.settings = { ...DEFAULT_SETTINGS, ...(this.data.settings || {}) };
      const s = safeGet(LS_SESSION);
      if (s) { try { this.session = JSON.parse(s); } catch { this.session = null; } }
      if (!this.session) this.session = this.adminSession();
      this.ready = true;
      this.emit();
      return;
    }
    await this._initFirebase();
  },

  adminSession() {
    return { email: CONFIG.adminEmails[0] || "encadrant@exemple.dz", name: "Encadrant", role: "admin" };
  },

  isAdmin() { return this.session?.role === "admin"; },

  // --- Session ---
  async demoLogin(email) {
    if (CONFIG.adminEmails.includes(email)) this.session = this.adminSession();
    else {
      const u = this.data.users.find(x => x.id === email);
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
    this.data = seedData();
    this.data.settings = { ...DEFAULT_SETTINGS };
    this.session = this.adminSession();
    safeSet(LS_SESSION, JSON.stringify(this.session));
    this._save();
    this.emit();
  },

  _save() { if (this.mode === "demo") safeSet(LS_KEY, JSON.stringify(this.data)); },

  // --- Écritures ---
  // ops: [{ type: "put"|"del", col, obj|id }]
  async commit(ops) {
    if (this.mode === "demo") {
      for (const op of ops) {
        if (op.col === "settings") { this.data.settings = { ...this.data.settings, ...op.obj }; continue; }
        const list = this.data[op.col];
        const i = list.findIndex(x => x.id === (op.obj?.id ?? op.id));
        if (op.type === "put") { if (i >= 0) list[i] = op.obj; else list.push(op.obj); }
        else if (i >= 0) list.splice(i, 1);
      }
      this._save();
      this.emit();
      return;
    }
    const { fs, mod } = this._fb;
    const b = mod.fs.writeBatch(fs);
    for (const op of ops) {
      if (op.col === "settings") { b.set(mod.fs.doc(fs, "settings", "main"), op.obj, { merge: true }); continue; }
      const ref = mod.fs.doc(fs, op.col, op.obj?.id ?? op.id);
      if (op.type === "put") b.set(ref, clean(op.obj)); else b.delete(ref);
    }
    await b.commit();
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
      this.data = { projects: [], users: [], tasks: [], events: [], settings: { ...DEFAULT_SETTINGS } };
      if (!user) { this.session = null; this.ready = true; this.emit(); return; }
      const email = (user.email || "").toLowerCase();
      const admin = CONFIG.adminEmails.map(e => e.toLowerCase()).includes(email);
      this.session = { email, name: user.displayName || email, role: admin ? "admin" : "student", pending: !admin };
      this.ready = true;
      const watch = (col, q) => fsm.onSnapshot(q, snap => {
        this.data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (col === "users" && !admin) {
          const me = this.data.users.find(u => u.id === email);
          this.session.pending = !me;
          if (me) this.session.name = me.name;
        }
        this.emit();
      }, err => { console.error(col, err); if (col === "users") { this.session.pending = true; this.emit(); } });
      for (const col of COLLECTIONS) {
        const q = col === "events"
          ? fsm.query(fsm.collection(fs, col), fsm.orderBy("at", "desc"), fsm.limit(200))
          : fsm.collection(fs, col);
        unsubs.push(watch(col, q));
      }
      unsubs.push(fsm.onSnapshot(fsm.doc(fs, "settings", "main"), d => {
        this.data.settings = { ...DEFAULT_SETTINGS, ...(d.data() || {}) };
        this.emit();
      }, () => {}));
      this.emit();
    });
  },

  // Import d'une sauvegarde JSON complète (encadrant).
  async importAll(data) {
    const ops = [];
    for (const col of COLLECTIONS) {
      for (const x of this.data[col]) ops.push({ type: "del", col, id: x.id });
      for (const x of data[col] || []) ops.push({ type: "put", col, obj: x });
    }
    if (data.settings) ops.push({ type: "put", col: "settings", obj: data.settings });
    // Firestore limite un lot à 500 écritures.
    for (let i = 0; i < ops.length; i += 450) await this.commit(ops.slice(i, i + 450));
  },
  seedExample() { return this.importAll(seedData()); },
  clearSessionCache() { safeDel(LS_SESSION); }
};

function clean(o) {
  // Firestore refuse les valeurs undefined.
  return JSON.parse(JSON.stringify(o));
}
