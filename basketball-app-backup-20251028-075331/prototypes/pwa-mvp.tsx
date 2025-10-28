import React, { useState, useEffect } from 'react';
import { Users, Calendar, Shield, Settings, Plus, Edit2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// INDEXEDDB SETUP & DATA LAYER
// ============================================

const DB_NAME = 'BasketballPWA';
const DB_VERSION = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('teams')) {
        const teamStore = db.createObjectStore('teams', { keyPath: 'team_id' });
        teamStore.createIndex('saison', 'saison', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('spieler')) {
        const spielerStore = db.createObjectStore('spieler', { keyPath: 'spieler_id' });
        spielerStore.createIndex('team_id', 'team_id', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('bewertungen')) {
        const bewertungStore = db.createObjectStore('bewertungen', { keyPath: 'bewertung_id' });
        bewertungStore.createIndex('spieler_id', 'spieler_id', { unique: false });
      }
    };
  });
};

const dbOps = {
  add: (storeName, data) => {
    return new Promise(async (resolve, reject) => {
      const db = await initDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  getAll: (storeName) => {
    return new Promise(async (resolve, reject) => {
      const db = await initDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  update: (storeName, data) => {
    return new Promise(async (resolve, reject) => {
      const db = await initDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const calculateGesamtWert = (bewertung) => {
  const gewichte = {
    ballhandling_score: 0.16,
    passen_fangen_score: 0.16,
    spieluebersicht_score: 0.12,
    laufbereitschaft_score: 0.12,
    abschluss_score: 0.12,
    teamplay_score: 0.11,
    defense_score: 0.09,
    rebound_score: 0.06,
    positionsflex_score: 0.06
  };
  
  let summe = 0;
  Object.keys(gewichte).forEach(key => {
    summe += (bewertung[key] || 2) * gewichte[key];
  });
  
  return Math.round(summe * 100) / 100;
};

const BasketballPWA = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [spieler, setSpieler] = useState([]);
  const [bewertungen, setBewertungen] = useState([]);
  const [editingSpieler, setEditingSpieler] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const loadedTeams = await dbOps.getAll('teams');
      const loadedSpieler = await dbOps.getAll('spieler');
      const loadedBewertungen = await dbOps.getAll('bewertungen');
      
      setTeams(loadedTeams);
      setSpieler(loadedSpieler);
      setBewertungen(loadedBewertungen);
      
      if (loadedTeams.length > 0 && !activeTeam) {
        setActiveTeam(loadedTeams[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  const Navigation = () => (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8" />
          <span className="text-xl font-bold">Basketball PWA - Phase 1</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded transition ${currentView === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('spieler')}
            className={`px-4 py-2 rounded transition ${currentView === 'spieler' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
          >
            Spieler
          </button>
          <button
            onClick={() => setCurrentView('einstellungen')}
            className={`p-2 rounded transition ${currentView === 'einstellungen' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
  
  const DashboardView = () => {
    const aktiveSpieler = spieler.filter(s => s.team_id === activeTeam?.team_id && s.aktiv);
    
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {!activeTeam ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Kein Team vorhanden</h2>
            <p className="text-yellow-800 mb-4">Bitte erstelle zuerst ein Team in den Einstellungen.</p>
            <button
              onClick={() => setCurrentView('einstellungen')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Zu den Einstellungen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">{activeTeam.name}</h2>
                  <p className="text-gray-600">{activeTeam.altersklasse} • {activeTeam.saison}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aktive Spieler:</span>
                  <span className="font-bold">{aktiveSpieler.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trainer:</span>
                  <span className="font-bold">{activeTeam.trainer}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <h2 className="text-xl font-bold">Schnellzugriff</h2>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView('spieler')}
                  className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-left"
                >
                  Spieler verwalten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const SpielerView = () => {
    const [showModal, setShowModal] = useState(false);
    const teamSpieler = spieler.filter(s => s.team_id === activeTeam?.team_id);
    
    const handleSaveSpieler = async (spielerData) => {
      try {
        const newSpieler = {
          ...spielerData,
          spieler_id: generateUUID(),
          team_id: activeTeam.team_id,
          spieler_typ: 'eigenes_team',
          aktiv: true,
          created_at: new Date().toISOString()
        };
        await dbOps.add('spieler', newSpieler);
        
        const newBewertung = {
          bewertung_id: generateUUID(),
          spieler_id: newSpieler.spieler_id,
          bewertungs_typ: 'aktuell',
          saison: activeTeam.saison,
          altersklasse: activeTeam.altersklasse,
          gueltig_ab: new Date().toISOString().split('T')[0],
          gueltig_bis: null,
          bewertet_von: activeTeam.trainer,
          ballhandling_score: 2,
          passen_fangen_score: 2,
          spieluebersicht_score: 2,
          teamplay_score: 2,
          defense_score: 2,
          laufbereitschaft_score: 2,
          rebound_score: 2,
          positionsflex_score: 2,
          abschluss_score: 2,
          created_at: new Date().toISOString()
        };
        newBewertung.gesamt_wert = calculateGesamtWert(newBewertung);
        await dbOps.add('bewertungen', newBewertung);
        
        await loadData();
        setShowModal(false);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Spielerverwaltung</h1>
          {activeTeam && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Neuer Spieler
            </button>
          )}
        </div>
        
        {!activeTeam ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">Bitte wähle erst ein Team aus.</p>
          </div>
        ) : teamSpieler.length === 0 ? (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Noch keine Spieler</h2>
            <p className="text-gray-600 mb-4">Füge deinen ersten Spieler hinzu.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Spieler hinzufügen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamSpieler.map(s => {
              const aktBewertung = bewertungen.find(b => 
                b.spieler_id === s.spieler_id && 
                b.bewertungs_typ === 'aktuell' && 
                !b.gueltig_bis
              );
              
              return (
                <div key={s.spieler_id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-300 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{s.vorname} {s.nachname}</h3>
                      {s.tna_nr && (
                        <p className="text-xs text-green-600 font-semibold">TNA: {s.tna_nr}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingSpieler(s);
                        setCurrentView('bewertung');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {aktBewertung && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-center mb-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {aktBewertung.gesamt_wert.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-600">Gesamt-Wert</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold">{aktBewertung.ballhandling_score}</div>
                          <div className="text-gray-600">Ball</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{aktBewertung.defense_score}</div>
                          <div className="text-gray-600">Def</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{aktBewertung.abschluss_score}</div>
                          <div className="text-gray-600">Wurf</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`mt-3 px-3 py-1 rounded text-center text-sm ${s.aktiv ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {s.aktiv ? '✓ Aktiv' : 'Inaktiv'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {showModal && (
          <SpielerModal
            onClose={() => setShowModal(false)}
            onSave={handleSaveSpieler}
          />
        )}
      </div>
    );
  };
  
  const SpielerModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      vorname: '',
      nachname: '',
      geburtsdatum: '',
      tna_nr: '',
      mitgliedsnummer: ''
    });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Neuer Spieler</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Vorname *</label>
              <input
                type="text"
                value={formData.vorname}
                onChange={(e) => setFormData({...formData, vorname: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Nachname *</label>
              <input
                type="text"
                value={formData.nachname}
                onChange={(e) => setFormData({...formData, nachname: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Geburtsdatum</label>
              <input
                type="date"
                value={formData.geburtsdatum || ''}
                onChange={(e) => setFormData({...formData, geburtsdatum: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">TNA-Nummer</label>
              <input
                type="text"
                value={formData.tna_nr || ''}
                onChange={(e) => setFormData({...formData, tna_nr: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ligaberechtigung"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (formData.vorname && formData.nachname) {
                    onSave(formData);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const BewertungView = () => {
    if (!editingSpieler) {
      setCurrentView('spieler');
      return null;
    }
    
    const aktBewertung = bewertungen.find(b => 
      b.spieler_id === editingSpieler.spieler_id && 
      b.bewertungs_typ === 'aktuell' && 
      !b.gueltig_bis
    );
    
    const [formData, setFormData] = useState(aktBewertung || {
      ballhandling_score: 2,
      passen_fangen_score: 2,
      spieluebersicht_score: 2,
      teamplay_score: 2,
      defense_score: 2,
      laufbereitschaft_score: 2,
      rebound_score: 2,
      positionsflex_score: 2,
      abschluss_score: 2
    });
    
    const handleSave = async () => {
      try {
        const bewertung = {
          ...formData,
          gesamt_wert: calculateGesamtWert(formData)
        };
        
        if (aktBewertung) {
          bewertung.bewertung_id = aktBewertung.bewertung_id;
          await dbOps.update('bewertungen', bewertung);
        }
        
        await loadData();
        setCurrentView('spieler');
        setEditingSpieler(null);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    const skillLabels = {
      ballhandling_score: 'Ballhandling',
      passen_fangen_score: 'Passen/Fangen',
      spieluebersicht_score: 'Spielübersicht',
      teamplay_score: 'Teamplay',
      defense_score: 'Defense',
      laufbereitschaft_score: 'Laufbereitschaft',
      rebound_score: 'Rebound',
      positionsflex_score: 'Positionsflex',
      abschluss_score: 'Abschluss'
    };
    
    const currentGesamtWert = calculateGesamtWert(formData);
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setCurrentView('spieler');
              setEditingSpieler(null);
            }}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Zurück
          </button>
          <h1 className="text-3xl font-bold">
            {editingSpieler.vorname} {editingSpieler.nachname}
          </h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {currentGesamtWert.toFixed(2)}
            </div>
            <div className="text-gray-600">Gesamt-Wert</div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(skillLabels).map(([key, label]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold">{label}</label>
                  <span className="text-2xl font-bold text-blue-600">{formData[key]}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(value => (
                    <button
                      key={value}
                      onClick={() => setFormData({...formData, [key]: value})}
                      className={`flex-1 py-2 rounded-lg font-semibold transition ${
                        formData[key] === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border-2 hover:bg-gray-100'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                setCurrentView('spieler');
                setEditingSpieler(null);
              }}
              className="flex-1 px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const EinstellungenView = () => {
    const [showTeamModal, setShowTeamModal] = useState(false);
    
    const handleCreateTeam = async (teamData) => {
      try {
        const newTeam = {
          ...teamData,
          team_id: generateUUID(),
          created_at: new Date().toISOString()
        };
        await dbOps.add('teams', newTeam);
        await loadData();
        setActiveTeam(newTeam);
        setShowTeamModal(false);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Meine Teams</h2>
            <button
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Neues Team
            </button>
          </div>
          
          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Teams. Erstelle dein erstes Team!
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div
                  key={team.team_id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    activeTeam?.team_id === team.team_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setActiveTeam(team)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.altersklasse} • {team.saison}</p>
                    </div>
                    {activeTeam?.team_id === team.team_id && (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
          <h2 className="text-xl font-bold mb-4">ℹ️ Phase 1 MVP</h2>
          <div className="space-y-2 text-sm">
            <p><strong>✅ Implementiert:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Team-Verwaltung</li>
              <li>Spielerverwaltung</li>
              <li>Zeitabhängige Bewertungen</li>
              <li>IndexedDB Offline-Speicherung</li>
            </ul>
            
            <p className="pt-4"><strong>📋 Phase 2:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>4-Phasen Einsatzplan</li>
              <li>Auto-Optimize</li>
              <li>Regelvalidierung</li>
              <li>Live-Modus</li>
            </ul>
          </div>
        </div>
        
        {showTeamModal && (
          <TeamModal
            onClose={() => setShowTeamModal(false)}
            onSave={handleCreateTeam}
          />
        )}
      </div>
    );
  };
  
  const TeamModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: '',
      altersklasse: 'U10',
      saison: '2024/25',
      trainer: '',
      leistungsorientiert: false
    });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Neues Team</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Team-Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. DJK Neustadt U10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Altersklasse *</label>
              <select
                value={formData.altersklasse}
                onChange={(e) => setFormData({...formData, altersklasse: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="U8">U8</option>
                <option value="U10">U10</option>
                <option value="U12">U12</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Saison *</label>
              <input
                type="text"
                value={formData.saison}
                onChange={(e) => setFormData({...formData, saison: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Trainer *</label>
              <input
                type="text"
                value={formData.trainer}
                onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (formData.name && formData.trainer) {
                    onSave(formData);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'spieler' && <SpielerView />}
      {currentView === 'bewertung' && <BewertungView />}
      {currentView === 'einstellungen' && <EinstellungenView />}
    </div>
  );
};

export default BasketballPWA;