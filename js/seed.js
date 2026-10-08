// Données d'exemple : les 5 projets, leurs tâches et 10 étudiants fictifs.
const MS = [
  { id: "m1", name: "Cahier des charges", week: 1 },
  { id: "m2", name: "Démo technique", week: 4 },
  { id: "m3", name: "MVP fonctionnel", week: 6 },
  { id: "m4", name: "Évaluation finale", week: 8 }
];

// [titre, taille, étiquette, semaine début, semaine fin, jalon, dépendances (index)]
const PLANS = {
  P1: {
    name: "Suivi GPS du bus de l'école", color: "#2a78d6",
    description: "Boîtier ESP32 + GPS + GSM embarqué, carte web en temps réel, distance et temps d'arrivée par arrêt.",
    tasks: [
      ["Rédiger le cahier des charges et la liste de matériel", "M", "Rapport", 1, 1, "m1"],
      ["Lire les trames NMEA du GPS sur l'ESP32", "M", "Firmware", 1, 2],
      ["Relever le circuit du bus et les coordonnées des arrêts", "S", "Tests", 2, 2],
      ["Envoyer la position au serveur en Wi-Fi", "M", "Firmware", 3, 3, "", [1]],
      ["Envoyer la position en GSM (SIM800L / SIM7600)", "L", "Firmware", 3, 4, "m2", [3]],
      ["Mettre en place le serveur et la base des positions", "M", "Logiciel", 3, 4],
      ["Page web : carte Leaflet en temps réel", "M", "Logiciel", 4, 5, "", [5]],
      ["Calcul de la distance et du temps d'arrivée par arrêt", "L", "Logiciel", 5, 5, "", [2, 6]],
      ["Boîtier et alimentation 12 V → 5 V", "M", "Mécanique", 5, 6],
      ["Test réel en voiture sur le circuit complet", "M", "Tests", 6, 6, "m3", [4, 7]],
      ["Mode rejeu du trajet enregistré", "M", "Logiciel", 7, 7],
      ["Rédiger le rapport", "L", "Rapport", 7, 8, "m4"],
      ["Préparer la démonstration finale", "S", "Rapport", 8, 8, "m4"]
    ]
  },
  P2: {
    name: "Gants derbouka MIDI", color: "#eb6834",
    description: "Gants à capteurs piézo envoyant des notes MIDI avec vélocité vers Ableton, LMMS ou tout logiciel MIDI.",
    tasks: [
      ["Rédiger le cahier des charges et la liste de matériel", "M", "Rapport", 1, 1, "m1"],
      ["Visualiser le signal d'un piézo et choisir le seuil", "M", "Matériel", 1, 2],
      ["Circuit de protection des entrées (1 MΩ + Zener 3,3 V)", "S", "Matériel", 2, 2],
      ["Détection de pic avec temps mort anti-rebond", "M", "Firmware", 2, 3, "", [1]],
      ["Envoyer une note MIDI vers Ableton / LMMS", "M", "Firmware", 3, 3, "", [3]],
      ["3 zones par gant avec vélocité", "L", "Firmware", 4, 4, "m2", [4]],
      ["Réglage anti-diaphonie entre zones", "M", "Tests", 4, 5, "", [5]],
      ["Intégrer les piézos dans les gants", "L", "Mécanique", 5, 6],
      ["Passage en BLE-MIDI", "M", "Firmware", 5, 6, "", [4]],
      ["Mesurer la latence et les faux déclenchements", "M", "Tests", 6, 6, "m3", [7, 8]],
      ["Rédiger le rapport", "L", "Rapport", 7, 8, "m4"],
      ["Préparer la démonstration finale", "S", "Rapport", 8, 8, "m4"]
    ]
  },
  P3: {
    name: "Jeu vidéo et nouvelle manette", color: "#1baf7a",
    description: "Un jeu court jouable uniquement avec une manette originale construite par le binôme.",
    tasks: [
      ["Fiche concept d'une page validée", "S", "Rapport", 1, 1, "m1"],
      ["Croquis de la manette et choix des capteurs", "S", "Matériel", 1, 1],
      ["Prototype de la manette sur breadboard", "M", "Matériel", 2, 3, "", [1]],
      ["Lire les capteurs sur PC (série ou HID)", "M", "Firmware", 2, 3],
      ["Prototype du jeu jouable au clavier", "L", "Logiciel", 2, 3],
      ["La manette contrôle le jeu (calibration, filtrage)", "L", "Firmware", 4, 4, "m2", [2, 3, 4]],
      ["Boîtier de la manette", "M", "Mécanique", 5, 6],
      ["Niveau complet et sons", "L", "Logiciel", 5, 6, "m3"],
      ["Test avec 5 joueurs extérieurs au groupe", "M", "Tests", 7, 7, "", [5, 7]],
      ["Rédiger le rapport", "L", "Rapport", 7, 8, "m4"],
      ["Préparer la démonstration finale", "S", "Rapport", 8, 8, "m4"]
    ]
  },
  P4: {
    name: "Réservations cabinet dentaire", color: "#eda100",
    description: "Site web : les patients réservent des créneaux, le cabinet gère son agenda.",
    tasks: [
      ["Choix de la stack justifié et cahier des charges", "M", "Rapport", 1, 1, "m1"],
      ["Cas d'utilisation et modèle de données", "M", "Logiciel", 1, 2],
      ["Maquettes des 4 écrans principaux", "S", "Logiciel", 2, 2],
      ["Authentification patient / administrateur", "M", "Logiciel", 3, 3, "", [1]],
      ["CRUD praticiens et types de soin", "M", "Logiciel", 3, 4, "", [1]],
      ["Calcul des créneaux libres", "L", "Logiciel", 4, 4, "m2", [4]],
      ["Réservation sans conflit (contrainte en base)", "L", "Logiciel", 5, 5, "", [5]],
      ["Espace admin : agenda, annulation, déplacement", "L", "Logiciel", 5, 6, "m3", [6]],
      ["Version mobile", "M", "Logiciel", 6, 6],
      ["Déploiement en ligne et jeu de données de test", "M", "Tests", 7, 7],
      ["Rédiger le rapport", "L", "Rapport", 7, 8, "m4"],
      ["Préparer la démonstration finale", "S", "Rapport", 8, 8, "m4"]
    ]
  },
  P5: {
    name: "Machine de temps de réflexe", color: "#e87ba4",
    description: "Cibles lumineuses activées au hasard, temps de réaction mesuré, appli mobile de suivi de progression.",
    tasks: [
      ["Rédiger le cahier des charges et la liste de matériel", "M", "Rapport", 1, 1, "m1"],
      ["Une cible + une LED : mesurer le temps de réaction", "M", "Firmware", 1, 2],
      ["Vérifier la précision du chronomètre", "S", "Tests", 2, 2, "", [1]],
      ["Toutes les cibles, séquence aléatoire", "M", "Firmware", 3, 3, "", [1]],
      ["Liaison BLE et première appli", "L", "Logiciel", 4, 4, "m2", [3]],
      ["Protection des entrées et câblage des LED", "M", "Matériel", 5, 5],
      ["Fabrication du panneau de cibles", "L", "Mécanique", 5, 6],
      ["Appli : historique et courbe de progression", "L", "Logiciel", 5, 6, "m3", [4]],
      ["Tests avec 5 personnes", "M", "Tests", 7, 7],
      ["Rédiger le rapport", "L", "Rapport", 7, 8, "m4"],
      ["Préparer la démonstration finale", "S", "Rapport", 8, 8, "m4"]
    ]
  }
};

const STUDENTS = {
  P1: ["Yacine Benali", "Sarah Mansouri"],
  P2: ["Rania Khelifi", "Mehdi Bouzid"],
  P3: ["Lina Haddad", "Karim Saadi"],
  P4: ["Imane Belkacem", "Walid Cherif"],
  P5: ["Nour Amrani", "Anis Ferhat"]
};

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, ".");
const PTS = { S: 10, M: 25, L: 50 };

export function seedData({ admin = "admin@exemple.dz", colleague = null } = {}) {
  const start = "2026-09-21";
  const startMs = Date.parse(start + "T00:00:00");
  const day = n => new Date(startMs + n * 864e5 + 10 * 36e5).toISOString();
  const projects = [], users = [], tasks = [], events = [];
  let n = 0;
  for (const [code, plan] of Object.entries(PLANS)) {
    const pid = "p_" + code.toLowerCase();
    projects.push({
      id: pid, code, name: plan.name, color: plan.color, description: plan.description,
      startDate: start, weeks: 8, repoUrl: "", milestones: MS.map(m => ({ ...m })), createdAt: day(-3)
    });
    const emails = STUDENTS[code].map(name => slug(name) + "@exemple.dz");
    STUDENTS[code].forEach((name, i) => {
      const tutoOk = !(code === "P4" && i === 1);
      users.push({
        id: emails[i], email: emails[i], name, projectId: pid, role: "student",
        tutorial: tutoOk ? { steps: {}, proof: "https://github.com/ESST-Projets-L-2026/exemple/commit/a1b2c3d", completedAt: day(1 + i) } : { steps: { compte: true, invitation: true } },
        createdAt: day(-3)
      });
    });
    const ids = plan.tasks.map(() => "t_" + code.toLowerCase() + "_" + (n++));
    plan.tasks.forEach(([title, size, label, ws, we, ms, deps], i) => {
      tasks.push({
        id: ids[i], projectId: pid, kind: "normal", title, description: "", size, label,
        weekStart: ws, weekEnd: we, milestone: ms || "", dependsOn: (deps || []).map(d => ids[d]),
        assignee: null, status: "backlog", order: i, createdAt: day(-3)
      });
    });
    // Simulation de l'avancement (semaine 3).
    const pt = tasks.filter(t => t.projectId === pid);
    const lateGroup = code === "P4";
    pt.forEach((t, i) => {
      const who = emails[i % 2];
      if (lateGroup && t.weekEnd >= 2) return;
      if (t.weekEnd === 1) {
        Object.assign(t, { assignee: who, status: "fait", startedAt: day(0), submittedAt: day(4), validatedAt: day(6), pointsAwarded: PTS[t.size] + 5 });
      } else if (t.weekEnd === 2) {
        const validated = i % 2 === 1;
        Object.assign(t, { assignee: who, status: validated ? "fait" : "a_valider", startedAt: day(7), submittedAt: day(11 + (i % 2)), proof: "https://github.com/ESST-Projets-L-2026/exemple/commit/9f8e7d6" });
        if (validated) Object.assign(t, { validatedAt: day(13), pointsAwarded: PTS[t.size] + 5 });
      }
    });
    if (lateGroup) {
      const first = pt[0];
      Object.assign(first, { assignee: emails[0], status: "fait", startedAt: day(0), submittedAt: day(6), validatedAt: day(8), pointsAwarded: PTS[first.size] });
      Object.assign(pt[1], { assignee: emails[0], status: "en_cours", startedAt: day(8) });
    }
    // Chaque étudiant (tutoriel fait) a une tâche en cours.
    emails.forEach(email => {
      const u = users.find(x => x.id === email);
      if (!u.tutorial.completedAt) return;
      if (pt.some(t => t.assignee === email && t.status === "en_cours")) return;
      const next = pt.find(t => t.status === "backlog" && !t.assignee &&
        t.dependsOn.every(d => ["fait", "a_valider"].includes(tasks.find(x => x.id === d)?.status)));
      if (next) Object.assign(next, { assignee: email, status: "en_cours", startedAt: day(14) });
    });
    events.push({ id: "e_" + pid + "_1", at: day(6), actor: "encadrant@exemple.dz", type: "validate", text: `Jalon « Cahier des charges » validé pour ${plan.name}`, projectId: pid });
  }
  // Un problème en cours sur le projet 2.
  const p2 = tasks.filter(t => t.projectId === "p_p2" && t.status === "en_cours");
  const blocked = p2[0];
  if (blocked) {
    const diagId = "t_p2_diag";
    blocked.status = "bloque";
    blocked.problem = { text: "La note se déclenche deux fois à chaque frappe forte, même avec un seuil élevé.", at: day(14), diagnosticId: diagId };
    tasks.push({
      id: diagId, projectId: "p_p2", kind: "diagnostic", parentTaskId: blocked.id,
      title: "Analyser le problème : " + blocked.title,
      description: "1. Décrire précisément ce qui ne marche pas.\n2. Isoler : tester chaque élément séparément.\n3. Noter mesures et captures.\n4. Proposer et tester une piste.\n5. Mettre le compte rendu dans docs/ et coller le lien.",
      size: "S", label: blocked.label, weekStart: 3, weekEnd: 3, milestone: "", dependsOn: [],
      assignee: blocked.assignee, status: "en_cours", startedAt: day(14), order: blocked.order + 0.5, createdAt: day(14)
    });
    events.push({ id: "e_p2_pb", at: day(14), actor: blocked.assignee, type: "problem", alert: true, projectId: "p_p2",
      text: `${users.find(u => u.id === blocked.assignee).name} signale un problème sur « ${blocked.title} »` });
  }
  events.push({ id: "e_tuto", at: day(2), actor: "yacine.benali@exemple.dz", type: "badge", projectId: "p_p1", text: "Yacine Benali a terminé le tutoriel GitHub : badge « Welcome to Git! »" });
  events.sort((a, b) => b.at.localeCompare(a.at));
  // Encadrant de chaque projet : l'administrateur, sauf P5 confié au collègue de démonstration.
  const ownerOf = pid => (colleague && pid === "p_p5" ? colleague : admin);
  projects.forEach(p => { p.owner = ownerOf(p.id); });
  users.forEach(u => { u.owner = ownerOf(u.projectId); });
  tasks.forEach(t => { t.owner = ownerOf(t.projectId); });
  events.forEach(e => { e.owner = ownerOf(e.projectId); });
  const supervisors = colleague ? [{ id: colleague, email: colleague, name: "Collègue (démo)", createdAt: day(-3) }] : [];
  return { projects, users, tasks, events, supervisors, settings: {}, example: true };
}
