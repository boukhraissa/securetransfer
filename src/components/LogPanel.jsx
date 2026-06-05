import React from 'react';
import { Trash2 } from 'lucide-react';
import styles from './LogPanel.module.css';

const TYPE_STYLES = {
  info: { color: '#38bdf8', prefix: '→' },
  success: { color: '#34d399', prefix: '✓' },
  warn: { color: '#fbbf24', prefix: '!' },
  error: { color: '#f87171', prefix: '✗' },
};

export default function LogPanel({ logs, onClear }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Journal horodaté et signé</span>
        <button className={styles.clearBtn} onClick={onClear}>
          <Trash2 size={14} /> Vider
        </button>
      </div>
      <div className={styles.logList}>
        {logs.length === 0 && (
          <div className={styles.empty}>Aucune entrée — démarrez un transfert</div>
        )}
        {logs.map((entry, i) => {
          const { color, prefix } = TYPE_STYLES[entry.type] || TYPE_STYLES.info;
          return (
            <div key={i} className={styles.logEntry}>
              <span className={styles.logTime}>{entry.time}</span>
              <span className={styles.logPrefix} style={{ color }}>{prefix}</span>
              <span className={styles.logMsg} style={{ color }}>{entry.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
