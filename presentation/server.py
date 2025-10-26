#!/usr/bin/env python3
"""
Simple HTTP server for WealthWise Presentation
Professional PowerPoint-style presentation
"""

import http.server
import socketserver
import os
import sys

PORT = 8081

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
        print(f"🎭 WealthWise Presentation Server")
        print(f"📊 Serving presentation at http://localhost:{PORT}")
        print(f"📁 Directory: {os.getcwd()}")
        print(f"🚀 Press Ctrl+C to stop")
        print()
        print("📋 Presentation Features:")
        print("   • Arrow keys or click to navigate")
        print("   • Spacebar for next slide")
        print("   • 'P' key to toggle presentation mode")
        print("   • 'F11' or 'Esc' for fullscreen")
        print("   • Touch/swipe support on mobile")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Presentation server stopped")
            sys.exit(0)

if __name__ == "__main__":
    main()

