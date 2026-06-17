/**
 * Minimal LLM client for the Script Agent. Provider/base-URL/model/key are all
 * env-configurable so it works with Anthropic, OpenAI, or any OpenAI-compatible
 * endpoint (Moonshot/Kimi, DeepSeek, etc.) without code changes.
 */

export type LlmProvider = "anthropic" | "openai" | "moonshot" | "deepseek";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const DEFAULT_BASE: Record<LlmProvider, string> = {
  anthropic: "https://api.anthropic.com",
  openai: "https://api.openai.com/v1",
  moonshot: "https://api.moonshot.ai/v1",
  deepseek: "https://api.deepseek.com",
};

const DEFAULT_MODEL: Record<LlmProvider, string> = {
  anthropic: "claude-3-7-sonnet-latest",
  openai: "gpt-4o",
  moonshot: "kimi-k2-0905-preview",
  deepseek: "deepseek-chat",
};

export function llmFromEnv(): LlmConfig | undefined {
  const provider = (process.env.PALMIER_LLM_PROVIDER as LlmProvider) || "anthropic";
  const apiKey = process.env.PALMIER_LLM_API_KEY ?? "";
  if (!apiKey) return undefined;
  return {
    provider,
    apiKey,
    model: process.env.PALMIER_LLM_MODEL || DEFAULT_MODEL[provider],
    baseUrl: process.env.PALMIER_LLM_BASE_URL || DEFAULT_BASE[provider],
  };
}

export async function complete(cfg: LlmConfig, system: string, user: string): Promise<string> {
  const base = cfg.baseUrl ?? DEFAULT_BASE[cfg.provider];
  if (cfg.provider === "anthropic") {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 8000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.map((c) => c.text ?? "").join("");
  }
  // OpenAI-compatible chat completions
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content ?? "";
}
