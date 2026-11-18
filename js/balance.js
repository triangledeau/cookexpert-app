// Balance XL Connect : Bluetooth basse consommation, via Web Bluetooth (pas d'appairage).
// Android n'accepte qu'une opération GATT à la fois : toutes les opérations passent par une file.
import {
  CARACTERISTIQUE_COMMANDES,
  CARACTERISTIQUE_MESURES,
  commandeTare,
  commandeUnite,
  commandeVersion,
  enGrammes,
  lirePesee,
  SERVICE_BALANCE,
} from '../lib/balance.js';
import { enHexa } from '../lib/protocole.js';

const DELAI_GATT_MS = 12000;
const MAX_TRAMES_INCONNUES = 10;

function avecDelai(promesse, quoi) {
  let minuteur;
  const delai = new Promise((_, rejeter) => {
    minuteur = setTimeout(() => rejeter(new Error(`balance : pas de réponse (${quoi})`)), DELAI_GATT_MS);
  });
  return Promise.race([promesse, delai]).finally(() => clearTimeout(minuteur));
}

export class Balance extends EventTarget {
  #commandes = null;
  #appareil = null;
  #type = 5;
  #file = Promise.resolve();
  #connexionEnCours = null;
  #tramesInconnues = 0;
  #premierePesee = true;
  #surveillance = null;
  grammes = null;
  stable = false;

  static disponible() {
    return 'bluetooth' in navigator;
  }

  get connectee() {
    return this.#commandes !== null;
  }

  #emettre(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  #journal(texte) {
    this.#emettre('journal', texte);
  }

  // Une seule opération GATT à la fois.
  #enFile(action, quoi) {
    const suite = this.#file.then(() => avecDelai(action(), quoi));
    this.#file = suite.catch(() => {});
    return suite;
  }

  connecter() {
    // Deux appuis rapprochés ne lancent qu'une connexion.
    this.#connexionEnCours ??= this.#connecter().finally(() => (this.#connexionEnCours = null));
    return this.#connexionEnCours;
  }

  async #connecter() {
    if (!Balance.disponible()) throw new Error('Web Bluetooth absent : ouvre l’appli dans Chrome.');
    const appareil = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_BALANCE] }] });
    this.#appareil = appareil;
    appareil.addEventListener('gattserverdisconnected', () => {
      clearTimeout(this.#surveillance);
      this.#commandes = null;
      this.grammes = null;
      this.#journal('balance déconnectée');
      this.#emettre('connexion', false);
    });

    this.#journal('balance : connexion…');
    const serveur = await this.#enFile(() => appareil.gatt.connect(), 'connexion');
    const service = await this.#enFile(() => serveur.getPrimaryService(SERVICE_BALANCE), 'service');
    const commandes = await this.#enFile(() => service.getCharacteristic(CARACTERISTIQUE_COMMANDES), 'commandes');
    const mesures = await this.#enFile(() => service.getCharacteristic(CARACTERISTIQUE_MESURES), 'mesures');
    mesures.addEventListener('characteristicvaluechanged', (e) => this.#recevoir(e.target.value));
    await this.#enFile(() => mesures.startNotifications(), 'notifications');
    this.#journal('balance : notifications activées');

    this.#tramesInconnues = 0;
    this.#premierePesee = true;
    this.#commandes = commandes;
    await this.#ecrire(commandeVersion(this.#type));
    this.#journal('balance connectée');
    this.#emettre('connexion', true);

    // Diagnostic : rien reçu au bout de 5 s ?
    clearTimeout(this.#surveillance);
    this.#surveillance = setTimeout(() => {
      if (this.connectee && this.grammes === null) {
        this.#journal('✗ balance : aucune mesure reçue (balance allumée ? pose un objet dessus)');
      }
    }, 5000);
  }

  #recevoir(vue) {
    const octets = new Uint8Array(vue.buffer, vue.byteOffset, vue.byteLength);
    const pesee = lirePesee(octets);
    if (!pesee) {
      // Trames non reconnues : on en garde quelques-unes dans le journal pour comprendre.
      if (this.#tramesInconnues++ < MAX_TRAMES_INCONNUES) this.#journal(`balance ← ${enHexa(octets)}`);
      return;
    }
    if (this.#premierePesee) {
      this.#premierePesee = false;
      this.#journal(`balance ← ${enHexa(octets)} (1re pesée)`);
    }
    this.#type = pesee.type;
    const g = enGrammes(pesee);
    if (g === null) return;
    this.grammes = g;
    this.stable = pesee.stable;
    this.#emettre('pesee', { grammes: g, stable: pesee.stable });
  }

  deconnecter() {
    this.#appareil?.gatt?.disconnect();
  }

  #ecrire(octets) {
    if (!this.#commandes) return Promise.reject(new Error('balance non connectée'));
    const commandes = this.#commandes;
    return this.#enFile(() => {
      this.#journal(`balance → ${enHexa(octets)}`);
      return commandes.writeValueWithoutResponse(octets);
    }, 'commande');
  }

  tare() {
    return this.#ecrire(commandeTare(this.#type));
  }

  unite(code) {
    return this.#ecrire(commandeUnite(this.#type, code));
  }
}
