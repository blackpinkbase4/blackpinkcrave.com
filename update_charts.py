import urllib.request
import re
import json
import os
from datetime import datetime

ARTISTS_URLS = {
    "blackpink": "https://kworb.net/itunes/artist/blackpink.html",
    "jisoo": "https://kworb.net/itunes/artist/jisoo.html",
    "jennie": "https://kworb.net/itunes/artist/jennie.html",
    "rose": "https://kworb.net/itunes/artist/rose.html",
    "lisa": "https://kworb.net/itunes/artist/lisa.html"
}

def fetch_html(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def parse_artist_charts(html):
    # Find all track blocks: <td valign=top ...> ... </td>
    td_blocks = re.findall(r'<td valign=top[^>]*>([\s\S]*?)</td>', html)
    
    songs_data = {}
    
    for block in td_blocks:
        title_match = re.search(r'<div class="wrap"><b>([^<]+)</b></div>', block)
        if not title_match:
            continue
        title = title_match.group(1).strip()
        
        if title.lower().startswith("album:"):
            continue
            
        services_data = {}
        
        services = {
            "spotify": r'<div class="spo">Spotify:<br>([\s\S]*?)<br></div>',
            "apple_music": r'<div class="app">Apple Music:<br>([\s\S]*?)<br></div>',
            "itunes": r'<div class="itu">iTunes:<br>([\s\S]*?)<br></div>',
            "youtube": r'<div class="you">YouTube:<br>([\s\S]*?)<br></div>'
        }
        
        for s_name, pattern in services.items():
            s_match = re.search(pattern, block)
            if s_match:
                s_block = s_match.group(1)
                rows = re.findall(r'<a href="[^"]*">#([\d,]+)\s+([^<]+)</a>\s*<span class="change24">\((.*?)\)</span>', s_block)
                
                chart_entries = []
                for pos, region, change in rows:
                    chart_entries.append({
                        "pos": int(pos),
                        "region": region.strip(),
                        "change": change.strip()
                    })
                
                if chart_entries:
                    services_data[s_name] = chart_entries
                    
        if services_data:
            songs_data[title] = services_data
            
    return songs_data

def run_chart_scraper():
    print("Scraping real-time Spotify/Apple Music chart rankings from Kworb...")
    charts_db = {
        "lastUpdated": datetime.now().isoformat(),
        "artists": {}
    }
    
    for artist, url in ARTISTS_URLS.items():
        try:
            print(f"Scraping charts for {artist.upper()}...")
            html = fetch_html(url)
            songs_charts = parse_artist_charts(html)
            
            charts_db["artists"][artist] = {
                "name": artist.upper() if artist != "blackpink" else "BLACKPINK",
                "songs": songs_charts
            }
        except Exception as e:
            print(f"Error scraping charts for {artist}: {e}")
            
    project_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "charts_database.json")
    
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(charts_db, f, indent=2, ensure_ascii=False)
        
    print(f"Success! charts_database.json saved to {project_path}")

if __name__ == "__main__":
    run_chart_scraper()
