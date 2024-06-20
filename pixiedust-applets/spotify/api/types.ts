export type Image = { url: string; height: number; width: number };

export type Artist = { name: string };

export type AlbumObject = {
  images: Image[];
  name: string;
};

export type TrackObject = {
  album: AlbumObject;
  artists: Artist[];
  name: string;
  duration_ms: number;
};

export type EpisodeObject = {
  images: Image[];
  show: string;
  name: string;
  duration_ms: number;
};

export type CurrentlyPlayingResponse = {
  is_playing: boolean;
  progress_ms: number;
  item: TrackObject | EpisodeObject | null;
  type: "track" | "episode" | "ad" | "unknown";
};
