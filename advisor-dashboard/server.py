#!/usr/bin/env python3
"""
Simple HTTP server for the Financial Advisor Dashboard
Serves static files on http://localhost:8082
"""

import http.server
import socketserver
import os
import sys

PORT = 8082

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.realpath(__file__)), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🎯 Financial Advisor Dashboard server running at:")
            print(f"   http://localhost:{PORT}")
            print(f"   Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n👋 Advisor Dashboard server stopped")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use")
            print(f"   Try stopping other servers or use a different port")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

