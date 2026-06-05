/**
 * crypto/scripts.js
 * Catalogue de tous les scripts cryptographiques avec explications pédagogiques.
 */

export const CRYPTO_SCRIPTS = [
  {
    id: 'aes',
    title: 'AES-256-GCM — Chiffrement symétrique',
    icon: '🔒',
    color: '#38bdf8',
    utility: `AES-256-GCM (Advanced Encryption Standard, mode Galois/Counter) est l'algorithme de chiffrement symétrique utilisé pour protéger les données en transit. Il combine :
• Confidentialité : chiffrement par blocs de 128 bits avec une clé de 256 bits
• Authentification : tag GCM de 128 bits qui détecte toute modification
• Performance : accéléré matériellement (AES-NI) → idéal pour le streaming

Dans ce projet, chaque chunk de 64 Ko est chiffré indépendamment avec un IV unique, ce qui permet la reprise après interruption.`,
    library: 'cryptography (Python) — hazmat.primitives.ciphers.aead',
    code: `# ── AES-256-GCM Streaming Encryption ──────────────────────────────
# Librairie : pip install cryptography
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

CHUNK_SIZE = 64 * 1024   # 64 Ko par chunk

def generate_aes_key() -> bytes:
    """Génère une clé AES-256 aléatoire (32 bytes = 256 bits)."""
    return os.urandom(32)

def encrypt_chunk(key: bytes, plaintext: bytes) -> tuple[bytes, bytes, bytes]:
    """
    Chiffre un chunk avec AES-256-GCM.
    
    Args:
        key       : Clé AES-256 (32 bytes)
        plaintext : Données brutes à chiffrer
    
    Returns:
        (iv, ciphertext, tag) — iv 96 bits | tag 128 bits
    """
    aesgcm = AESGCM(key)
    iv = os.urandom(12)              # IV 96 bits — recommandé par NIST pour GCM
    # AESGCM.encrypt() retourne ciphertext + tag concaténés (tag = 16 derniers bytes)
    ct_and_tag = aesgcm.encrypt(iv, plaintext, associated_data=None)
    ciphertext = ct_and_tag[:-16]
    tag        = ct_and_tag[-16:]
    return iv, ciphertext, tag

def decrypt_chunk(key: bytes, iv: bytes, ciphertext: bytes, tag: bytes) -> bytes:
    """
    Déchiffre et vérifie l'authenticité d'un chunk.
    Lève InvalidTag si les données ont été modifiées.
    """
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, ciphertext + tag, associated_data=None)

def encrypt_file_streaming(filepath: str, key: bytes) -> list[dict]:
    """Chiffre un fichier entier par chunks, retourne les métadonnées."""
    chunks_meta = []
    with open(filepath, 'rb') as f:
        index = 0
        while chunk := f.read(CHUNK_SIZE):
            iv, ct, tag = encrypt_chunk(key, chunk)
            chunks_meta.append({
                'index': index,
                'iv': iv.hex(),
                'tag': tag.hex(),
                'size': len(ct)
            })
            index += 1
    return chunks_meta

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    key = generate_aes_key()
    print(f"Clé AES-256 : {key.hex()}")
    
    plaintext = b"Donnees confidentielles a chiffrer"
    iv, ct, tag = encrypt_chunk(key, plaintext)
    print(f"IV       : {iv.hex()}")
    print(f"Chiffré  : {ct.hex()}")
    print(f"Auth tag : {tag.hex()}")
    
    recovered = decrypt_chunk(key, iv, ct, tag)
    print(f"Déchiffré : {recovered.decode()}")
`,
  },
  {
    id: 'ecdsa',
    title: 'ECDSA P-256 — Signature numérique',
    icon: '✍️',
    color: '#34d399',
    utility: `ECDSA (Elliptic Curve Digital Signature Algorithm) sur la courbe P-256 garantit l'authenticité et la non-répudiation du fichier transféré :
• L'émetteur signe le hash SHA-256 du fichier avec sa clé privée
• Le récepteur vérifie la signature avec la clé publique
• Impossible de forger une signature sans la clé privée
• P-256 offre 128 bits de sécurité avec des clés courtes (vs RSA 3072 bits)

Sans cette signature, un attaquant pourrait substituer un fichier malveillant durant le transit.`,
    library: 'cryptography (Python) — hazmat.primitives.asymmetric.ec',
    code: `# ── ECDSA P-256 Digital Signature ──────────────────────────────────
# Librairie : pip install cryptography
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

def generate_ecdsa_keypair():
    """
    Génère une paire de clés ECDSA P-256 (SECP256R1 = NIST P-256).
    Sécurité équivalente : ECDSA-256 ≈ RSA-3072
    """
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key  = private_key.public_key()
    return private_key, public_key

def sign_file_hash(private_key, file_hash: bytes) -> bytes:
    """
    Signe le hash SHA-256 d'un fichier.
    Utilise ECDSA avec hachage interne SHA-256 (double hash en pratique).
    
    Args:
        private_key : Clé privée ECDSA P-256
        file_hash   : SHA-256 du fichier (32 bytes)
    
    Returns:
        Signature DER encodée (70-72 bytes typiquement)
    """
    signature = private_key.sign(
        file_hash,
        ec.ECDSA(hashes.SHA256())
    )
    return signature   # Format DER : 0x30 || len || (r || s)

def verify_signature(public_key, file_hash: bytes, signature: bytes) -> bool:
    """
    Vérifie une signature ECDSA. Lève InvalidSignature si incorrecte.
    """
    try:
        public_key.verify(signature, file_hash, ec.ECDSA(hashes.SHA256()))
        return True
    except InvalidSignature:
        return False

def serialize_public_key(public_key) -> str:
    """Exporte la clé publique en PEM pour partage."""
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    import hashlib
    
    private_key, public_key = generate_ecdsa_keypair()
    
    # Simuler le hash du fichier
    file_data = b"Contenu du fichier confidentiel"
    file_hash = hashlib.sha256(file_data).digest()
    print(f"Hash SHA-256 : {file_hash.hex()}")
    
    # Signer
    sig = sign_file_hash(private_key, file_hash)
    print(f"Signature DER ({len(sig)} bytes) : {sig.hex()[:32]}...")
    
    # Vérifier
    valid = verify_signature(public_key, file_hash, sig)
    print(f"Signature valide : {valid}")
    
    print("\\nClé publique PEM :")
    print(serialize_public_key(public_key))
`,
  },
  {
    id: 'sha256',
    title: 'SHA-256 — Hachage cryptographique',
    icon: '#️⃣',
    color: '#fbbf24',
    utility: `SHA-256 (Secure Hash Algorithm 256-bit) est la fonction de hachage cryptographique utilisée pour garantir l'intégrité des fichiers :
• Déterministe : même entrée → même hash (32 bytes = 256 bits)
• Résistant aux collisions : impossible de trouver deux fichiers avec le même hash
• Effet avalanche : 1 bit modifié → hash totalement différent
• Vérification incrémentale : chaque chunk est hashé séparément pour détecter les corruptions

Dans ce projet, SHA-256 est calculé avant envoi et re-vérifié après réception.`,
    library: 'hashlib (Python stdlib) ou cryptography',
    code: `# ── SHA-256 Hashing — Fichier complet et par chunks ────────────────
import hashlib
import os

def hash_file_complete(filepath: str) -> str:
    """
    Calcule le SHA-256 d'un fichier entier.
    Lecture par blocs pour économiser la RAM (grands fichiers).
    
    Returns: Hex digest (64 caractères)
    """
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while block := f.read(65536):   # Lire 64 Ko à la fois
            sha256.update(block)
    return sha256.hexdigest()

def hash_chunk(data: bytes) -> str:
    """Hash SHA-256 d'un chunk individuel (pour vérification progressive)."""
    return hashlib.sha256(data).hexdigest()

def hash_bytes(data: bytes) -> bytes:
    """Hash SHA-256 retournant des bytes (pour signature ECDSA)."""
    return hashlib.sha256(data).digest()

class IncrementalHasher:
    """
    Hachage incrémental : met à jour le hash au fur et à mesure
    des chunks reçus — sans stocker l'intégralité du fichier.
    """
    def __init__(self):
        self._hasher = hashlib.sha256()
        self._bytes_processed = 0

    def update(self, chunk: bytes):
        self._hasher.update(chunk)
        self._bytes_processed += len(chunk)

    def hexdigest(self) -> str:
        return self._hasher.hexdigest()

    def digest(self) -> bytes:
        return self._hasher.digest()

    @property
    def bytes_processed(self) -> int:
        return self._bytes_processed

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    # Hash d'un message
    data = b"Fichier confidentiel a transferer"
    print(f"SHA-256 : {hashlib.sha256(data).hexdigest()}")
    
    # Hash incrémental (simulant la réception de chunks)
    hasher = IncrementalHasher()
    chunks = [data[i:i+8] for i in range(0, len(data), 8)]
    for chunk in chunks:
        hasher.update(chunk)
        print(f"  chunk reçu : {chunk} → hash partiel : {hasher.hexdigest()[:16]}...")
    
    print(f"\\nHash final : {hasher.hexdigest()}")
    print(f"Bytes traités : {hasher.bytes_processed}")
    
    # Vérification d'intégrité
    expected = hashlib.sha256(data).hexdigest()
    received = hasher.hexdigest()
    print(f"\\nIntégrité OK : {expected == received}")
`,
  },
  {
    id: 'rsa',
    title: 'RSA-OAEP 4096 — Chiffrement asymétrique',
    icon: '🔑',
    color: '#a78bfa',
    utility: `RSA-OAEP (Optimal Asymmetric Encryption Padding) est utilisé pour l'échange sécurisé de la clé AES symétrique :
• Principe hybride : RSA chiffre la clé AES, AES chiffre les données
• RSA-4096 offre ~140 bits de sécurité (post-recommandation NIST 2030)
• OAEP (rembourrage probabiliste) résiste aux attaques choisies-plaintext
• La clé privée RSA ne quitte jamais le serveur destinataire

Pourquoi hybride ? RSA est ~1000× plus lent qu'AES — on ne l'utilise que pour transmettre la petite clé AES.`,
    library: 'cryptography (Python) — hazmat.primitives.asymmetric.rsa',
    code: `# ── RSA-OAEP 4096 — Échange de clé asymétrique ─────────────────────
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

def generate_rsa_keypair(key_size: int = 4096):
    """
    Génère une paire de clés RSA-4096.
    e = 65537 (exposant public standard — premier de Fermat F4)
    Attention : peut prendre 2-5 secondes pour 4096 bits.
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size
    )
    return private_key, private_key.public_key()

def rsa_encrypt_key(public_key, aes_key: bytes) -> bytes:
    """
    Chiffre la clé AES avec RSA-OAEP.
    
    Padding OAEP avec :
    - MGF1 (Mask Generation Function)
    - SHA-256 pour le hachage OAEP et MGF1
    
    Args:
        public_key : Clé publique RSA du destinataire
        aes_key    : Clé AES-256 à transmettre (32 bytes)
    
    Returns:
        Clé chiffrée (512 bytes pour RSA-4096)
    """
    return public_key.encrypt(
        aes_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

def rsa_decrypt_key(private_key, encrypted_key: bytes) -> bytes:
    """Déchiffre la clé AES avec la clé privée RSA."""
    return private_key.decrypt(
        encrypted_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

def export_public_key_pem(public_key) -> str:
    return public_key.public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    import os, time
    
    print("Génération RSA-4096...")
    t = time.time()
    priv, pub = generate_rsa_keypair(4096)
    print(f"  Durée : {time.time()-t:.2f}s")
    
    # Chiffrement de la clé AES
    aes_key = os.urandom(32)
    print(f"Clé AES originale : {aes_key.hex()}")
    
    enc = rsa_encrypt_key(pub, aes_key)
    print(f"Clé chiffrée ({len(enc)} bytes) : {enc.hex()[:32]}...")
    
    dec = rsa_decrypt_key(priv, enc)
    print(f"Clé récupérée : {dec.hex()}")
    print(f"Intégrité : {aes_key == dec}")
`,
  },
  {
    id: 'hkdf',
    title: 'HKDF — Dérivation de clé',
    icon: '🔄',
    color: '#f87171',
    utility: `HKDF (HMAC-based Key Derivation Function — RFC 5869) dérive des clés cryptographiquement solides à partir d'un secret partagé :
• Phase Extract : condense le secret en une pseudo-random key (PRK) via HMAC-SHA256
• Phase Expand : étend la PRK en autant de bytes de clé que nécessaire
• Sel : valeur publique aléatoire empêchant les attaques par dictionnaire
• Info : contexte applicatif (séparation de domaines — empêche la réutilisation de clés)

Dans ce projet, HKDF dérive des clés différentes pour chaque session à partir d'un secret maître, même si le secret est identique.`,
    library: 'cryptography (Python) — hazmat.primitives.kdf.hkdf',
    code: `# ── HKDF — Dérivation de clé HMAC-based ────────────────────────────
import os
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

def derive_session_key(
    master_secret: bytes,
    salt: bytes | None = None,
    info: bytes = b'SecureTransfer-v1-session-key',
    length: int = 32
) -> tuple[bytes, bytes]:
    """
    Dérive une clé de session AES-256 à partir du secret maître.
    
    HKDF-Extract : PRK = HMAC-SHA256(salt, master_secret)
    HKDF-Expand  : key = T(1) = HMAC(PRK, info || 0x01) jusqu'à length bytes
    
    Args:
        master_secret : Secret partagé (issu du handshake DH ou RSA)
        salt          : Valeur aléatoire publique (32 bytes recommandé)
        info          : Contexte applicatif en bytes
        length        : Longueur de la clé dérivée en bytes
    
    Returns:
        (derived_key, salt_used)
    """
    if salt is None:
        salt = os.urandom(32)
    
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=salt,
        info=info
    )
    derived_key = hkdf.derive(master_secret)
    return derived_key, salt

def derive_multiple_keys(master_secret: bytes, salt: bytes) -> dict:
    """
    Dérive plusieurs clés indépendantes pour différents usages
    (chiffrement, MAC, IV generation...).
    """
    keys = {}
    contexts = {
        'encryption': b'SecureTransfer-v1-encryption',
        'mac':        b'SecureTransfer-v1-mac',
        'iv_seed':    b'SecureTransfer-v1-iv',
    }
    for name, info in contexts.items():
        key, _ = derive_session_key(master_secret, salt=salt, info=info)
        keys[name] = key
    return keys

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    # Secret partagé simulant un résultat de handshake ECDH
    master = os.urandom(32)
    print(f"Secret maître : {master.hex()}")
    
    key1, salt = derive_session_key(master)
    key2, _    = derive_session_key(master)   # salt différent → clé différente !
    print(f"\\nClé session 1 : {key1.hex()}")
    print(f"Clé session 2 : {key2.hex()}")
    print(f"Identiques (mauvais!) : {key1 == key2}")
    
    # Même salt → même clé (reproductible pour décryptage)
    key3, _ = derive_session_key(master, salt=salt)
    print(f"\\nMême salt → reproductible : {key1 == key3}")
    
    # Dérivation multi-clés
    all_keys = derive_multiple_keys(master, salt)
    for name, k in all_keys.items():
        print(f"  {name:12} : {k.hex()[:32]}...")
`,
  },
  {
    id: 'hmac',
    title: 'HMAC-SHA256 — Authentification de message',
    icon: '🛡️',
    color: '#fb923c',
    utility: `HMAC (Hash-based Message Authentication Code) garantit l'intégrité et l'authenticité des données chiffrées :
• Combine une clé secrète et SHA-256 : HMAC(K, msg) = SHA256((K⊕opad) || SHA256((K⊕ipad) || msg))
• Détecte toute modification des données chiffrées (bitflip, replay, truncation)
• Différent du hash simple : nécessite la clé → protection contre les forgeries
• Utilisé en mode Encrypt-then-MAC (EtM) — standard le plus sûr

Note : AES-GCM intègre déjà un MAC (le tag), mais HMAC-SHA256 peut s'y ajouter pour les logs de transfert.`,
    library: 'hmac (Python stdlib) + hashlib',
    code: `# ── HMAC-SHA256 — Authentification de message ──────────────────────
import hmac
import hashlib
import os
import time

def compute_hmac(key: bytes, message: bytes) -> bytes:
    """
    Calcule HMAC-SHA256 d'un message.
    
    Construction : HMAC(K, M) = H((K⊕opad) || H((K⊕ipad) || M))
    où ipad = 0x36 × blocksize, opad = 0x5C × blocksize
    
    Args:
        key     : Clé secrète (recommandé : 32+ bytes)
        message : Données à authentifier (ciphertext, metadata, etc.)
    
    Returns:
        MAC de 32 bytes (256 bits)
    """
    return hmac.new(key, message, hashlib.sha256).digest()

def verify_hmac(key: bytes, message: bytes, expected_mac: bytes) -> bool:
    """
    Vérifie un HMAC en temps constant (hmac.compare_digest).
    Résiste aux attaques temporelles (timing attacks).
    """
    actual_mac = compute_hmac(key, message)
    return hmac.compare_digest(actual_mac, expected_mac)

def sign_transfer_log(
    key: bytes,
    filename: str,
    file_hash: str,
    timestamp: float | None = None
) -> dict:
    """
    Signe un log de transfert avec HMAC.
    Garantit que le journal n'a pas été altéré.
    """
    if timestamp is None:
        timestamp = time.time()
    
    payload = f"{filename}|{file_hash}|{timestamp}".encode()
    mac = compute_hmac(key, payload)
    
    return {
        'filename':  filename,
        'hash':      file_hash,
        'timestamp': timestamp,
        'mac':       mac.hex(),
        'payload':   payload.decode()
    }

def verify_log_entry(key: bytes, log_entry: dict) -> bool:
    """Vérifie l'authenticité d'une entrée de journal."""
    payload = log_entry['payload'].encode()
    expected = bytes.fromhex(log_entry['mac'])
    return verify_hmac(key, payload, expected)

# ── Utilisation ────────────────────────────────────────────────────
if __name__ == '__main__':
    key = os.urandom(32)
    message = b"ciphertext_payload_data_here"
    
    mac = compute_hmac(key, message)
    print(f"HMAC-SHA256 : {mac.hex()}")
    
    # Vérification
    valid = verify_hmac(key, message, mac)
    print(f"Valide : {valid}")
    
    # Falsification détectée
    tampered = message + b"\\x00"
    bad = verify_hmac(key, tampered, mac)
    print(f"Falsifié détecté : {not bad}")
    
    # Log de transfert signé
    log_key = os.urandom(32)
    entry = sign_transfer_log(log_key, "rapport.pdf", "a3f1b2c4..." * 8)
    print(f"\\nLog signé : {entry}")
    print(f"Log valide : {verify_log_entry(log_key, entry)}")
`,
  },
  {
    id: 'mtls',
    title: 'mTLS 1.3 — Authentification mutuelle TLS',
    icon: '🤝',
    color: '#22d3ee',
    utility: `mTLS (mutual TLS) est une extension de TLS où les deux parties s'authentifient mutuellement avec des certificats X.509 :
• TLS standard : seul le serveur présente un certificat (HTTPS classique)
• mTLS : client ET serveur présentent un certificat → confiance réciproque
• TLS 1.3 : handshake en 1 RTT, suppression des algorithmes faibles (RSA < 2048, SHA-1)
• Empêche les attaques man-in-the-middle même sur des réseaux compromis

C'est la couche transport qui protège le tunnel lui-même, en plus du chiffrement applicatif AES.`,
    library: 'ssl (Python stdlib) + asyncio + aiohttp',
    code: `# ── mTLS 1.3 — Configuration client/serveur ────────────────────────
import ssl
import asyncio
import aiohttp
from aiohttp import web

# ── Génération des certificats (OpenSSL CLI) ────────────────────────
# Créer une CA auto-signée :
#   openssl req -x509 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 365 -nodes
#
# Créer et signer le certificat serveur :
#   openssl req -newkey rsa:4096 -keyout server.key -out server.csr -nodes
#   openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -out server.crt
#
# Créer et signer le certificat client :
#   openssl req -newkey rsa:4096 -keyout client.key -out client.csr -nodes
#   openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -out client.crt


def create_server_ssl_context(
    ca_cert: str,
    server_cert: str,
    server_key: str
) -> ssl.SSLContext:
    """
    Contexte SSL serveur avec mTLS.
    CERT_REQUIRED : force la présentation du certificat client.
    """
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_3   # TLS 1.3 minimum
    ctx.load_cert_chain(server_cert, server_key)
    ctx.load_verify_locations(ca_cert)
    ctx.verify_mode = ssl.CERT_REQUIRED              # mTLS : vérif client
    return ctx


def create_client_ssl_context(
    ca_cert: str,
    client_cert: str,
    client_key: str
) -> ssl.SSLContext:
    """
    Contexte SSL client avec mTLS.
    Présente le certificat client au serveur.
    """
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_3
    ctx.load_cert_chain(client_cert, client_key)
    ctx.load_verify_locations(ca_cert)
    ctx.verify_mode = ssl.CERT_REQUIRED
    return ctx


# ── Serveur mTLS async ──────────────────────────────────────────────
async def upload_handler(request: web.Request) -> web.Response:
    """Handler de réception de fichier chiffré."""
    # Vérification du certificat client déjà faite par ssl.CERT_REQUIRED
    peer_cert = request.transport.get_extra_info('peercert')
    client_cn = dict(x[0] for x in peer_cert['subject']).get('commonName', 'unknown')
    
    data = await request.read()                # Lecture du ciphertext
    print(f"Reçu {len(data)} bytes de {client_cn}")
    
    return web.json_response({
        'status': 'received',
        'bytes': len(data),
        'client': client_cn
    })

async def run_server(host: str = '0.0.0.0', port: int = 8443):
    ssl_ctx = create_server_ssl_context('ca.crt', 'server.crt', 'server.key')
    app = web.Application()
    app.router.add_post('/upload', upload_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port, ssl_context=ssl_ctx)
    await site.start()
    print(f"Serveur mTLS 1.3 en écoute sur {host}:{port}")
    await asyncio.Event().wait()


# ── Client mTLS async ───────────────────────────────────────────────
async def send_file_mtls(server_url: str, ciphertext: bytes):
    """Envoie des données chiffrées via mTLS."""
    ssl_ctx = create_client_ssl_context('ca.crt', 'client.crt', 'client.key')
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{server_url}/upload",
            data=ciphertext,
            ssl=ssl_ctx
        ) as resp:
            result = await resp.json()
            print(f"Serveur : {result}")
            return result

# ── Point d'entrée ──────────────────────────────────────────────────
if __name__ == '__main__':
    # Démarrer le serveur :
    #   asyncio.run(run_server())
    # Envoyer un fichier :
    #   asyncio.run(send_file_mtls('https://localhost:8443', b'ciphertext'))
    print("Voir fonctions run_server() et send_file_mtls()")
    print(f"TLS 1.3 disponible : {ssl.HAS_TLSv1_3}")
`,
  },
];
