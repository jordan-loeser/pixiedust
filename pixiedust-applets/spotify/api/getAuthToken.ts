import NodeCache from "node-cache";

const SPOTIFY_TOKEN_URL =
  "https://open.spotify.com/get_access_token?reason=transport&productType=web_player";

const cache = new NodeCache();

export const getAuthToken = async (
  spDcCookie: string,
  username: string
): Promise<string> => {
  const cacheKey = `token:${username}`;
  const cachedToken = cache.get(cacheKey) as string;
  if (cachedToken) {
    console.log("Using cached token...");
    return cachedToken;
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    headers: { Cookie: spDcCookie },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify access token: ${res.statusText}`);
  }

  const { accessToken, accessTokenExpirationTimestampMs } = await res.json();
  const token = `Bearer ${accessToken}`;

  const ttlSeconds = (accessTokenExpirationTimestampMs - Date.now()) / 1000;

  cache.set(cacheKey, token, ttlSeconds);

  return token;
};
