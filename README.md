# SecureTransfer — Application web cryptographique
**Projet 5 : Module Cryptographie Avancée**

Application React simulant un transfert de fichiers sécurisé avec :
- AES-256-GCM (chiffrement symétrique par chunks)
- ECDSA P-256 (signature numérique)
- SHA-256 (hachage et vérification d'intégrité)
- RSA-OAEP 4096 (échange de clé asymétrique)
- HKDF (dérivation de clé)
- HMAC-SHA256 (authentification de message)
- mTLS 1.3 (transport authentifié mutuellement)

---

## Structure du projet

```
securetransfer/
├── public/
│   └── index.html
├── src/
│   ├── App.js              ← Layout principal (sidebar + onglets)
│   ├── App.css
│   ├── index.js
│   ├── index.css           ← Variables CSS globales (design tokens)
│   ├── crypto/
│   │   ├── simulation.js   ← Scripts crypto isolés (AES, ECDSA, SHA256, RSA, HKDF, HMAC...)
│   │   └── scripts.js      ← Catalogue des scripts Python avec explications
│   └── components/
│       ├── SendTab.jsx     ← Interface d'envoi avec progression
│       ├── SendTab.module.css
│       ├── ReceiveTab.jsx  ← Serveur mTLS simulé
│       ├── ReceiveTab.module.css
│       ├── ScriptsTab.jsx  ← Documentation des scripts crypto avec coloration syntaxique
│       ├── ScriptsTab.module.css
│       ├── LogPanel.jsx    ← Journal horodaté
│       └── LogPanel.module.css
├── vercel.json
└── package.json
```

---

## Déploiement sur Vercel

### Option 1 — Via GitHub (recommandé)

1. **Créer un repo GitHub** et pousser ce dossier :
   ```bash
   cd securetransfer
   git init
   git add .
   git commit -m "Initial commit — SecureTransfer"
   git remote add origin https://github.com/TON_PSEUDO/securetransfer.git
   git push -u origin main
   ```

2. **Aller sur [vercel.com](https://vercel.com)** → New Project → Import depuis GitHub

3. **Configuration automatique** grâce à `vercel.json` :
   - Build Command : `npm run build`
   - Output Directory : `build`
   - Framework : Create React App

4. **Déployer** → URL générée automatiquement (ex: `securetransfer-xxx.vercel.app`)

---

### Option 2 — Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Dans le dossier du projet
cd securetransfer
npm install
vercel deploy

# Pour la production
vercel --prod
```

---

## Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
# → http://localhost:3000

# Build de production
npm run build
```

---

## Note sur la simulation

Les opérations cryptographiques dans `src/crypto/simulation.js` sont des **simulations** qui reproduisent fidèlement le comportement et les sorties des vraies fonctions. Les scripts Python complets correspondants sont disponibles dans l'onglet **Scripts crypto** de l'application.

Pour une vraie implémentation backend, utiliser :
```
pip install cryptography aiohttp asyncio
```
