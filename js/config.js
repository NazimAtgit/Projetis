// Configuration de l'application.
// 1. Laissez firebase à null pour utiliser le mode démo (données dans le navigateur).
// 2. Pour la mise en ligne, collez ici l'objet firebaseConfig de votre projet Firebase
//    et mettez votre adresse e-mail dans adminEmails (voir README.md).
export const CONFIG = {
  appName: "Atelier Projets ESST",
  firebase: null,
  // firebase: {
  //   apiKey: "…",
  //   authDomain: "votre-projet.firebaseapp.com",
  //   projectId: "votre-projet",
  //   storageBucket: "votre-projet.appspot.com",
  //   messagingSenderId: "…",
  //   appId: "…"
  // },
  adminEmails: ["ouadahi.na@gmail.com"],
  githubOrg: "ESST-Projets-L-2026"
};
