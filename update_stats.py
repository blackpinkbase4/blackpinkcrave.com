import urllib.request
import re
import json
import os
from datetime import datetime

# Target URLs
GROUP_URL = "https://kworb.net/spotify/artist/41MozSoPIsD1dJM0CLPjZF_songs.html"

SOLO_URLS = {
    "blackpink": "https://kworb.net/spotify/artist/41MozSoPIsD1dJM0CLPjZF_songs.html",
    "jisoo": "https://kworb.net/spotify/artist/6UZ0ba50XreR4TM8u322gs_songs.html",
    "jennie": "https://kworb.net/spotify/artist/250b0Wlc5Vk0CoUsaCY84M_songs.html",
    "rose": "https://kworb.net/spotify/artist/3eVa5w3URK5duf6eyVDbu9_songs.html",
    "lisa": "https://kworb.net/spotify/artist/5L1lO4eRHmJ7a0Q6csE5cT_songs.html"
}

def fetch_html(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def run_scraper():
    print("Fetching live group and solo data from Kworb.net...")
    try:
        # Load previous stats to compare group streams trends
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stats_data.json")
        prev_data = {}
        if os.path.exists(output_path):
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    prev_data = json.load(f)
            except Exception:
                pass
        
        prev_group_songs = prev_data.get("group", prev_data.get("songs", {}))

        # 1. Scrape Solo Pages & Group Full Page (all stored under solos dictionary)
        solos_data = {}
        # Pattern to capture track ID, track title, total streams, and daily streams
        solo_track_pattern = r'<tr><td class="text"><div>(?:\*\s+)?<a href="https://open\.spotify\.com/track/([a-zA-Z0-9]+)" target="_blank">([^<]+)</a></div></td><td>([\d,]+)</td><td>([\d,]+)</td>'
        
        # Scrape all soloists and the full group page
        group_html = None
        for member, url in SOLO_URLS.items():
            print(f"Scraping data for {member.upper()}...")
            html = fetch_html(url)
            if member == "blackpink":
                group_html = html # Cache group html for step 2
            
            # Extract total streams (first count in table row header)
            total_streams_match = re.search(r'<tr><td class="text">Streams</td><td>([\d,]+)</td>', html)
            total_streams = total_streams_match.group(1) if total_streams_match else "0"
            
            # Extract all songs (track ID, title, total streams, daily streams)
            parsed_songs = re.findall(solo_track_pattern, html)
            
            songs_dict = {}
            for track_id, title, streams, daily in parsed_songs:
                clean_title = title.strip()
                songs_dict[clean_title] = {
                    "streams": streams,
                    "daily": daily,
                    "track_id": track_id,
                    "url": f"https://open.spotify.com/track/{track_id}"
                }
            
            solos_data[member] = {
                "total_streams": total_streams,
                "songs": songs_dict
            }

        # 2. Extract Group Page target songs for stats.html Streaming Goals
        if group_html is None:
            group_html = fetch_html(GROUP_URL)

        # Parse group songs: Title, Streams, Daily
        song_pattern = r'<tr><td class="text"><div>(?:\*\s+)?<a href="https://open\.spotify\.com/track/[^"]+" target="_blank">([^<]+)</a></div></td><td>([\d,]+)</td><td>([\d,]+)</td>'
        group_parsed = re.findall(song_pattern, group_html)

        group_dict = {}
        for title, streams, daily in group_parsed:
            name = title.strip()
            group_dict[name] = {"streams": streams, "daily": daily}

        target_group_songs = ["JUMP", "GO", "Shut Down"]
        filtered_group = {}
        for song_name in target_group_songs:
            if song_name in group_dict:
                streams_val = group_dict[song_name]["streams"]
                daily_val = group_dict[song_name]["daily"]
                
                # Calculate trend
                new_daily_num = int(daily_val.replace(",", ""))
                old_daily_num = 0
                if song_name in prev_group_songs:
                    old_daily_num = int(prev_group_songs[song_name].get("daily", "0").replace(",", ""))
                
                if new_daily_num > old_daily_num:
                    trend = "up"
                elif new_daily_num < old_daily_num:
                    trend = "down"
                else:
                    trend = "flat"

                filtered_group[song_name] = {
                    "streams": streams_val,
                    "daily": daily_val,
                    "trend": trend
                }
            else:
                filtered_group[song_name] = {"streams": "0", "daily": "0", "trend": "flat"}

        # 3. Assemble Output
        final_data = {
            "group": filtered_group,
            "solos": solos_data,
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Write out to stats_data.json
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
            
        print(f"Success! stats_data.json fully updated: {final_data['last_updated']}")

    except Exception as e:
        print(f"Error scraping stats: {e}")

if __name__ == "__main__":
    run_scraper()
