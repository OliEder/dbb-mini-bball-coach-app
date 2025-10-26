/**
 * User Step - Onboarding v2
 * 
 * Eingabe von Vor- und Nachname des Trainers
 */

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface UserStepProps {
  initialData?: {
    vorname: string;
    nachname: string;
  } | null;
  onNext: (data: { vorname: string; nachname: string }) => void;
  onBack: () => void;
}

export const UserStep: React.FC<UserStepProps> = ({ initialData, onNext, onBack }) => {
  const [vorname, setVorname] = useState(initialData?.vorname || '');
  const [nachname, setNachname] = useState(initialData?.nachname || '');
  const [errors, setErrors] = useState<{ vorname?: string; nachname?: string }>({});
  
  useEffect(() => {
    if (initialData) {
      setVorname(initialData.vorname || '');
      setNachname(initialData.nachname || '');
    }
  }, [initialData]);
  
  const validate = (): boolean => {
    const newErrors: { vorname?: string; nachname?: string } = {};
    
    if (!vorname.trim()) {
      newErrors.vorname = 'Vorname ist erforderlich';
    } else if (vorname.trim().length < 2) {
      newErrors.vorname = 'Vorname muss mindestens 2 Zeichen haben';
    }
    
    if (!nachname.trim()) {
      newErrors.nachname = 'Nachname ist erforderlich';
    } else if (nachname.trim().length < 2) {
      newErrors.nachname = 'Nachname muss mindestens 2 Zeichen haben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onNext({
        vorname: vorname.trim(),
        nachname: nachname.trim()
      });
    }
  };
  
  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Ihre persönlichen Daten
        </h2>
        <p className="text-gray-600">
          Bitte geben Sie Ihren Namen ein
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="vorname" className="block text-sm font-medium text-gray-700 mb-1">
              Vorname *
            </label>
            <input
              type="text"
              id="vorname"
              value={vorname}
              onChange={(e) => {
                setVorname(e.target.value);
                if (errors.vorname) {
                  setErrors({ ...errors, vorname: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 
                         focus:ring-blue-500 ${errors.vorname ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Max"
              autoComplete="given-name"
              autoFocus
            />
            {errors.vorname && (
              <p className="mt-1 text-sm text-red-600">{errors.vorname}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="nachname" className="block text-sm font-medium text-gray-700 mb-1">
              Nachname *
            </label>
            <input
              type="text"
              id="nachname"
              value={nachname}
              onChange={(e) => {
                setNachname(e.target.value);
                if (errors.nachname) {
                  setErrors({ ...errors, nachname: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 
                         focus:ring-blue-500 ${errors.nachname ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Mustermann"
              autoComplete="family-name"
            />
            {errors.nachname && (
              <p className="mt-1 text-sm text-red-600">{errors.nachname}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md 
                       hover:bg-gray-300 transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Zurück
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md 
                       hover:bg-blue-700 transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Weiter →
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Diese Daten werden nur lokal auf Ihrem Gerät gespeichert
        </p>
      </div>
    </div>
  );
};
