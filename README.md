# Atelier Projets ESST

Outil de suivi des projets L2/L3 : projets, tâches, Kanban, diagramme de Gantt, validation par l'encadrant, signalement de problèmes, points, niveaux et badges. Le tutoriel GitHub est la première mission obligatoire de chaque étudiant : il débloque le badge **Welcome to Git!** et la première tâche.

- **Hébergement** : GitHub Pages (gratuit), aucune compilation.
- **Données et connexion** : Firebase (Firestore + connexion Google), offre gratuite « Spark ».
- **Mode démo** : sans configuration Firebase dans `js/config.js`, ou en ajoutant `?demo` à l'adresse (ex. `https://nazimatgit.github.io/Projetis/?demo`), l'outil fonctionne avec des données d'exemple enregistrées dans le navigateur, sans toucher aux vraies données.

## Fonctionnement

| Qui | Ce qu'il peut faire |
| --- | --- |
| Encadrant (adresse dans `adminEmails`) | Tout : projets, jalons, étudiants, tâches, validation, déblocage, réglages, export/import |
| Étudiant (adresse ajoutée par l'encadrant) | Faire le tutoriel, voir son projet, terminer ses tâches avec une preuve, signaler un problème, voir le classement |

Règles automatiques :

1. Tant que le tutoriel GitHub n'est pas terminé (7 étapes, quiz, lien du premier commit), aucune tâche n'est attribuée à l'étudiant.
2. Quand l'étudiant rend une tâche (« J'ai terminé » + lien de preuve), elle passe « À valider » et la tâche libre suivante de son projet lui est attribuée (dépendances respectées, au plus une semaine d'avance sur le calendrier).
3. « J'ai un problème » : la tâche passe « Bloqué », l'encadrant la voit dans « À traiter », et l'étudiant reçoit une tâche de diagnostic (taille S). Quand l'encadrant valide le diagnostic, la tâche bloquée revient « En cours ».
4. Les points ne sont comptés qu'à la validation par l'encadrant : S = 10, M = 25, L = 50, +5 si la tâche est rendue avant la fin de sa semaine d'échéance, +10 pour le tutoriel (modifiable dans Réglages).
5. Bonus de note : 1 point sur 20 par tranche de 100 points, arrondi au demi-point, plafonné à 2 (modifiable).

## Mise en ligne (une seule fois, environ 20 minutes)

### 1. Firebase

1. Sur [console.firebase.google.com](https://console.firebase.google.com), créez un projet (Google Analytics inutile).
2. **Build → Firestore Database → Create database**, région `europe-west`, mode production.
3. **Build → Authentication → Get started → Google → Enable**.
4. **Project settings → Your apps → Web (`</>`)** : donnez un nom, copiez l'objet `firebaseConfig`.
5. **Authentication → Settings → Authorized domains** : ajoutez `VOTRE-COMPTE.github.io`.
6. **Firestore → Rules** : collez le contenu de `firestore.rules`, remplacez `encadrant@exemple.dz` par votre adresse, puis **Publish**.

### 2. Configuration

Dans `js/config.js` :

```js
firebase: { apiKey: "…", authDomain: "…", projectId: "…", storageBucket: "…", messagingSenderId: "…", appId: "…" },
adminEmails: ["votre.adresse@gmail.com"],
githubOrg: "nom-de-votre-organisation-github"
```

La configuration Firebase n'est pas un secret : ce sont les règles Firestore qui protègent les données.

### 3. GitHub Pages

1. Poussez ce dossier dans un dépôt GitHub (public, ou privé avec un compte qui permet Pages).
2. **Settings → Pages → Build and deployment → Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. L'outil est en ligne à `https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT/` après une minute environ.

### 4. Premier lancement

1. Connectez-vous avec votre compte Google (celui de `adminEmails`).
2. **Réglages → Charger les 5 projets d'exemple** si vous voulez partir des projets déjà découpés, puis supprimez les étudiants fictifs ; ou créez vos projets dans **Projets**.
3. **Étudiants → Ajouter** : nom, adresse Gmail de l'étudiant, projet.
4. Donnez l'adresse du site aux étudiants : ils se connectent avec Google et arrivent directement sur le tutoriel.

## Fichiers

```
index.html          page unique
css/app.css         styles (thème clair et sombre)
js/config.js        configuration (Firebase, encadrant, organisation GitHub)
js/store.js         données : mode démo ou Firestore en temps réel
js/logic.js         semaines, points, niveaux, badges, attribution automatique
js/tutorial.js      contenu du tutoriel GitHub et du quiz
js/seed.js          5 projets d'exemple
js/views.js         écrans
js/gantt.js         diagramme de Gantt
js/app.js           navigation et actions
js/merge.js         import « ajouter / mettre à jour »
firestore.rules     règles de sécurité Firestore
```

## Ajouter des projets et des tâches depuis un fichier

**Réglages → Choisir un fichier JSON** ajoute ou met à jour des projets, des étudiants et des tâches sans rien supprimer ni toucher à l'avancement des étudiants. Un résumé (avec les points à vérifier) s'affiche avant de confirmer. Format, toutes les listes étant facultatives :

```json
{
  "projects": [{ "code": "P6", "name": "Station météo LoRa", "startDate": "2026-10-12", "weeks": 8,
                 "milestones": [{ "name": "MVP fonctionnel", "week": 6 }] }],
  "users":    [{ "email": "prenom.nom@gmail.com", "name": "Prénom Nom", "project": "P6" }],
  "tasks":    [{ "id": "p6-lora", "project": "P6", "title": "Liaison LoRa point à point", "size": "L",
                 "label": "Firmware", "weekStart": 2, "weekEnd": 3, "milestone": "MVP fonctionnel",
                 "dependsOn": ["p6-cdc"] }]
}
```

Un projet est reconnu par son code, un étudiant par son e-mail, une tâche par son `id` ou par son titre dans le projet. Tailles : S, M, L. Étiquettes : Matériel, Firmware, Logiciel, Mécanique, Tests, Rapport.

## Sauvegarde

**Réglages → Exporter en JSON** télécharge toutes les données. Faites-le au moins avant la soutenance.
