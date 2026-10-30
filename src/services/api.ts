export type SongRequest = {
  prompt: string;
  lyrics: string;
  genre: string;
  language: string;
  voiceSampleAvailable: boolean;
};
export type SongResponse = {
  id: string;
  title?: string;
  status?: string;
  audioUrl?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

function requireApiUrl() {
  if (!API_URL) {
    throw new Error("Falta configurar EXPO_PUBLIC_API_URL. La app ya puede grabar tu voz, pero el motor musical todavía no está conectado.");
  }
  return API_URL;
}

export async function uploadVoiceSample(uri: string): Promise<void> {
  const base = requireApiUrl();
  const form = new FormData();
  form.append("audio", { uri, name: "voice-sample.m4a", type: "audio/mp4" } as unknown as Blob);
  const response = await fetch(base + "/v1/voice-samples", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form
  });
  if (!response.ok) throw new Error("El servidor rechazó la muestra de voz (" + response.status + ").");
}

export async function createSong(request: SongRequest): Promise<SongResponse> {
  const base = requireApiUrl();
  const response = await fetch(base + "/v1/songs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error("El motor musical respondió con un error (" + response.status + ").");
  return await response.json() as SongResponse;
}