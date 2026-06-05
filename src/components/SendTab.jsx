import React, { useState, useRef, useCallback } from 'react';
import { Upload, Send, Shield, Lock, Fingerprint, Network, RefreshCw } from 'lucide-react';
import { fullSecureTransfer, formatBytes } from '../crypto/simulation';
import styles from './SendTab.module.css';

const CRYPTO_INFO = [
  { icon: <Lock size={14} />, label: 'Chiffrement', value: 'AES-256-GCM', color: '#38bdf8' },
  { icon: <Shield size={14} />, label: 'Signature', value: 'ECDSA P-256', color: '#34d399' },
  { icon: <Fingerprint size={14} />, label: 'Hachage', value: 'SHA-256', color: '#fbbf24' },
  { icon: <Network size={14} />, label: 'Transport', value: 'mTLS 1.3', color: '#a78bfa' },
];

const STEP_LABELS = {
  hash:   'SHA-256',
  ecdsa:  'ECDSA P-256',
  hkdf:   'HKDF',
  rsa:    'RSA-OAEP',
  aes:    'AES-256-GCM',
  hmac:   'HMAC',
  mtls:   'mTLS 1.3',
  verify: 'Vérification',
};

export default function SendTab({ onLog }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [destAddr, setDestAddr] = useState('192.168.1.100');
  const [destPort, setDestPort] = useState('8443');
  const [chunkKo, setChunkKo] = useState(64);
  const [transferring, setTransferring] = useState(false);
  const [steps, setSteps] = useState({});
  const [progress, setProgress] = useState({ cur: 0, total: 0, speed: '0', pct: 0 });
  const [done, setDone] = useState(false);
  const fileInputRef = useRef();

  const handleFile = useCallback((f) => {
    setFile(f);
    setDone(false);
    setSteps({});
    setProgress({ cur: 0, total: 0, speed: '0', pct: 0 });
    onLog('info', `Fichier sélectionné : ${f.name} (${formatBytes(f.size)})`);
  }, [onLog]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const startTransfer = async () => {
    if (!file || transferring) return;
    setTransferring(true);
    setDone(false);
    setSteps({});
    onLog('info', `Démarrage du transfert vers ${destAddr}:${destPort}`);

    try {
      await fullSecureTransfer(
        file, chunkKo,
        (stepId, detail, status) => {
          setSteps(prev => ({ ...prev, [stepId]: { detail, status } }));
          if (status === 'done') onLog('success', `[${STEP_LABELS[stepId]}] ${detail}`);
          else onLog('info', `[${STEP_LABELS[stepId]}] ${detail}`);
        },
        (cur, total, speed) => {
          const pct = Math.round((cur / total) * 100);
          setProgress({ cur, total, speed, pct });
        }
      );
      setDone(true);
      onLog('success', `✓ Transfert complet — ${file.name} envoyé de façon sécurisée`);
    } catch (err) {
      onLog('error', `Erreur : ${err.message}`);
    } finally {
      setTransferring(false);
    }
  };

  const getStepIcon = (status) => {
    if (status === 'done') return <span className={styles.stepDone}>✓</span>;
    if (status === 'running') return <RefreshCw size={12} className={styles.spinning} />;
    return <span className={styles.stepPending}>○</span>;
  };

  return (
    <div className={styles.container}>
      {/* Crypto badges */}
      <div className={styles.cryptoGrid}>
        {CRYPTO_INFO.map(({ icon, label, value, color }) => (
          <div key={label} className={styles.cryptoBadge}>
            <span className={styles.cryptoIcon} style={{ color }}>{icon}</span>
            <div>
              <div className={styles.cryptoLabel}>{label}</div>
              <div className={styles.cryptoValue}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>{file.name}</div>
            <div className={styles.fileSize}>{formatBytes(file.size)}</div>
            {done && <span className={styles.doneBadge}>✓ Envoyé</span>}
          </div>
        ) : (
          <>
            <Upload size={28} className={styles.uploadIcon} />
            <p className={styles.dropText}>Glissez un fichier ici</p>
            <span className={styles.dropHint}>ou cliquez pour parcourir</span>
          </>
        )}
      </div>

      {/* Config */}
      <div className={styles.configRow}>
        <div className={styles.configField}>
          <label className={styles.configLabel}>Adresse serveur</label>
          <input className={styles.input} value={destAddr} onChange={e => setDestAddr(e.target.value)} placeholder="192.168.1.100" />
        </div>
        <div className={styles.configFieldSmall}>
          <label className={styles.configLabel}>Port</label>
          <input className={styles.input} value={destPort} onChange={e => setDestPort(e.target.value)} placeholder="8443" />
        </div>
      </div>

      <div className={styles.sliderRow}>
        <label className={styles.configLabel}>Taille chunk : <strong>{chunkKo} Ko</strong></label>
        <input type="range" min="16" max="256" step="16" value={chunkKo} onChange={e => setChunkKo(Number(e.target.value))} className={styles.slider} />
      </div>

      {/* Steps */}
      {Object.keys(steps).length > 0 && (
        <div className={styles.stepsCard}>
          {Object.entries(steps).map(([id, { detail, status }]) => (
            <div key={id} className={`${styles.stepRow} ${styles['step_' + status]}`}>
              <span className={styles.stepName}>{STEP_LABELS[id]}</span>
              {getStepIcon(status)}
              <span className={styles.stepDetail}>{detail}</span>
            </div>
          ))}
          {progress.total > 0 && progress.pct < 100 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressMeta}>
                <span>{progress.pct}%</span>
                <span>{progress.speed} MB/s</span>
                <span>Chunk {progress.cur}/{progress.total}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className={styles.sendBtn}
        onClick={startTransfer}
        disabled={!file || transferring}
      >
        <Send size={16} />
        {transferring ? 'Chiffrement et envoi en cours...' : 'Chiffrer et envoyer'}
      </button>
    </div>
  );
}
