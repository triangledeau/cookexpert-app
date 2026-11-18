# cookexpert-app : consignes

PWA (HTML/CSS/JS sans build, GitHub Pages) qui pilote le Magimix Cook Expert Connect (Web Serial) et sa balance (Web Bluetooth).

- Ne jamais envoyer AUTO ni PULSE : le cuisinier démarre le robot lui-même. Touches autorisées : voir `TOUCHES` dans `js/robot.js`.
- `lib/` est généré depuis cookexpert-bt par `scripts/maj-bibliotheque.mjs` : ne pas le modifier à la main.
- Toute modification d’un fichier servi : incrémenter `CACHE` dans `sw.js` et `VERSION` dans `js/version.js` (et compléter `FICHIERS` si un fichier est ajouté).
- Jamais de nom ni d'adresse Bluetooth d'un robot réel dans le dépôt : écrire « cook expert XXXXXX ».
- Interface et code en français.
