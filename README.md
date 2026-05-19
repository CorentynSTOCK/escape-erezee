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

Si le tunnel temporaire n’est pas stable, utiliser le déploiement Render inclus dans `render.yaml`. La configuration utilise le plan gratuit pour les tests terrain. Render donnera une URL publique HTTPS du type :

```text
https://escape-erezee.onrender.com/index.html#player
```

Sur le plan gratuit, les données serveur peuvent être réinitialisées après un redémarrage ou un redéploiement. Pour une utilisation réelle avec conservation durable des parcours, il faudra passer sur un hébergement avec stockage persistant ou base de données.

Au premier lancement, si le backend ne contient encore aucune donnée, l’application initialise automatiquement le fichier serveur avec les données présentes dans le navigateur.

## Nom de domaine

Le domaine final prévu est :

```text
https://escape-erezee.be
```

Dans Render, ajouter `escape-erezee.be` dans les domaines personnalisés du service `escape-erezee`.
Render ajoute aussi la variante `www.escape-erezee.be` et affiche les lignes DNS à copier chez le fournisseur du nom de domaine.

Points importants :

- supprimer les anciens enregistrements `AAAA` s'il y en a ;
- copier exactement les enregistrements DNS proposés par Render ;
- revenir ensuite dans Render et cliquer sur `Verify` ;
- attendre quelques minutes si la vérification DNS n'est pas immédiate ;
- une fois validé, Render gère automatiquement le HTTPS.

## Connexion Odoo

L'application expose une adresse réservée à Odoo :

```text
POST https://escape-erezee.be/api/odoo/activation-code
```

Cette adresse crée un code d'activation quand Odoo indique qu'une commande est payée. Elle renvoie ensuite le code pour qu'Odoo puisse le placer dans un champ personnalisé et l'envoyer par e-mail au client.

Protection à configurer dans Render :

```text
ODOO_WEBHOOK_SECRET=une-cle-secrete-longue
```

Odoo doit envoyer la même clé dans l'en-tête :

```text
x-escape-webhook-secret: une-cle-secrete-longue
```

Exemple de données envoyées par Odoo :

```json
{
  "orderId": "SO042",
  "routeId": "route-tramway",
  "customerEmail": "client@example.com",
  "customerName": "Client Test"
}
```

Réponse de l'application :

```json
{
  "ok": true,
  "code": "123-ERE-456",
  "activationCode": "123-ERE-456",
  "routeId": "route-tramway",
  "routeTitle": "Le Secret du Tramway"
}
```

Si Odoo renvoie deux fois la même commande, l'application renvoie le même code au lieu d'en créer un nouveau.
Tant qu'il n'y a qu'un seul parcours, Odoo peut ne pas envoyer `routeId`. Quand il y aura plusieurs produits/parcours, le plus simple sera de mettre la référence interne du produit Odoo égale à l'identifiant du parcours, par exemple `route-tramway`.

## Essai rapide

Code de démonstration :

```text
742-ERE-931
```

La version directe par fichier fonctionne encore pour tester l’interface. Pour jouer à plusieurs équipes, suivre les progressions depuis le PC de gestion et préparer le mobile, il faut lancer l’application via le backend.

## Prochaines étapes

- Brancher `escape-erezee.be` dans Render et chez le fournisseur DNS.
- Ajouter la clé `ODOO_WEBHOOK_SECRET` dans Render.
- Créer les produits Odoo et l'action automatisée qui déclenche la création du code après paiement.
- Remplacer le fichier JSON par une base de données de production ou un stockage persistant.
- Tester le parcours GPS sur le terrain à Erezée.
- Préparer l’empaquetage iOS/Android via Capacitor ou une application native.
