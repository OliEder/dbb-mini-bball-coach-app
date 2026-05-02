/**
 * SpielerForm - Formular zum Erstellen/Bearbeiten von Spielern
 * 
 * WCAG 2.0 AA Compliance:
 * - Label für alle Inputs
 * - Error Messages mit aria-live
 * - Fokus-Management
 * - Keyboard Navigation
 * - Touch Targets min. 44x44px
 */

import React, { useState, useEffect } from 'react';
import { spielerService } from '../services/SpielerService';
import type { Spieler, SpielerTyp } from '@/shared/types';
import { X, Save, UserPlus } from 'lucide-react';

interface SpielerFormProps {
  spieler?: Spieler;
  teamId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  spieler_typ: SpielerTyp;
  mitgliedsnummer: string;
  tna_nr: string;
  konfektionsgroesse_jersey: string;
  konfektionsgroesse_hose: string;
  aktiv: boolean;
}

export function SpielerForm({ spieler, teamId, onSave, onCancel }: SpielerFormProps) {
  const [formData, setFormData] = useState<FormData>({
    vorname: spieler?.vorname || '',
    nachname: spieler?.nachname || '',
    geburtsdatum: spieler?.geburtsdatum 
      ? new Date(spieler.geburtsdatum).toISOString().split('T')[0]
      : '',
    spieler_typ: spieler?.spieler_typ || 'eigenes_team',
    mitgliedsnummer: spieler?.mitgliedsnummer || '',
    tna_nr: spieler?.tna_nr || '',
    konfektionsgroesse_jersey: spieler?.konfektionsgroesse_jersey?.toString() || '',
    konfektionsgroesse_hose: spieler?.konfektionsgroesse_hose?.toString() || '',
    aktiv: spieler?.aktiv ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vorname.trim()) {
      newErrors.vorname = 'Vorname ist erforderlich';
    }

    if (!formData.nachname.trim()) {
      newErrors.nachname = 'Nachname ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const spielerData = {
        team_id: teamId,
        vorname: formData.vorname.trim(),
        nachname: formData.nachname.trim(),
        geburtsdatum: formData.geburtsdatum 
          ? new Date(formData.geburtsdatum)
          : undefined,
        spieler_typ: formData.spieler_typ,
        mitgliedsnummer: formData.mitgliedsnummer.trim() || undefined,
        tna_nr: formData.tna_nr.trim() || undefined,
        konfektionsgroesse_jersey: formData.konfektionsgroesse_jersey
          ? parseInt(formData.konfektionsgroesse_jersey)
          : undefined,
        konfektionsgroesse_hose: formData.konfektionsgroesse_hose
          ? parseInt(formData.konfektionsgroesse_hose)
          : undefined,
        aktiv: formData.aktiv,
      };

      if (spieler) {
        // Update
        await spielerService.updateSpieler(spieler.spieler_id, spielerData);
      } else {
        // Create
        await spielerService.createSpieler(spielerData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving spieler:', err);
      setErrors({
        submit: err instanceof Error ? err.message : 'Fehler beim Speichern',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isEditMode = !!spieler;
  const title = isEditMode ? 'Spieler bearbeiten' : 'Neuer Spieler';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="spieler-form-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 
            id="spieler-form-title"
            className="text-xl font-bold text-gray-900 flex items-center gap-2"
          >
            <UserPlus className="w-6 h-6 text-primary-600" aria-hidden="true" />
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="btn-secondary"
            aria-label="Formular schließen"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Submit Error */}
          {errors.submit && (
            <div 
              className="alert-error"
              role="alert"
              aria-live="assertive"
            >
              {errors.submit}
            </div>
          )}

          {/* Persönliche Daten */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">
              Persönliche Daten
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vorname */}
              <div>
                <label 
                  htmlFor="vorname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Vorname <span className="text-error-600" aria-label="Pflichtfeld">*</span>
                </label>
                <input
                  id="vorname"
                  type="text"
                  value={formData.vorname}
                  onChange={(e) => handleChange('vorname', e.target.value)}
                  className={`input-field ${errors.vorname ? 'border-error-600' : ''}`}
                  aria-required="true"
                  aria-invalid={!!errors.vorname}
                  aria-describedby={errors.vorname ? 'vorname-error' : undefined}
                />
                {errors.vorname && (
                  <p 
                    id="vorname-error"
                    className="text-sm text-error-600 mt-1"
                    role="alert"
                  >
                    {errors.vorname}
                  </p>
                )}
              </div>

              {/* Nachname */}
              <div>
                <label 
                  htmlFor="nachname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nachname <span className="text-error-600" aria-label="Pflichtfeld">*</span>
                </label>
                <input
                  id="nachname"
                  type="text"
                  value={formData.nachname}
                  onChange={(e) => handleChange('nachname', e.target.value)}
                  className={`input-field ${errors.nachname ? 'border-error-600' : ''}`}
                  aria-required="true"
                  aria-invalid={!!errors.nachname}
                  aria-describedby={errors.nachname ? 'nachname-error' : undefined}
                />
                {errors.nachname && (
                  <p 
                    id="nachname-error"
                    className="text-sm text-error-600 mt-1"
                    role="alert"
                  >
                    {errors.nachname}
                  </p>
                )}
              </div>

              {/* Geburtsdatum */}
              <div>
                <label 
                  htmlFor="geburtsdatum"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Geburtsdatum
                </label>
                <input
                  id="geburtsdatum"
                  type="date"
                  value={formData.geburtsdatum}
                  onChange={(e) => handleChange('geburtsdatum', e.target.value)}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center h-11">
                  <input
                    id="aktiv"
                    type="checkbox"
                    checked={formData.aktiv}
                    onChange={(e) => handleChange('aktiv', e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  />
                  <label 
                    htmlFor="aktiv"
                    className="ml-3 text-sm text-gray-700"
                  >
                    Spieler ist aktiv
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Vereinsdaten */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">
              Vereinsdaten
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mitgliedsnummer */}
              <div>
                <label 
                  htmlFor="mitgliedsnummer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mitgliedsnummer
                </label>
                <input
                  id="mitgliedsnummer"
                  type="text"
                  value={formData.mitgliedsnummer}
                  onChange={(e) => handleChange('mitgliedsnummer', e.target.value)}
                  className="input-field"
                  placeholder="z.B. 12345"
                />
              </div>

              {/* TNA-Nummer */}
              <div>
                <label 
                  htmlFor="tna_nr"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  TNA-Nummer
                </label>
                <input
                  id="tna_nr"
                  type="text"
                  value={formData.tna_nr}
                  onChange={(e) => handleChange('tna_nr', e.target.value)}
                  className="input-field"
                  placeholder="z.B. TNA-001"
                />
                <p className="text-xs text-gray-600 mt-1">
                  DBB-Ausweis für Ligaberechtigung
                </p>
              </div>
            </div>
          </fieldset>

          {/* Konfektionsgrößen */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">
              Konfektionsgrößen
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trikot */}
              <div>
                <label 
                  htmlFor="konfektionsgroesse_jersey"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Trikotgröße
                </label>
                <select
                  id="konfektionsgroesse_jersey"
                  value={formData.konfektionsgroesse_jersey}
                  onChange={(e) => handleChange('konfektionsgroesse_jersey', e.target.value)}
                  className="input-field"
                >
                  <option value="">Bitte wählen</option>
                  <option value="116">116</option>
                  <option value="128">128</option>
                  <option value="140">140</option>
                  <option value="152">152</option>
                  <option value="164">164</option>
                  <option value="170">170</option>
                </select>
              </div>

              {/* Hose */}
              <div>
                <label 
                  htmlFor="konfektionsgroesse_hose"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hosengröße
                </label>
                <select
                  id="konfektionsgroesse_hose"
                  value={formData.konfektionsgroesse_hose}
                  onChange={(e) => handleChange('konfektionsgroesse_hose', e.target.value)}
                  className="input-field"
                >
                  <option value="">Bitte wählen</option>
                  <option value="116">116</option>
                  <option value="128">128</option>
                  <option value="140">140</option>
                  <option value="152">152</option>
                  <option value="164">164</option>
                  <option value="170">170</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn-secondary"
              disabled={saving}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Speichern...</span>
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" aria-hidden="true" />
                  <span>{isEditMode ? 'Aktualisieren' : 'Erstellen'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
