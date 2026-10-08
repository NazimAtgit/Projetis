// Configuration de l'application.
// 1. Laissez firebase à null pour utiliser le mode démo (données dans le navigateur).
// 2. Pour la mise en ligne, collez ici l'objet firebaseConfig de votre projet Firebase
//    et mettez votre adresse e-mail dans adminEmails (voir README.md).
export const CONFIG = {
  appName: "Atelier Projets",
  schoolName: "ESST Alger",
  schoolFullName: "École Supérieure des Sciences et Technologies",
  // Logo de l'école : déposez le fichier dans le dépôt (ex. img/logo-esst.png) et indiquez son chemin ici.
  logoUrl: "",
  firebase: {
    apiKey: "AIzaSyCVqbP6FZdB39HxDigZ9igP7JwH4UQ7-Eg",
    authDomain: "projetis-f23ec.firebaseapp.com",
    projectId: "projetis-f23ec",
    storageBucket: "projetis-f23ec.firebasestorage.app",
    messagingSenderId: "706004932771",
    appId: "1:706004932771:web:b9849177f230343fb70716"
  },
  adminEmails: ["nazim.ouadahi@esst-sup.com"],
  githubOrg: "ESST-Projets-L-2026"
};
