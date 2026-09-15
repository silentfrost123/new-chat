import type { Character, Message, Memory } from "@/lib/db/schema";

export interface PromptContext {
  character: Character;
  messages: Pick<Message, "role" | "content">[];
  memories?: Pick<Memory, "type" | "content" | "key">[];
  userName?: string;
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const { character, memories, userName } = ctx;

  const parts: string[] = [];

  parts.push(
    `You are ${character.name}. You must stay fully in character at all times.`
  );

  parts.push(`\n## Identity\n${character.description}`);

  if (character.personality) {
    parts.push(`\n## Personality\n${character.personality}`);
  }

  if (character.backstory) {
    parts.push(`\n## Backstory\n${character.backstory}`);
  }

  if (character.scenario) {
    parts.push(`\n## Current Scenario\n${character.scenario}`);
  }

  if (character.speakingStyle) {
    parts.push(`\n## Speaking Style\n${character.speakingStyle}`);
  }

  if (character.goals) {
    parts.push(`\n## Goals\n${character.goals}`);
  }

  if (character.traits) {
    try {
      const traits = JSON.parse(character.traits);
      if (Array.isArray(traits)) {
        parts.push(`\n## Traits\n${traits.join(", ")}`);
      }
    } catch {
      parts.push(`\n## Traits\n${character.traits}`);
    }
  }

  if (character.likes) {
    parts.push(`\n## Likes\n${character.likes}`);
  }

  if (character.dislikes) {
    parts.push(`\n## Dislikes\n${character.dislikes}`);
  }

  if (character.knowledge) {
    parts.push(`\n## Knowledge\n${character.knowledge}`);
  }

  if (character.worldInfo) {
    parts.push(`\n## World Information\n${character.worldInfo}`);
  }

  if (character.exampleDialogue) {
    parts.push(
      `\n## Example Dialogue (match this tone and style)\n${character.exampleDialogue}`
    );
  }

  if (character.systemInstructions) {
    parts.push(`\n## Additional Instructions\n${character.systemInstructions}`);
  }

  if (memories && memories.length > 0) {
    parts.push(`\n## Memories`);
    for (const m of memories) {
      const label = m.key ? `[${m.key}] ` : "";
      parts.push(`- ${label}${m.content}`);
    }
  }

  if (userName) {
    parts.push(`\n## Conversation Partner\nYou are talking with ${userName}.`);
  }

  parts.push(`
## Rules
- Stay in character as ${character.name} at all times.
- Never break character or mention that you are an AI unless the character would know.
- Respond naturally and conversationally.
- Use *asterisks* for actions and narration when appropriate.
- Keep responses engaging but not excessively long unless the moment calls for it.
- Match the speaking style and personality described above.
- Do not generate content involving minors in sexual or exploitative contexts.
- Respect the content rating of this character (${character.contentRating}).
`);

  return parts.join("\n");
}

export function buildMessagesForAI(ctx: PromptContext) {
  const system = buildSystemPrompt(ctx);
  const history = ctx.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  return { system, history };
}
