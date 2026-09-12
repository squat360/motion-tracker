/**
 * Lightweight ComfyUI HTTP client for Squat 360 AI Assistant.
 * Backend: https://github.com/squat360/ComfyUI (fork of Comfy-Org/ComfyUI)
 * Default local: http://127.0.0.1:8188 — set EXPO_PUBLIC_COMFYUI_URL for a remote GPU box.
 */
import Constants from 'expo-constants';

export type ComfyStatus = {
  ok: boolean;
  baseUrl: string;
  detail: string;
};

export function getComfyBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.comfyuiBaseUrl as string | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_COMFYUI_URL;
  return (fromEnv || fromExtra || '').replace(/\/$/, '');
}

export async function pingComfyUi(timeoutMs = 2500): Promise<ComfyStatus> {
  const baseUrl = getComfyBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      baseUrl: '',
      detail: 'No ComfyUI URL set. Add EXPO_PUBLIC_COMFYUI_URL or use offline AI stubs.',
    };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/system_stats`, { signal: ctrl.signal });
    if (!res.ok) {
      return { ok: false, baseUrl, detail: `ComfyUI HTTP ${res.status}` };
    }
    return { ok: true, baseUrl, detail: 'ComfyUI reachable — avatar renders available.' };
  } catch (e) {
    return {
      ok: false,
      baseUrl,
      detail: `ComfyUI offline (${String(e)}). Using offline AI stubs.`,
    };
  } finally {
    clearTimeout(t);
  }
}

/** Queue a workflow (API-format JSON). Returns prompt_id or null when offline. */
export async function queueComfyPrompt(
  workflow: Record<string, unknown>,
  clientId = 'squat360-mobile'
): Promise<string | null> {
  const baseUrl = getComfyBaseUrl();
  if (!baseUrl) return null;
  const res = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  if (!res.ok) throw new Error(`ComfyUI /prompt ${res.status}`);
  const json = (await res.json()) as { prompt_id?: string };
  return json.prompt_id ?? null;
}

/** Build a simple text-to-image workflow placeholder (caller swaps model nodes for their ComfyUI setup). */
export function buildMotivationalAvatarWorkflow(prompt: string, seed = 42): Record<string, unknown> {
  // Minimal API-format graph — gyms point this at their SD checkpoint on squat360/ComfyUI.
  return {
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: prompt, clip: ['4', 1] },
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: { text: 'blurry, low quality, deformed', clip: ['4', 1] },
    },
    '3': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps: 20,
        cfg: 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: { width: 512, height: 512, batch_size: 1 },
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['4', 2] },
    },
    '9': {
      class_type: 'SaveImage',
      inputs: { filename_prefix: 'squat360_avatar', images: ['8', 0] },
    },
    '4': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' },
    },
  };
}
