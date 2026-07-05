import type { LlmModelId } from "../plan-limits";

export interface LlmCallInput {
  model: LlmModelId;
  system: string;
  user: string;
  jsonMode?: boolean;
  /** Output-token ceiling; keeps a single runaway response from eating the budget. */
  maxTokens?: number;
}

const DEFAULT_MAX_TOKENS = 1024;

export interface LlmCallResult {
  content: string;
  model: string;
  tokensUsed?: number;
  provider: "mock" | "openai" | "gemini" | "groq";
}

async function callOpenAi(
  model: string,
  system: string,
  user: string,
  jsonMode: boolean,
  maxTokens: number
): Promise<LlmCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  return {
    content: json.choices?.[0]?.message?.content ?? "{}",
    model,
    tokensUsed: json.usage?.total_tokens,
    provider: "openai",
  };
}

async function callGemini(
  system: string,
  user: string,
  maxTokens: number
): Promise<LlmCallResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: `${user}\n\nRespond with valid JSON only.` }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return {
    content,
    model,
    tokensUsed: json.usageMetadata?.totalTokenCount,
    provider: "gemini",
  };
}

async function callGroq(
  system: string,
  user: string,
  jsonMode: boolean,
  maxTokens: number
): Promise<LlmCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const model = "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq error: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  return {
    content: json.choices?.[0]?.message?.content ?? "{}",
    model: "llama-3.3-70b-groq",
    tokensUsed: json.usage?.total_tokens,
    provider: "groq",
  };
}

export async function callLlm(input: LlmCallInput): Promise<LlmCallResult> {
  const jsonMode = input.jsonMode ?? true;
  const maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS;

  switch (input.model) {
    case "gpt-4o-mini":
      return callOpenAi("gpt-4o-mini", input.system, input.user, jsonMode, maxTokens);
    case "gpt-4o":
      return callOpenAi("gpt-4o", input.system, input.user, jsonMode, maxTokens);
    case "gemini-2.0-flash":
      return callGemini(input.system, input.user, maxTokens);
    case "llama-3.3-70b-groq":
      return callGroq(input.system, input.user, jsonMode, maxTokens);
    case "mock":
      return {
        content: JSON.stringify({ message: "Mock LLM response" }),
        model: "mock",
        provider: "mock",
      };
    default:
      return callOpenAi("gpt-4o-mini", input.system, input.user, jsonMode, maxTokens);
  }
}

export function resolveEffectiveModel(requested: LlmModelId): LlmModelId {
  if (requested === "mock") return "mock";
  if (requested === "gemini-2.0-flash") {
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) return requested;
    if (process.env.GROQ_API_KEY) return "llama-3.3-70b-groq";
    if (process.env.OPENAI_API_KEY) return "gpt-4o-mini";
    return "mock";
  }
  if (requested.startsWith("gpt-")) {
    if (process.env.OPENAI_API_KEY) return requested;
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) return "gemini-2.0-flash";
    if (process.env.GROQ_API_KEY) return "llama-3.3-70b-groq";
    return "mock";
  }
  return requested;
}
