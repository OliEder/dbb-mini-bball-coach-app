#!/usr/bin/env python3
"""
Basketball Schedule Parser Service
Parst Basketball-SpielplÃ¤ne aus HTML-Tabellen und stellt sie als JSON bereit.

Autor: AI Assistant
Datum: Oktober 2025
"""

import re
import json
import urllib.request
import urllib.parse
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

class ScheduleParserService:
    """Service zum Parsen von Basketball-SpielplÃ¤nen aus HTML-Tabellen"""

    def __init__(self):
        pass

    def parse_schedule_from_url(self, url: str) -> Dict[str, any]:
        """
        LÃ¤dt HTML von URL und parst den Spielplan

        Args:
            url: URL zur HTML-Seite mit dem Spielplan

        Returns:
            Dictionary mit Spielplan-Daten
        """
        try:
            # HTML von URL laden
            with urllib.request.urlopen(url) as response:
                html_content = response.read().decode('utf-8', errors='ignore')

            return self.parse_schedule_from_html(html_content)

        except Exception as e:
            raise Exception(f"Fehler beim Laden der URL: {str(e)}")

    def parse_schedule_from_html(self, html_content: str) -> Dict[str, any]:
        """
        Parst HTML-Inhalt und extrahiert Spielplan-Daten

        Args:
            html_content: HTML-String mit der Spielplan-Tabelle

        Returns:
            Dictionary mit Spielplan-Daten
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        games = []

        # Extrahiere Liga-Informationen aus dem Titel
        league_info = self._extract_league_info(soup)

        # Finde alle Tabellenzeilen - direkter Ansatz
        all_rows = soup.find_all('tr')

        for row in all_rows:
            cells = row.find_all('td')

            # PrÃ¼fe ob es eine Spielzeile ist (mindestens 6 Zellen + erste Zelle ist Nummer)
            if len(cells) >= 6:
                first_cell_text = cells[0].get_text().strip()
                if first_cell_text.isdigit() and len(first_cell_text) >= 3:
                    try:
                        game_data = self._extract_game_data(cells)
                        if game_data:
                            games.append(game_data)
                    except Exception as e:
                        continue

        return {
            "league": league_info,
            "source": "Deutscher Basketball-Bund e.V.",
            "extracted_at": datetime.now().isoformat(),
            "games_count": len(games),
            "games": games
        }

    def _extract_league_info(self, soup) -> str:
        """Extrahiert Liga-Informationen aus dem HTML"""
        title_element = soup.find('td', {'class': 'sportViewTitle'})
        if title_element:
            return self._clean_text(title_element.get_text())
        return "Unbekannte Liga"

    def _extract_game_data(self, cells) -> Optional[Dict]:
        """
        Extrahiert Spieldaten aus Tabellenzellen

        Args:
            cells: Liste der Tabellenzellen (td-Elemente)

        Returns:
            Dictionary mit Spieldaten oder None bei Fehlern
        """
        try:
            # Extrahiere die Daten aus den Zellen
            game_number = self._clean_text(cells[0].get_text())
            game_day = self._clean_text(cells[1].get_text())
            date_time_text = self._clean_text(cells[2].get_text())
            home_team = self._clean_text(cells[3].get_text())
            away_team = self._clean_text(cells[4].get_text())
            venue = self._clean_text(cells[5].get_text())

            # Schiedsrichter (falls vorhanden)
            referee = ""
            if len(cells) > 6:
                referee = self._clean_text(cells[6].get_text())

            # PrÃ¼fe ob es gÃ¼ltige Spieldaten sind
            if not game_number or not date_time_text or not home_team or not away_team:
                return None

            # Datum und Zeit parsen
            parsed_datetime = self._parse_datetime(date_time_text)

            game_data = {
                "game_number": game_number,
                "game_day": game_day,
                "date": parsed_datetime["date"],
                "time": parsed_datetime["time"],
                "datetime_iso": parsed_datetime["datetime_iso"],
                "home_team": home_team,
                "away_team": away_team,
                "venue": venue,
                "referee": referee
            }

            return game_data

        except Exception as e:
            return None

    def _clean_text(self, text: str) -> str:
        """
        Bereinigt Text von HTML-Entities und Whitespace

        Args:
            text: Zu bereinigender Text

        Returns:
            Bereinigter Text
        """
        if not text:
            return ""

        # Entferne HTML-Tags und Entities
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('&nbsp;', ' ')
        text = text.strip()

        return text

    def _parse_datetime(self, date_time_text: str) -> Dict[str, str]:
        """
        Parst Datum und Zeit aus dem Format "DD.MM.YYYY HH:MM"

        Args:
            date_time_text: Datum-Zeit String

        Returns:
            Dictionary mit geparsten Datum/Zeit-Komponenten
        """
        try:
            # Regex fÃ¼r Datum und Zeit
            match = re.search(r'(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})', date_time_text)

            if match:
                day, month, year, hour, minute = match.groups()

                # Erstelle datetime Objekt
                dt = datetime(int(year), int(month), int(day), int(hour), int(minute))

                return {
                    "date": f"{day.zfill(2)}.{month.zfill(2)}.{year}",
                    "time": f"{hour.zfill(2)}:{minute}",
                    "datetime_iso": dt.isoformat()
                }
            else:
                return {
                    "date": date_time_text,
                    "time": "",
                    "datetime_iso": ""
                }

        except Exception:
            return {
                "date": date_time_text,
                "time": "",
                "datetime_iso": ""
            }

class ScheduleHTTPHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler fÃ¼r den Spielplan-Service"""

    def __init__(self, *args, **kwargs):
        self.parser_service = ScheduleParserService()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        try:
            # Parse URL und Query Parameter
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)

            if parsed_url.path == '/parse':
                # URL Parameter extrahieren
                if 'url' not in query_params:
                    self._send_error(400, "URL parameter is required. Usage: /parse?url=<TARGET_URL>")
                    return

                target_url = query_params['url'][0]

                # Spielplan parsen
                result = self.parser_service.parse_schedule_from_url(target_url)

                # JSON Response senden
                self._send_json_response({
                    "success": True,
                    **result
                })

            elif parsed_url.path == '/health':
                # Health check endpoint
                self._send_json_response({
                    "status": "healthy",
                    "service": "Basketball Schedule Parser",
                    "version": "1.0"
                })

            else:
                # API Documentation
                self._send_json_response({
                    "service": "Basketball Schedule Parser API",
                    "version": "1.0",
                    "description": "Parst Basketball-SpielplÃ¤ne aus HTML-Tabellen",
                    "endpoints": {
                        "GET /parse?url=<TARGET_URL>": {
                            "description": "Parse schedule from target URL",
                            "parameters": {
                                "url": "URL zur HTML-Seite mit Spielplan (required)"
                            },
                            "example": "/parse?url=http://example.com/schedule.html"
                        },
                        "POST /parse": {
                            "description": "Parse schedule from URL in JSON body",
                            "body": {
                                "url": "URL zur HTML-Seite mit Spielplan (required)"
                            }
                        },
                        "GET /health": "Health check endpoint",
                        "GET /": "API documentation (this page)"
                    }
                })

        except Exception as e:
            self._send_error(500, str(e))

    def do_POST(self):
        """Handle POST requests"""
        try:
            if self.path == '/parse':
                # Lese JSON aus Request Body
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self._send_error(400, "Empty request body")
                    return

                post_data = self.rfile.read(content_length)

                try:
                    request_data = json.loads(post_data.decode('utf-8'))
                except json.JSONDecodeError:
                    self._send_error(400, "Invalid JSON in request body")
                    return

                if 'url' not in request_data:
                    self._send_error(400, "URL field is required in JSON body")
                    return

                # Spielplan parsen
                result = self.parser_service.parse_schedule_from_url(request_data['url'])

                # JSON Response senden
                self._send_json_response({
                    "success": True,
                    **result
                })
            else:
                self._send_error(404, "Endpoint not found")

        except Exception as e:
            self._send_error(500, str(e))

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json_response(self, data: dict, status_code: int = 200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        response_json = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(response_json.encode('utf-8'))

    def _send_error(self, status_code: int, message: str):
        """Send error response"""
        self._send_json_response({
            "success": False,
            "error": message,
            "status_code": status_code
        }, status_code)

    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{self.address_string()}] {format % args}")

def start_server(port: int = 8000, host: str = 'localhost'):
    """
    Start the HTTP server

    Args:
        port: Port number (default: 8000)
        host: Host address (default: localhost)
    """
    server_address = (host, port)
    httpd = HTTPServer(server_address, ScheduleHTTPHandler)

    print(f"ðŸ€ Basketball Schedule Parser Service")
    print(f"ðŸ“¡ Server gestartet auf http://{host}:{port}")
    print(f"")
    print(f"ðŸ“– API Endpoints:")
    print(f"  GET  http://{host}:{port}/parse?url=<TARGET_URL>")
    print(f"  POST http://{host}:{port}/parse (JSON body mit 'url' field)")
    print(f"  GET  http://{host}:{port}/health")
    print(f"  GET  http://{host}:{port}/ (API Documentation)")
    print(f"")
    print(f"ðŸ’¡ Beispiel:")
    print(f"  curl 'http://{host}:{port}/parse?url=https://example.com/spielplan.html'")
    print(f"")
    print(f"ðŸ›‘ DrÃ¼cke Ctrl+C zum Beenden...")
    print(f"")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nðŸ›‘ Server wird beendet...")
        httpd.shutdown()

def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description='Basketball Schedule Parser Service')
    parser.add_argument('--port', type=int, default=8000, help='Port number (default: 8000)')
    parser.add_argument('--host', default='localhost', help='Host address (default: localhost)')
    parser.add_argument('--test', action='store_true', help='Run test with sample data')

    args = parser.parse_args()

    if args.test:
        # Test mode
        print("ðŸ§ª Test Mode - Parsing sample HTML...")
        service = ScheduleParserService()

        # Test HTML (aus der bereitgestellten Datei)
        test_html = """
        <table class="sportView">
        <tr>
        <td class="sportItemEven" align="center">1049</td>
        <td class="sportItemEven" align="center">3</td>
        <td class="sportItemEven"><span>12.10.2025 12:00</span></td>
        <td class="sportItemEven">DJK Neustadt a. d. Waldnaab 1</td>
        <td class="sportItemEven">Regensburg Baskets 2</td>
        <td class="sportItemEven">Gymnasium</td>
        <td class="sportItemEven"></td>
        </tr>
        </table>
        """

        result = service.parse_schedule_from_html(test_html)
        print("âœ… Test erfolgreich!")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # Server mode
        start_server(args.port, args.host)

if __name__ == "__main__":
    main()