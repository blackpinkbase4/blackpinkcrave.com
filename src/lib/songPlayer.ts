// Global, unified song player for public/song.mp3
// Guaranteed instant stop when toggled OFF, and seamless across Countdown & Live Premiere
// NEVER plays on the /admin page

export function isCurrentPageAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname.startsWith("/admin") ||
    window.location.hash.startsWith("#admin") ||
    window.location.search.includes("admin=true")
  );
}

class SongPlayer {
  private audio: HTMLAudioElement | null = null;
  public isMuted: boolean = true; // default muted to comply with modern browser autoplay policies

  constructor() {
    if (typeof window !== "undefined") {
      // Check saved mute preference
      const savedMute = localStorage.getItem("noir_song_muted");
      this.isMuted = savedMute !== null ? savedMute === "true" : true;

      this.audio = new Audio("/song.mp3");
      this.audio.loop = true;
      this.audio.volume = 0.65;
      this.audio.muted = this.isMuted;

      // Sync state on native audio events
      this.audio.addEventListener("play", () => {
        this.notify();
      });
      this.audio.addEventListener("pause", () => {
        this.notify();
      });

      // Automatically pause if on admin page or if navigating to admin
      const checkAndHaltIfAdmin = () => {
        if (isCurrentPageAdmin()) {
          this.pause();
        }
      };

      window.addEventListener("hashchange", checkAndHaltIfAdmin);
      window.addEventListener("popstate", checkAndHaltIfAdmin);

      // NEVER autoplay if on admin page
      if (isCurrentPageAdmin()) {
        this.pause();
        return;
      }

      // Try playing if user explicitly unmuted previously
      if (!this.isMuted) {
        this.audio.play().catch(() => {
          const unlock = () => {
            window.removeEventListener("click", unlock);
            window.removeEventListener("touchstart", unlock);
            if (!this.isMuted && !isCurrentPageAdmin() && this.audio && this.audio.paused) {
              this.audio.play().catch(() => {});
            }
          };
          window.addEventListener("click", unlock);
          window.addEventListener("touchstart", unlock);
        });
      }
    }
  }

  public getIsPlaying(): boolean {
    if (!this.audio || isCurrentPageAdmin()) return false;
    return !this.isMuted && !this.audio.paused;
  }

  private notify() {
    window.dispatchEvent(
      new CustomEvent("song_player_state_changed", {
        detail: { isPlaying: this.getIsPlaying(), isMuted: this.isMuted },
      })
    );
  }

  // Turn song ON
  public play() {
    if (isCurrentPageAdmin()) return;

    this.isMuted = false;
    try {
      localStorage.setItem("noir_song_muted", "false");
    } catch {}

    if (this.audio) {
      this.audio.muted = false;
      this.audio.play().catch(() => {});
    }
    this.notify();
  }

  // Turn song OFF (Instantly pauses and mutes)
  public pause() {
    this.isMuted = true;
    try {
      localStorage.setItem("noir_song_muted", "true");
    } catch {}

    if (this.audio) {
      this.audio.pause();
      this.audio.muted = true;
    }
    this.notify();
  }

  // 1-Click Toggle: Instantly turns ON or OFF
  public toggle(): boolean {
    if (isCurrentPageAdmin()) return false;
    if (this.getIsPlaying()) {
      this.pause();
    } else {
      this.play();
    }
    return this.getIsPlaying();
  }
}

export const songPlayer = new SongPlayer();
