/**
 * SpielerVerwaltung - Hauptkomponente für Spieler-Management
 * 
 * Kombiniert SpielerListe und SpielerForm
 * Domain-Driven Design: Diese Komponente orchestriert die Domain-Logik
 */

import React, { useState } from 'react';
import { SpielerListe } from './SpielerListe';
import { SpielerForm } from './SpielerForm';
import type { Spieler } from '@/shared/types';

interface SpielerVerwaltungProps {
  teamId: string;
}

export function SpielerVerwaltung({ teamId }: SpielerVerwaltungProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSpieler, setEditingSpieler] = useState<Spieler | undefined>();

  const handleAdd = () => {
    setEditingSpieler(undefined);
    setShowForm(true);
  };

  const handleEdit = (spieler: Spieler) => {
    setEditingSpieler(spieler);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingSpieler(undefined);
    // Liste wird automatisch aktualisiert durch useEffect in SpielerListe
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSpieler(undefined);
  };

  return (
    <>
      <SpielerListe
        teamId={teamId}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      {showForm && (
        <SpielerForm
          spieler={editingSpieler}
          teamId={teamId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
