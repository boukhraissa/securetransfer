/**
 * crypto/simulation.js
 * ─────────────────────────────────────────────────────────────────
 * Simulations des opérations cryptographiques côté navigateur.
 * En production réelle : ces fonctions appelleraient un backend Node.js
 * utilisant les librairies : cryptography, libsodium, ssl, asyncio.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Utilitaires ──────────────────────────────────────────────────

export function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1_048_576).toFixed(1)} Mo`;
}

// ── AES-256-GCM ──────────────────────────────────────────────────
/**
 * Simule le chiffrement AES-256-GCM par chunks de taille configurable.
 * Librairie réelle : Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM`
 *
 * @param {File} file          - Fichier source
 * @param {number} chunkKo     - Taille d'un chunk en Ko
 * @param {Function} onChunk   - Callback(chunkIndex, totalChunks, encryptedHex)
 * @returns {Promise<{key, ivs, tags, totalChunks}>}
 */
export async function aesEncryptChunks(file, chunkKo, onChunk) {
  const chunkSize = chunkKo * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const key = randomHex(32);          // 256 bits
  const ivs = [];
  const tags = [];

  for (let i = 0; i < totalChunks; i++) {
    const iv = randomHex(12);         // 96 bits — recommandé GCM
    const tag = randomHex(16);        // 128 bits auth tag
    ivs.push(iv);
    tags.push(tag);

    const encryptedChunk = randomHex(Math.min(chunkSize, file.size - i * chunkSize));
    await onChunk(i + 1, totalChunks, encryptedChunk.slice(0, 64) + '...');
    await sleep(120);
  }
  return { key, ivs, tags, totalChunks };
}

// ── SHA-256 ───────────────────────────────────────────────────────
/**
 * Calcule un hash SHA-256 simulé du fichier, vérifiable chunk par chunk.
 * Librairie réelle : Python `hashlib.sha256` ou `cryptography`
 *
 * @param {File} file
 * @returns {Promise<string>} hex digest
 */
export async function sha256Hash(file) {
  await sleep(180);
  // En vrai : const buffer = await file.arrayBuffer(); crypto.subtle.digest('SHA-256', buffer)
  return randomHex(32);
}

// ── ECDSA P-256 ───────────────────────────────────────────────────
/**
 * Simule la génération d'une signature ECDSA P-256 sur le hash du fichier.
 * Librairie réelle : Python `cryptography.hazmat.primitives.asymmetric.ec`
 *  - ec.generate_private_key(ec.SECP256R1())
 *  - private_key.sign(data, ec.ECDSA(hashes.SHA256()))
 *
 * @param {string} fileHash - SHA-256 du fichier
 * @returns {Promise<{privateKey, publicKey, signature, r, s}>}
 */
export async function ecdsaSign(fileHash) {
  await sleep(250);
  return {
    privateKey: randomHex(32),
    publicKey: '04' + randomHex(64),   // format non-compressé: 04 || x || y
    signature: randomHex(72),           // DER encoding ~70-72 bytes
    r: randomHex(32),
    s: randomHex(32),
  };
}

/**
 * Simule la vérification de la signature ECDSA.
 * @returns {Promise<boolean>}
 */
export async function ecdsaVerify(signature, fileHash, publicKey) {
  await sleep(150);
  return true; // En production : ec.verify(signature, data, ec.ECDSA(hashes.SHA256()))
}

// ── RSA-PSS ───────────────────────────────────────────────────────
/**
 * Simule un chiffrement RSA-OAEP 4096 bits (pour échange de clé AES).
 * Librairie réelle : Python `cryptography.hazmat.primitives.asymmetric.rsa`
 *  - rsa.generate_private_key(65537, 4096)
 *  - public_key.encrypt(data, padding.OAEP(...))
 *
 * @param {string} aesKey - Clé AES à encapsuler
 * @returns {Promise<{encryptedKey, publicKey, privateKey}>}
 */
export async function rsaEncryptKey(aesKey) {
  await sleep(400);
  return {
    encryptedKey: randomHex(512),     // 4096 bits → 512 bytes
    publicKey: '-----BEGIN PUBLIC KEY-----\n' + randomHex(294) + '\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\n' + randomHex(3272) + '\n-----END PRIVATE KEY-----',
  };
}

// ── HKDF ─────────────────────────────────────────────────────────
/**
 * Simule la dérivation de clé HKDF (HMAC-based Key Derivation Function).
 * Librairie réelle : Python `cryptography.hazmat.primitives.kdf.hkdf.HKDF`
 *
 * @param {string} secret  - Secret maître
 * @param {string} salt    - Sel aléatoire
 * @param {string} info    - Contexte applicatif
 * @returns {Promise<{derivedKey, salt}>}
 */
export async function hkdfDerive(secret, salt, info = 'SecureTransfer-v1') {
  await sleep(100);
  return {
    derivedKey: randomHex(32),
    salt: salt || randomHex(32),
  };
}

// ── HMAC-SHA256 ───────────────────────────────────────────────────
/**
 * Simule un code d'authentification HMAC-SHA256.
 * Librairie réelle : Python `hmac.new(key, msg, hashlib.sha256)`
 */
export async function hmacSign(key, message) {
  await sleep(80);
  return randomHex(32);
}

// ── Pipeline complet de transfert ─────────────────────────────────
/**
 * Orchestre toutes les étapes cryptographiques dans l'ordre du projet.
 * @param {File} file
 * @param {number} chunkKo
 * @param {Function} onStep  - Callback(stepName, detail, status)
 * @param {Function} onChunk - Callback(current, total, speed)
 */
export async function fullSecureTransfer(file, chunkKo, onStep, onChunk) {
  // 1. Hash SHA-256 initial
  onStep('hash', 'Calcul du hash SHA-256 du fichier...', 'running');
  const fileHash = await sha256Hash(file);
  onStep('hash', `SHA-256 : ${fileHash}`, 'done');

  // 2. Signature ECDSA
  onStep('ecdsa', 'Génération signature ECDSA P-256...', 'running');
  const { signature, publicKey, r, s } = await ecdsaSign(fileHash);
  onStep('ecdsa', `Signature : r=${r.slice(0,16)}... s=${s.slice(0,16)}...`, 'done');

  // 3. Génération clé AES + dérivation HKDF
  onStep('hkdf', 'Dérivation clé AES via HKDF...', 'running');
  const masterSecret = randomHex(32);
  const { derivedKey } = await hkdfDerive(masterSecret, null);
  onStep('hkdf', `Clé dérivée : ${derivedKey.slice(0,32)}...`, 'done');

  // 4. Chiffrement RSA de la clé AES
  onStep('rsa', 'Chiffrement RSA-OAEP de la clé symétrique...', 'running');
  const { encryptedKey } = await rsaEncryptKey(derivedKey);
  onStep('rsa', `Clé encapsulée : ${encryptedKey.slice(0,32)}...`, 'done');

  // 5. Chiffrement AES-256-GCM par chunks
  onStep('aes', `Chiffrement AES-256-GCM (chunks ${chunkKo} Ko)...`, 'running');
  const startTime = Date.now();
  const { key, ivs, totalChunks } = await aesEncryptChunks(file, chunkKo, async (cur, tot, hex) => {
    const elapsed = (Date.now() - startTime) / 1000 || 0.001;
    const speed = ((file.size * (cur / tot)) / elapsed / 1_048_576).toFixed(1);
    onChunk(cur, tot, speed);
    onStep('aes', `Chunk ${cur}/${tot} chiffré — IV: ${ivs[cur-1]?.slice(0,16) || ''}...`, 'running');
  });
  onStep('aes', `${totalChunks} chunks chiffrés — Clé: ${key.slice(0,32)}...`, 'done');

  // 6. HMAC sur l'ensemble chiffré
  onStep('hmac', 'Calcul HMAC-SHA256 du ciphertext...', 'running');
  const mac = await hmacSign(key, 'ciphertext_payload');
  onStep('hmac', `HMAC : ${mac}`, 'done');

  // 7. Handshake mTLS
  onStep('mtls', 'Handshake mTLS 1.3 avec le serveur...', 'running');
  await sleep(600);
  onStep('mtls', 'Canal mTLS 1.3 établi — certificats mutuels validés', 'done');

  // 8. Vérification intégrité côté récepteur
  onStep('verify', 'Vérification SHA-256 et signature ECDSA côté récepteur...', 'running');
  await sleep(350);
  onStep('verify', 'Intégrité confirmée — transfert signé et horodaté', 'done');

  return { fileHash, signature, key, mac, totalChunks, ivs };
}
