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
  form.append("consent", "true");
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

export type StudioUploadResponse = { id: string; status?: string };
export type StudioJobResponse = { id?: string; status?: string; outputs?: string[] };

export async function uploadStudioTrack(uri: string, name: string, mimeType?: string): Promise<StudioUploadResponse> {
  const base = requireApiUrl();
  const form = new FormData();
  form.append("audio", { uri, name, type: mimeType || "audio/mpeg" } as unknown as Blob);
  const response = await fetch(base + "/v1/studio/tracks", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form
  });
  if (!response.ok) throw new Error("No se pudo subir la pista al estudio (" + response.status + ").");
  return await response.json() as StudioUploadResponse;
}

export async function separateStems(trackId: string): Promise<StudioJobResponse> {
  const base = requireApiUrl();
  const response = await fetch(base + "/v1/studio/separate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ trackId, stems: ["vocals", "instrumental"] })
  });
  if (!response.ok) throw new Error("El servicio de separación respondió con un error (" + response.status + ").");
  return await response.json() as StudioJobResponse;
}

export async function processVocal(trackId: string, options: { effects: string[]; preset: string }): Promise<StudioJobResponse> {
  const base = requireApiUrl();
  const response = await fetch(base + "/v1/studio/vocal-effects", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ trackId, effects: options.effects, preset: options.preset, quality: "professional", outputFormat: "wav" })
  });
  if (!response.ok) throw new Error("El procesador vocal respondió con un error (" + response.status + ").");
  return await response.json() as StudioJobResponse;
}

export type StudioJobStatus = { id: string; status: string; outputUrl?: string; error?: string };
export async function getStudioJob(id: string): Promise<StudioJobStatus> {
  const base = requireApiUrl();
  const response = await fetch(base + "/v1/jobs/" + encodeURIComponent(id), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("No se pudo consultar el trabajo de audio (" + response.status + ").");
  return await response.json() as StudioJobStatus;
}
