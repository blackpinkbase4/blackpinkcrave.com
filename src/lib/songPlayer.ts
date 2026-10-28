// Global, unified song player for public/song.mp3
// Seamless across Countdown & Live Premiere
// Automatically begins playing with sound on FIRST user click/interaction anywhere on page!
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
  public isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("noir_song_muted");
      // If user has not explicitly muted, default to unmuted (sound ON)
      this.isMuted = savedMute === "true";

      this.audio = new Audio("/song.mp3");
      this.audio.loop = true;
      this.audio.volume = 0.65;
      this.audio.muted = this.isMuted;

      // Sync state on native audio events
      this.audio.addEventListener("play", () => this.notify());
      this.audio.addEventListener("pause", () => this.notify());

      const checkAndHaltIfAdmin = () => {
        if (isCurrentPageAdmin()) {
          this.pause();
        }
      };

      window.addEventListener("hashchange", checkAndHaltIfAdmin);
      window.addEventListener("popstate", checkAndHaltIfAdmin);

      // Never play on admin
      if (isCurrentPageAdmin()) {
        this.pause();
        return;
      }

      // Try playing immediately
      if (!this.isMuted) {
        this.audio.play().catch(() => {
          // If browser policy blocks 0-click autoplay, start immediately on first user touch / click anywhere!
          const unlockAudio = () => {
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
            window.removeEventListener("pointerdown", unlockAudio);

            if (!this.isMuted && !isCurrentPageAdmin() && this.audio && this.audio.paused) {
              this.audio.muted = false;
              this.audio.play().catch(() => {});
            }
          };

          window.addEventListener("click", unlockAudio, { passive: true });
          window.addEventListener("touchstart", unlockAudio, { passive: true });
          window.addEventListener("keydown", unlockAudio, { passive: true });
          window.addEventListener("pointerdown", unlockAudio, { passive: true });
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
