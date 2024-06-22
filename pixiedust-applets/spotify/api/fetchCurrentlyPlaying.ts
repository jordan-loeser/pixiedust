import { CurrentlyPlayingResponse, EpisodeObject, TrackObject } from "./types";

export type CurrentlyPlaying = {
  imageUrl: string;
  name: string;
  artist: string;
  durationMs: number;
  progressMs: number;
};

export const fetchCurrentlyPlaying = async (
  token: string
): Promise<CurrentlyPlaying> => {
  // console.debug(
  //   `\n\n\tcurl --header "Authorization: Bearer ${token}" https://api.spotify.com/v1/me/player/currently-playing\n\n`
  // );

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch currently playing: ${res.statusText}`);
  }

  const json = (await res.json()) as CurrentlyPlayingResponse;

  if (!json.is_playing) {
    // TODO: handle more gracefully
    throw new Error("Nothing is currently playing");
  }

  if (
    json.currently_playing_type !== "track" &&
    json.currently_playing_type !== "episode"
  ) {
    throw new Error(`Unsupported item type: ${json.currently_playing_type}`);
  }

  if (json.currently_playing_type === "episode") {
    const episode = json.item as EpisodeObject;
    return {
      imageUrl: episode.images[episode.images.length - 1].url,
      name: episode.name,
      artist: episode.show,
      durationMs: episode.duration_ms,
      progressMs: json.progress_ms,
    };
  } else {
    const track = json.item as TrackObject;
    return {
      imageUrl: track.album.images[track.album.images.length - 1].url,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      durationMs: track.duration_ms,
      progressMs: json.progress_ms,
    };
  }
};
