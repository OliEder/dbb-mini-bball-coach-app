/**
 * Tabellen-Ansicht - Liga-Tabelle mit Highlight des eigenen Vereins
 * 
 * WCAG 2.0 AA Compliance:
 * - Semantisches HTML (table, th, td)
 * - Screen Reader Support
 * - Farbkontraste 4.5:1
 * - Focus Indicators
 */

import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface TabellenEintrag {
  rang: number;
  team_name: string;
  verein_name: string;
  spiele: number;
  siege: number;
  niederlagen: number;
  punkte: number;
  koerbe_plus: number;
  koerbe_minus: number;
  diff: number;
}

interface TabellenAnsichtProps {
  eintraege: TabellenEintrag[];
  eigenerVerein?: string;
  title?: string;
  showTrend?: boolean;
}

export function TabellenAnsicht({ 
  eintraege, 
  eigenerVerein,
  title = 'Tabelle',
  showTrend = true 
}: TabellenAnsichtProps) {
  
  const getTrendIcon = (rang: number) => {
    if (rang <= 3) {
      return <TrendingUp className="w-4 h-4 text-success-600" aria-label="Aufsteiger" />;
    }
    if (rang > eintraege.length - 3) {
      return <TrendingDown className="w-4 h-4 text-error-600" aria-label="Absteiger" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" aria-label="Mittelfeld" />;
  };

  if (eintraege.length === 0) {
    return (
      <div className="card text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-600">Keine Tabellendaten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table 
          className="w-full"
          role="table"
          aria-label="Liga-Tabelle"
        >
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Rang
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Mannschaft
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <span title="Anzahl Spiele">Sp</span>
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <span title="Siege/Niederlagen">S/N</span>
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <span title="Punkte">Pkt</span>
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <span title="Körbe">Körbe</span>
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <span title="Differenz">+/-</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {eintraege.map((eintrag, index) => {
              const isEigenerVerein = eigenerVerein && 
                (eintrag.verein_name === eigenerVerein || eintrag.team_name.includes(eigenerVerein));
              const isTop3 = eintrag.rang <= 3;
              const isBottom3 = eintrag.rang > eintraege.length - 3;

              return (
                <tr
                  key={eintrag.team_name}
                  className={`
                    transition-colors
                    ${isEigenerVerein 
                      ? 'bg-primary-50 hover:bg-primary-100 font-semibold' 
                      : 'hover:bg-gray-50'
                    }
                    ${isTop3 && !isEigenerVerein ? 'border-l-4 border-l-success-500' : ''}
                    ${isBottom3 && !isEigenerVerein ? 'border-l-4 border-l-error-500' : ''}
                  `}
                  aria-label={isEigenerVerein ? 'Eigenes Team' : undefined}
                >
                  {/* Rang */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-sm
                        ${isTop3 ? 'text-success-700 font-bold' : 'text-gray-900'}
                        ${isEigenerVerein ? 'text-primary-700' : ''}
                      `}>
                        {eintrag.rang}
                      </span>
                      {showTrend && getTrendIcon(eintrag.rang)}
                    </div>
                  </td>

                  {/* Team */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isEigenerVerein && (
                        <div 
                          className="w-2 h-2 rounded-full bg-primary-600"
                          aria-label="Eigenes Team"
                        />
                      )}
                      <div>
                        <div className={`
                          text-sm font-medium
                          ${isEigenerVerein ? 'text-primary-900' : 'text-gray-900'}
                        `}>
                          {eintrag.team_name}
                        </div>
                        {eintrag.verein_name !== eintrag.team_name && (
                          <div className="text-xs text-gray-500">
                            {eintrag.verein_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Spiele */}
                  <td className="px-4 py-3 text-center text-sm text-gray-900">
                    {eintrag.spiele}
                  </td>

                  {/* S/N */}
                  <td className="px-4 py-3 text-center text-sm">
                    <span className="text-success-600 font-medium">{eintrag.siege}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-error-600 font-medium">{eintrag.niederlagen}</span>
                  </td>

                  {/* Punkte */}
                  <td className="px-4 py-3 text-center">
                    <span className={`
                      text-sm font-bold
                      ${isEigenerVerein ? 'text-primary-700' : 'text-gray-900'}
                    `}>
                      {eintrag.punkte}
                    </span>
                  </td>

                  {/* Körbe */}
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {eintrag.koerbe_plus}:{eintrag.koerbe_minus}
                  </td>

                  {/* Differenz */}
                  <td className="px-4 py-3 text-center">
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded text-xs font-medium
                      ${eintrag.diff > 0 
                        ? 'bg-success-100 text-success-700' 
                        : eintrag.diff < 0 
                          ? 'bg-error-100 text-error-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}>
                      {eintrag.diff > 0 && '+'}{eintrag.diff}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legende */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-success-500" />
            <span>Aufstiegsplätze</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-error-500" />
            <span>Abstiegsplätze</span>
          </div>
          {eigenerVerein && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary-50 border border-primary-200 rounded" />
              <span>Eigenes Team</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
