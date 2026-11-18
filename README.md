# Cook Expert — appli de pilotage

Appli web installable (PWA) pour piloter un **Magimix Cook Expert Connect** et sa **balance XL Connect** en Bluetooth, depuis Chrome sur Android, sans l'appli Magimix.

**Ouvrir l'appli :** https://triangledeau.github.io/cookexpert-app/

## Fonctions

- **Piloter** : état du robot en direct (temps restant, température, vitesse, défauts), envoi d'un programme Expert (durée, température, vitesse), touches ◀ OK ▶ ↩ et STOP.
- **Favoris** : réglages enregistrés, à charger ou envoyer en un geste.
- **Recettes guidées** : étapes de pesée (avec la balance, tare automatique et jauge), de programme (envoi automatique au robot, suivi jusqu'à la fin) et d'instruction. Import d'étapes en notation Thermomix (« Cuire 25 min/100°C/vitesse 1. »).
- **Balance** : poids en direct, tare, unité.
- Sauvegarde des recettes et favoris (export/import JSON), notification de fin de programme, écran maintenu allumé pendant une recette.

## Sécurité

L'appli **ne démarre jamais le moteur ni la chauffe** : elle règle le programme, puis c'est le cuisinier qui appuie sur **AUTO** devant le robot. Elle n'envoie ni AUTO ni PULSE. STOP reste disponible. Au-dessus de 60 °C, la vitesse est limitée à 15, comme le demande la notice.

## Utilisation

1. Dans les réglages Bluetooth d'Android, appairer le robot (« cook expert XXXXXX », code `0000`). La balance n'a pas besoin d'appairage.
2. Fermer l'appli Magimix : le robot n'accepte qu'une connexion à la fois.
3. Ouvrir l'adresse ci-dessus dans **Chrome**, puis menu ⋮ › « Ajouter à l'écran d'accueil ».
4. Toucher « Robot : connecter » puis « Balance : connecter ».

## Technique

- Robot : Bluetooth classique (SPP) via **Web Serial**. Balance : BLE via **Web Bluetooth**. Les deux exigent HTTPS et Chrome.
- Aucun build : HTML, CSS et modules JavaScript servis tels quels par GitHub Pages.
- `lib/` est généré à partir de [cookexpert-bt](https://github.com/Julien-Deudon/cookexpert-bt) (licence MIT, © Julien Deudon), qui décrit le protocole. Pour le mettre à jour : `node scripts/maj-bibliotheque.mjs <clone de cookexpert-bt> <esbuild>`.
- Après une modification, changer `CACHE` dans `sw.js` pour que les téléphones récupèrent la nouvelle version.

Projet indépendant, sans lien avec Magimix.
