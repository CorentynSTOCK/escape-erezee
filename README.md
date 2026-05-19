# Escape Erezée

Application web pour créer et jouer un escape game extérieur dans la région d’Erezée.

## Ce qui est inclus

- Espace joueur accessible depuis `index.html#player`.
- Espace gestion PC accessible depuis `index.html#admin`.
- Connexion joueur par code unique d’activation.
- Backend local sans dépendance externe avec sauvegarde dans `data/escape-data.json`.
- Parcours, descriptions, énigmes, équipes, codes, images, indices et progression synchronisés côté serveur quand l’app est lancée via le backend.
- Mode fichier conservé : si l’app est ouverte directement, elle continue à fonctionner avec le stockage du navigateur.
- Création et édition du titre, de la zone, de la durée et de la description des parcours.
- Ajout d’une image facultative dans chaque énigme, affichée côté joueur après déblocage, avec visionneuse plein écran et zoom.
- Timer de partie, progression, indices conditionnels, réponses écrites et validation photo.
- Carte de terrain avec tuiles OpenStreetMap, position joueur, objectif et rayon de validation.
- Réglage côté gestion du point GPS et du périmètre accepté pour chaque énigme.
- Écran de fin avec victoire ou défaite, temps final, progression et classement par temps.
- Modification du nom d’équipe côté joueur.
- Manifeste PWA et service worker pour une future installation mobile.

## Lancer avec le backend

Depuis le dossier du projet :

```text
node server.mjs
```

Ouvrir ensuite :

```text
http://127.0.0.1:4173/index.html#admin
```

Pour tester sur un téléphone, connectez le téléphone au même Wi-Fi que le PC, puis ouvrez l’adresse affichée par le serveur dans la ligne `Téléphone`. Elle ressemble à :

```text
http://192.168.x.x:4173/index.html#player
```

Si Windows demande une autorisation réseau pour Node.js, accepter l’accès sur le réseau privé.

## Tester sans être sur le même réseau

Pour un test terrain en 4G/5G, le plus rapide est de lancer un tunnel public temporaire :

```text
start-public-tunnel.cmd
```

Le script affiche une adresse `https://...lhr.life`. Ouvrir cette adresse sur le téléphone, avec `#player` à la fin :

```text
https://adresse-du-tunnel.lhr.life/index.html#player
```

Le PC doit rester allumé, le backend doit continuer à tourner, et la fenêtre du tunnel doit rester ouverte pendant le test.

Si le tunnel temporaire n’est pas stable, utiliser le déploiement Render inclus dans `render.yaml`. Render donnera une URL publique HTTPS du type :

```text
https://escape-erezee.onrender.com/index.html#player
```

Le fichier `render.yaml` prévoit un petit disque persistant afin de conserver `escape-data.json` entre les redémarrages.

Au premier lancement, si le backend ne contient encore aucune donnée, l’application initialise automatiquement le fichier serveur avec les données présentes dans le navigateur.

## Essai rapide

Code de démonstration :

```text
742-ERE-931
```

La version directe par fichier fonctionne encore pour tester l’interface. Pour jouer à plusieurs équipes, suivre les progressions depuis le PC de gestion et préparer le mobile, il faut lancer l’application via le backend.

## Prochaines étapes

- Ajouter des comptes organisateur et une vraie connexion admin.
- Remplacer le fichier JSON par une base de données de production.
- Déployer le backend sur un hébergement accessible aux téléphones.
- Tester le parcours GPS sur le terrain à Erezée.
- Préparer l’empaquetage iOS/Android via Capacitor ou une application native.
