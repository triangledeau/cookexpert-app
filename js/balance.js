// Balance XL Connect : Bluetooth basse consommation, via Web Bluetooth (pas d'appairage).
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

export class Balance extends EventTarget {
  #commandes = null;
  #appareil = null;
  #type = 5;
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

  async connecter() {
    if (!Balance.disponible()) throw new Error('Web Bluetooth absent : ouvre l’appli dans Chrome.');
    const appareil = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_BALANCE] }] });
    this.#appareil = appareil;
    appareil.addEventListener('gattserverdisconnected', () => {
      this.#commandes = null;
      this.grammes = null;
      this.#emettre('journal', 'balance déconnectée');
      this.#emettre('connexion', false);
    });
    const service = await (await appareil.gatt.connect()).getPrimaryService(SERVICE_BALANCE);
    this.#commandes = await service.getCharacteristic(CARACTERISTIQUE_COMMANDES);
    const mesures = await service.getCharacteristic(CARACTERISTIQUE_MESURES);
    mesures.addEventListener('characteristicvaluechanged', () => {
      const vue = mesures.value;
      const octets = new Uint8Array(vue.buffer, vue.byteOffset, vue.byteLength);
      const pesee = lirePesee(octets);
      if (!pesee) return;
      this.#type = pesee.type;
      const g = enGrammes(pesee);
      if (g === null) return;
      this.grammes = g;
      this.stable = pesee.stable;
      this.#emettre('pesee', { grammes: g, stable: pesee.stable });
    });
    await mesures.startNotifications();
    await this.#ecrire(commandeVersion(this.#type));
    this.#emettre('journal', 'balance connectée');
    this.#emettre('connexion', true);
  }

  deconnecter() {
    this.#appareil?.gatt?.disconnect();
  }

  async #ecrire(octets) {
    if (!this.#commandes) throw new Error('balance non connectée');
    this.#emettre('journal', `balance → ${enHexa(octets)}`);
    await this.#commandes.writeValueWithoutResponse(octets);
  }

  tare() {
    return this.#ecrire(commandeTare(this.#type));
  }

  unite(code) {
    return this.#ecrire(commandeUnite(this.#type, code));
  }
}
