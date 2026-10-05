// Contenu du tutoriel GitHub obligatoire (badge « Welcome to Git! »).
export const GUIDE_URL = "guide-git.html";

export const TUTORIAL_STEPS = [
  {
    id: "guide", title: "Comprendre Git et GitHub", guide: "#cest-quoi",
    body: `<p>Lisez les chapitres 1 à 4 du <b>guide Git</b> : ce que sont Git et GitHub, à quoi ils servent, le vocabulaire (commit, branche, push, pull…) et les trois zones de Git. C'est la base de tout le reste ; comptez 20 minutes.</p>`
  },
  {
    id: "compte", guide: "#installer", title: "Créer votre compte GitHub",
    body: `<p>Allez sur <a href="https://github.com/signup" target="_blank" rel="noopener">github.com/signup</a> et créez un compte avec votre adresse e-mail étudiante. Choisissez un nom d'utilisateur sérieux : il apparaîtra sur votre CV.</p>
<p>Envoyez ensuite votre nom d'utilisateur à l'encadrant pour qu'il vous invite dans le dépôt de votre groupe.</p>`
  },
  {
    id: "invitation", guide: "#demarrer", title: "Accepter l'invitation au dépôt du groupe",
    body: `<p>Vous recevez un e-mail « invited you to join ». Cliquez sur <b>Accept invitation</b>. Vous pouvez aussi l'accepter depuis <a href="https://github.com/notifications" target="_blank" rel="noopener">github.com/notifications</a>.</p>
<p>Ouvrez ensuite le dépôt de votre projet : c'est là que vivront votre code, vos schémas et votre rapport.</p>`
  },
  {
    id: "installer", guide: "#installer", title: "Installer et configurer Git",
    body: `<p>Installez Git depuis <a href="https://git-scm.com/downloads" target="_blank" rel="noopener">git-scm.com</a> (sous Windows, gardez les options par défaut ; « Git Bash » sera installé). Puis indiquez qui vous êtes, une seule fois par ordinateur :</p>`,
    code: `git config --global user.name "Prénom Nom"
git config --global user.email "votre.email@exemple.dz"
git --version`,
    tip: "Utilisez la même adresse e-mail que sur votre compte GitHub, sinon vos commits ne seront pas reliés à votre profil."
  },
  {
    id: "cloner", guide: "#demarrer", title: "Cloner le dépôt sur votre ordinateur",
    body: `<p><b>Cloner</b> = télécharger le dépôt et tout son historique. Sur la page du dépôt, cliquez sur le bouton vert <b>Code</b> et copiez l'adresse HTTPS.</p>`,
    code: `git clone https://github.com/{ORG}/{REPO}.git
cd {REPO}
git status`,
    tip: "Au premier envoi, GitHub vous demandera de vous connecter : une fenêtre de navigateur s'ouvre, acceptez."
  },
  {
    id: "commit", guide: "#quotidien", title: "Votre premier commit",
    body: `<p>Ouvrez <code>README.md</code> et ajoutez votre nom dans la section « Équipe ». Puis enregistrez la modification dans l'historique :</p>`,
    code: `git add README.md
git commit -m "Ajoute Prénom Nom à l'équipe"
git push`,
    tip: "add = choisir les fichiers · commit = prendre une photo du projet avec un message · push = envoyer les photos sur GitHub."
  },
  {
    id: "branche", guide: "#branches", title: "Travailler sur une branche et ouvrir une pull request",
    body: `<p>Pour ne jamais casser la version qui marche (<code>main</code>), chaque tâche se fait sur une <b>branche</b>. Ajoutez une ligne dans <code>journal.md</code> sur votre propre branche :</p>`,
    code: `git switch -c prenom/premiere-branche
# modifiez journal.md
git add journal.md
git commit -m "Ajoute ma première entrée au journal"
git push -u origin prenom/premiere-branche`,
    tip: "Sur GitHub, cliquez sur « Compare & pull request ». Votre binôme relit et clique sur « Merge ». Vous faites ensuite la même chose pour lui."
  },
  {
    id: "revenir", guide: "#revenir", title: "Revenir à une version précédente",
    body: `<p>Lisez le chapitre 9 du guide, puis entraînez-vous : créez <code>essai.txt</code> avec « version 1 », faites un commit ; remplacez par « version 2 », commit et push ; annulez ce dernier commit avec <code>git revert</code>.</p>`,
    code: `git log --oneline          # repérer l'identifiant du commit « version 2 »
git revert <identifiant>   # crée un commit qui l'annule
git push`,
    tip: "Ce qui est déjà sur GitHub ne s'efface pas : on l'annule avec git revert. git reset --hard est réservé aux commits encore sur votre ordinateur."
  },
  {
    id: "pull", guide: "#conflits", title: "Récupérer le travail de votre binôme",
    body: `<p>Avant de commencer à travailler, récupérez toujours les dernières modifications :</p>`,
    code: `git switch main
git pull`,
    tip: "Si Git signale un conflit, ouvrez le fichier : gardez la bonne version entre les marques <<<<<<< et >>>>>>>, puis add + commit. Demandez de l'aide si vous hésitez."
  }
];

export const TUTORIAL_QUIZ = [
  {
    id: "q1", q: "Vous avez fait un commit mais votre binôme ne voit rien sur GitHub. Pourquoi ?",
    options: ["Il faut attendre quelques minutes", "Le commit n'a pas encore été envoyé avec git push", "Il faut refaire git clone"],
    answer: 1
  },
  {
    id: "q2", q: "À quoi sert une branche ?",
    options: ["À travailler sur une tâche sans casser la version qui marche", "À sauvegarder le dépôt sur une clé USB", "À supprimer l'historique"],
    answer: 0
  },
  {
    id: "q3", q: "Quelle commande faut-il lancer avant de commencer à travailler ?",
    options: ["git init", "git push --force", "git pull"],
    answer: 2
  },
  {
    id: "q4", q: "Quel est le meilleur message de commit ?",
    options: ["update", "Ajoute la détection de pic sur le piézo 1", "modifs du mardi"],
    answer: 1
  },
  {
    id: "q5", q: "Un commit déjà poussé sur GitHub a cassé le firmware. Que faites-vous ?",
    options: ["git reset --hard puis git push --force", "git revert sur ce commit, puis git push", "Supprimer le dépôt et le recréer"],
    answer: 1
  },
  {
    id: "q6", q: "Quelle est la différence entre Git et GitHub ?",
    options: ["Aucune, ce sont deux noms du même logiciel", "Git enregistre les versions sur votre PC, GitHub héberge le dépôt en ligne pour le partager", "GitHub fonctionne sans Internet, pas Git"],
    answer: 1
  },
  {
    id: "q7", q: "Où mettre le mot de passe Wi-Fi utilisé par l'ESP32 ?",
    options: ["Dans le code principal, c'est plus simple", "Dans le README", "Dans secrets.h, listé dans .gitignore"],
    answer: 2
  },
  {
    id: "q8", q: "Git signale un conflit sur config.h. Que contient le fichier ?",
    options: ["Les deux versions entre des marques <<<<<<< ======= >>>>>>> à trier à la main", "Le fichier a été supprimé", "Uniquement la version du binôme"],
    answer: 0
  }
];

export function isCommitUrl(url) {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/(commit|pull)\/[0-9a-f]{6,}|^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test((url || "").trim());
}
