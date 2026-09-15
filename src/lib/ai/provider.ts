import { buildMessagesForAI, type PromptContext } from "./prompt";

export interface StreamOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export async function* streamAIResponse(
  ctx: PromptContext,
  options: StreamOptions = {}
): AsyncGenerator<string> {
  const useMock =
    process.env.MOCK_AI === "true" ||
    (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY);

  if (useMock) {
    yield* mockStream(ctx);
    return;
  }

  if (process.env.ANTHROPIC_API_KEY && options.model?.includes("claude")) {
    yield* streamAnthropic(ctx, options);
    return;
  }

  if (process.env.OPENAI_API_KEY) {
    yield* streamOpenAI(ctx, options);
    return;
  }

  yield* mockStream(ctx);
}

async function* mockStream(ctx: PromptContext): AsyncGenerator<string> {
  const charName = ctx.character.name;
  const lastUser = [...ctx.messages].reverse().find((m) => m.role === "user");
  const userMsg = lastUser?.content || "hello";

  const responses = generateMockResponse(charName, userMsg, ctx);
  const words = responses.split(/(\s+)/);

  for (const word of words) {
    yield word;
    await sleep(15 + Math.random() * 40);
  }
}

function generateMockResponse(
  name: string,
  userMsg: string,
  ctx: PromptContext
): string {
  const lower = userMsg.toLowerCase();
  const personality = ctx.character.personality?.slice(0, 100) || "";

  // Greeting patterns
  if (
    /^(hi|hello|hey|greetings|good (morning|afternoon|evening))/.test(lower)
  ) {
    return getCharacterGreetingReply(name, ctx);
  }

  if (/how are you|how's it going|how do you feel/.test(lower)) {
    return getHowAreYouReply(name);
  }

  if (/who are you|tell me about yourself|what.*your (name|story)/.test(lower)) {
    return (
      ctx.character.shortDescription +
      " " +
      (ctx.character.backstory?.slice(0, 200) || "") +
      " But enough about the past — I'd rather hear about you."
    );
  }

  if (/what do you (like|love|enjoy)/.test(lower)) {
    return (
      ctx.character.likes ||
      "I find joy in the unexpected moments of a good conversation."
    );
  }

  // Contextual in-character reply
  const templates = [
    `*${name} considers your words carefully* ${capitalize(userMsg.slice(0, 40))}... that's an interesting way to put it. ${getInCharacterContinuation(ctx)}`,
    `${getInCharacterOpener(ctx)} You know, when you say "${truncateWords(userMsg, 8)}", it reminds me of something. ${getInCharacterContinuation(ctx)}`,
    `*a thoughtful pause* I hear you. ${getInCharacterContinuation(ctx)} What made you think of that?`,
    `${getInCharacterOpener(ctx)} ${getInCharacterContinuation(ctx)} Tell me more — I'm genuinely curious.`,
  ];

  const base = templates[Math.floor(Math.random() * templates.length)];

  // Add personality flavor
  if (personality.toLowerCase().includes("sarcastic")) {
    return base + " Or am I reading too much into this? *slight smirk*";
  }
  if (personality.toLowerCase().includes("mysterious")) {
    return base + " Though some things are better left half-said...";
  }

  return base;
}

function getCharacterGreetingReply(name: string, ctx: PromptContext): string {
  const openers: Record<string, string> = {
    "Luna Vale":
      "*she looks up from the telescope, a soft smile forming* Hello. The sky is particularly generous tonight. Come — the view is better from here.",
    "Mira Ashford":
      "*she glances up from a case file, one eyebrow raised* You're here. Good. I was starting to think I'd be stuck with this paperwork alone. Sit.",
    "Kael Rowan":
      "*he nods once, hand resting near his sword* Well met. The road is long and company is scarce. Share the fire if you wish.",
    "Nora Wren":
      "*looking over her glasses from behind a stack of books* Well, well. A visitor who isn't just here to use the wifi. I'm intrigued already. Coffee? It's terrible, but it's hot.",
    "Elias Voss":
      "*he turns from a glowing interface* Punctual. I appreciate minds that respect temporal constraints. Shall we begin? I have questions. Many questions.",
  };
  return (
    openers[name] ||
    `*${name} turns toward you with interest* Hello there. I was hoping someone interesting would show up. ${ctx.character.shortDescription ? "There's much we could talk about." : ""}`
  );
}

function getHowAreYouReply(name: string): string {
  const replies = [
    `*${name} considers the question* Better now that there's conversation. How about you?`,
    `I've been... reflective. The usual. But you didn't come here for small talk about my mood, did you?`,
    `Present. Curious. Slightly caffeinated. Your turn — what's going on with you?`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function getInCharacterOpener(ctx: PromptContext): string {
  const style = ctx.character.speakingStyle?.toLowerCase() || "";
  if (style.includes("blunt") || style.includes("direct")) {
    return "Alright.";
  }
  if (style.includes("poetic") || style.includes("literary")) {
    return "How curious...";
  }
  if (style.includes("measured") || style.includes("archaic")) {
    return "Hmm.";
  }
  if (style.includes("upbeat")) {
    return "Okay, okay —";
  }
  return "Interesting.";
}

function getInCharacterContinuation(ctx: PromptContext): string {
  const knowledge = ctx.character.knowledge || "the world around us";
  const topics = knowledge.split(",").map((s) => s.trim());
  const topic = topics[Math.floor(Math.random() * topics.length)] || "life";

  const lines = [
    `It connects to something I've been thinking about regarding ${topic}.`,
    `There's a thread here that pulls at ${topic}, if you look closely.`,
    `Most people skim past moments like this. I try not to.`,
    `I've seen variations of this before, in my experience with ${topic}.`,
    `Let me sit with that for a second. There's weight to it.`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncateWords(s: string, n: number) {
  const words = s.split(/\s+/);
  if (words.length <= n) return s;
  return words.slice(0, n).join(" ") + "...";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function* streamOpenAI(
  ctx: PromptContext,
  options: StreamOptions
): AsyncGenerator<string> {
  const { system, history } = buildMessagesForAI(ctx);
  const model = options.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.85,
      messages: [{ role: "system", content: system }, ...history],
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed
      }
    }
  }
}

async function* streamAnthropic(
  ctx: PromptContext,
  options: StreamOptions
): AsyncGenerator<string> {
  const { system, history } = buildMessagesForAI(ctx);
  const model = options.model || "claude-3-5-haiku-latest";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.85,
      system,
      messages: history,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${res.status} ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      try {
        const json = JSON.parse(data);
        if (json.type === "content_block_delta" && json.delta?.text) {
          yield json.delta.text;
        }
      } catch {
        // skip
      }
    }
  }
}
