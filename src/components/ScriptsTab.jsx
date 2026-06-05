import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CRYPTO_SCRIPTS } from '../crypto/scripts';
import styles from './ScriptsTab.module.css';

export default function ScriptsTab() {
  const [selected, setSelected] = useState(CRYPTO_SCRIPTS[0].id);
  const script = CRYPTO_SCRIPTS.find(s => s.id === selected);

  return (
    <div className={styles.container}>
      {/* Sidebar navigation */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Modules crypto</div>
        {CRYPTO_SCRIPTS.map(s => (
          <button
            key={s.id}
            className={`${styles.sidebarItem} ${selected === s.id ? styles.active : ''}`}
            style={selected === s.id ? { borderLeftColor: s.color, color: s.color } : {}}
            onClick={() => setSelected(s.id)}
          >
            <span className={styles.itemIcon}>{s.icon}</span>
            <span className={styles.itemLabel}>{s.title.split(' — ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {script && (
        <div className={styles.detail}>
          <div className={styles.detailHeader} style={{ borderLeftColor: script.color }}>
            <span className={styles.detailIcon}>{script.icon}</span>
            <div>
              <h2 className={styles.detailTitle}>{script.title}</h2>
              <div className={styles.detailLib}>
                <span className={styles.libLabel}>Librairie</span>
                <code className={styles.libCode}>{script.library}</code>
              </div>
            </div>
          </div>

          <div className={styles.utilityBox}>
            <div className={styles.utilityLabel}>Utilité dans ce projet</div>
            <div className={styles.utilityText}>{script.utility}</div>
          </div>

          <div className={styles.codeLabel}>
            <span className={styles.codeDot} style={{ background: script.color }} />
            Script Python complet
          </div>
          <div className={styles.codeBlock}>
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              customStyle={{
                background: '#0d1117',
                borderRadius: '8px',
                fontSize: '12px',
                margin: 0,
                padding: '1.2rem',
                lineHeight: 1.6,
              }}
              showLineNumbers
              lineNumberStyle={{ color: '#3d4451', minWidth: '2.5em' }}
            >
              {script.code}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
}
