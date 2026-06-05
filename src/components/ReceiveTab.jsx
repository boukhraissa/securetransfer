import React, { useState, useEffect, useRef } from 'react';
import { Antenna, Download, CheckCircle, XCircle } from 'lucide-react';
import { randomHex, formatBytes, sleep } from '../crypto/simulation';
import styles from './ReceiveTab.module.css';

const FAKE_FILES = [
  { name: 'rapport_confidentiel_Q2.pdf', size: 2_400_000 },
  { name: 'backup_serveur_2026.zip', size: 18_700_000 },
  { name: 'cles_exportees.tar.gz', size: 540_000 },
  { name: 'database_dump.sql.enc', size: 6_200_000 },
];

export default function ReceiveTab({ onLog }) {
  const [listening, setListening] = useState(false);
  const [port, setPort] = useState('8443');
  const [received, setReceived] = useState([]);
  const intervalRef = useRef(null);

  const startReceive = async (fileSpec) => {
    const hash = randomHex(32);
    const sig = randomHex(72);
    const id = Date.now() + Math.random();
    const entry = { ...fileSpec, id, hash, sig, status: 'receiving', progress: 0 };
    setReceived(prev => [entry, ...prev]);
    onLog('info', `Connexion mTLS entrante — déchiffrement de ${fileSpec.name}...`);

    for (let p = 10; p <= 100; p += 15) {
      await sleep(200 + Math.random() * 150);
      setReceived(prev => prev.map(r => r.id === id ? { ...r, progress: Math.min(p, 100) } : r));
    }
    setReceived(prev => prev.map(r => r.id === id ? { ...r, status: 'done', progress: 100 } : r));
    onLog('success', `Fichier reçu et vérifié : ${fileSpec.name} | SHA-256: ${hash.slice(0, 16)}... | ECDSA ✓`);
  };

  const toggleListen = () => {
    if (listening) {
      setListening(false);
      clearInterval(intervalRef.current);
      onLog('warn', `Serveur mTLS 1.3 arrêté (port ${port})`);
    } else {
      setListening(true);
      onLog('info', `Serveur mTLS 1.3 en écoute sur 0.0.0.0:${port}`);
      onLog('info', 'Certificats clients acceptés — en attente de connexion...');
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i < FAKE_FILES.length) {
          startReceive(FAKE_FILES[i % FAKE_FILES.length]);
          i++;
        } else {
          clearInterval(intervalRef.current);
        }
      }, 4000);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className={styles.container}>
      <div className={styles.serverCard}>
        <div className={styles.serverHeader}>
          <div className={styles.serverInfo}>
            <div className={styles.serverTitle}>Serveur mTLS 1.3</div>
            <div className={styles.serverSub}>0.0.0.0 : port <strong>{port}</strong></div>
          </div>
          <div className={`${styles.statusDot} ${listening ? styles.active : ''}`} />
        </div>

        <div className={styles.portRow}>
          <label className={styles.label}>Port d'écoute</label>
          <input
            className={styles.input}
            value={port}
            onChange={e => setPort(e.target.value)}
            disabled={listening}
          />
        </div>

        <button className={`${styles.listenBtn} ${listening ? styles.stop : ''}`} onClick={toggleListen}>
          <Antenna size={16} />
          {listening ? 'Arrêter le serveur' : 'Démarrer l\'écoute'}
        </button>
      </div>

      {received.length > 0 && (
        <div className={styles.receivedCard}>
          <div className={styles.sectionLabel}>Fichiers reçus</div>
          {received.map(file => (
            <div key={file.id} className={styles.fileRow}>
              <div className={styles.fileIcon}>
                {file.status === 'done'
                  ? <CheckCircle size={16} className={styles.iconOk} />
                  : <Download size={16} className={styles.iconPending} />}
              </div>
              <div className={styles.fileMeta}>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSub}>{formatBytes(file.size)}</div>
                {file.status === 'done' && (
                  <div className={styles.fileVerif}>
                    SHA-256: <span className={styles.mono}>{file.hash.slice(0, 20)}...</span>
                    &nbsp;·&nbsp;ECDSA ✓&nbsp;·&nbsp;SHA-256 ✓
                  </div>
                )}
                {file.status === 'receiving' && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${file.progress}%` }} />
                  </div>
                )}
              </div>
              {file.status === 'done' && (
                <button className={styles.dlBtn} onClick={() => onLog('success', `Fichier enregistré : ${file.name}`)}>
                  <Download size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
