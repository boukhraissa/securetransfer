import React, { useState, useCallback } from 'react';
import SendTab from './components/SendTab';
import ReceiveTab from './components/ReceiveTab';
import ScriptsTab from './components/ScriptsTab';
import LogPanel from './components/LogPanel';
import { ShieldCheck, Upload, Download, Code, List } from 'lucide-react';
import './App.css';

const TABS = [
  { id: 'send',    label: 'Envoyer',  Icon: Upload },
  { id: 'receive', label: 'Recevoir', Icon: Download },
  { id: 'scripts', label: 'Scripts crypto', Icon: Code },
  { id: 'log',     label: 'Journal', Icon: List },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [logs, setLogs] = useState([
    { type: 'info', msg: 'Application initialisée — clés TLS chargées', time: now() },
    { type: 'info', msg: 'Certificat ECDSA P-256 prêt', time: now() },
  ]);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [{ type, msg, time: now() }, ...prev]);
  }, []);

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><ShieldCheck size={20} /></div>
          <div>
            <div className="brand-name">SecureTransfer</div>
            <div className="brand-sub">Projet 5 — Cryptographie</div>
          </div>
        </div>

        <div className="sidebar-badges">
          {['AES-256-GCM', 'ECDSA P-256', 'SHA-256', 'HKDF', 'RSA-OAEP', 'HMAC', 'mTLS 1.3'].map(b => (
            <span key={b} className="tech-badge">{b}</span>
          ))}
        </div>

        <nav className="sidebar-nav">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-dot" />
          <span>Module cryptographie avancée</span>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="tab-content">
          {activeTab === 'send'    && <SendTab onLog={addLog} />}
          {activeTab === 'receive' && <ReceiveTab onLog={addLog} />}
          {activeTab === 'scripts' && <ScriptsTab />}
          {activeTab === 'log'     && <LogPanel logs={logs} onClear={() => setLogs([])} />}
        </div>
      </main>
    </div>
  );
}

function now() {
  return new Date().toTimeString().slice(0, 8);
}
