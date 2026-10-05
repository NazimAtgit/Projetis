// Contenu du tutoriel GitHub obligatoire (badge « Welcome to Git! »).
export const TUTORIAL_STEPS = [
  {
    id: "compte", title: "Créer votre compte GitHub",
    body: `<p>Allez sur <a href="https://github.com/signup" target="_blank" rel="noopener">github.com/signup</a> et créez un compte avec votre adresse e-mail étudiante. Choisissez un nom d'utilisateur sérieux : il apparaîtra sur votre CV.</p>
<p>Envoyez ensuite votre nom d'utilisateur à l'encadrant pour qu'il vous invite dans le dépôt de votre groupe.</p>`
  },
  {
    id: "invitation", title: "Accepter l'invitation au dépôt du groupe",
    body: `<p>Vous recevez un e-mail « invited you to join ». Cliquez sur <b>Accept invitation</b>. Vous pouvez aussi l'accepter depuis <a href="https://github.com/notifications" target="_blank" rel="noopener">github.com/notifications</a>.</p>
<p>Ouvrez ensuite le dépôt de votre projet : c'est là que vivront votre code, vos schémas et votre rapport.</p>`
  },
  {
    id: "installer", title: "Installer et configurer Git",
    body: `<p>Installez Git depuis <a href="https://git-scm.com/downloads" target="_blank" rel="noopener">git-scm.com</a> (sous Windows, gardez les options par défaut ; « Git Bash » sera installé). Puis indiquez qui vous êtes, une seule fois par ordinateur :</p>`,
    code: `git config --global user.name "Prénom Nom"
git config --global user.email "votre.email@exemple.dz"
git --version`,
    tip: "Utilisez la même adresse e-mail que sur votre compte GitHub, sinon vos commits ne seront pas reliés à votre profil."
  },
  {
    id: "cloner", title: "Cloner le dépôt sur votre ordinateur",
    body: `<p><b>Cloner</b> = télécharger le dépôt et tout son historique. Sur la page du dépôt, cliquez sur le bouton vert <b>Code</b> et copiez l'adresse HTTPS.</p>`,
    code: `git clone https://github.com/{ORG}/{REPO}.git
cd {REPO}
git status`,
    tip: "Au premier envoi, GitHub vous demandera de vous connecter : une fenêtre de navigateur s'ouvre, acceptez."
  },
  {
    id: "commit", title: "Votre premier commit",
    body: `<p>Ouvrez <code>README.md</code> et ajoutez votre nom dans la section « Équipe ». Puis enregistrez la modification dans l'historique :</p>`,
    code: `git add README.md
git commit -m "Ajoute Prénom Nom à l'équipe"
git push`,
    tip: "add = choisir les fichiers · commit = prendre une photo du projet avec un message · push = envoyer les photos sur GitHub."
  },
  {
    id: "branche", title: "Travailler sur une branche et ouvrir une pull request",
    body: `<p>Pour ne jamais casser la version qui marche (<code>main</code>), chaque tâche se fait sur une <b>branche</b>. Ajoutez une ligne dans <code>journal.md</code> sur votre propre branche :</p>`,
    code: `git switch -c prenom/premiere-branche
# modifiez journal.md
git add journal.md
git commit -m "Ajoute ma première entrée au journal"
git push -u origin prenom/premiere-branche`,
    tip: "Sur GitHub, cliquez sur « Compare & pull request ». Votre binôme relit et clique sur « Merge ». Vous faites ensuite la même chose pour lui."
  },
  {
    id: "pull", title: "Récupérer le travail de votre binôme",
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
  }
];

export function isCommitUrl(url) {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/(commit|pull)\/[0-9a-f]{6,}|^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test((url || "").trim());
}
