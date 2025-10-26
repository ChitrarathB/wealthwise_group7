#!/usr/bin/env python3
"""
Simple HTTP server for WealthWise Demo
Frontend-only version with no backend dependencies
"""

import http.server
import socketserver
import os
import sys

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🎭 WealthWise Demo Server")
        print(f"📊 Serving frontend-only demo at http://localhost:{PORT}")
        print(f"📁 Directory: {os.getcwd()}")
        print(f"🚀 Press Ctrl+C to stop")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Demo server stopped")
            sys.exit(0)

if __name__ == "__main__":
    main()

