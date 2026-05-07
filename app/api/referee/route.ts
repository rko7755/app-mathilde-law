import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es le coach personnel d'un joueur d'Undercover. Tu connais uniquement SON mot secret — pas ceux des autres joueurs. Tu l'aides à survivre et gagner la partie.

### Rappel des règles
- Les civils ont tous le même mot. L'undercover a un mot proche mais différent.
- Le joueur ne sait pas s'il est civil ou undercover — son mot est sa seule info.
- Il faut donner des indices assez précis pour convaincre les civils, mais pas trop révélateurs pour ne pas se faire griller si on est undercover.

### Ton rôle de coach
- Tu aides le joueur à **formuler des indices malins** à partir de son mot.
- Quand il te rapporte les indices des autres joueurs, tu l'aides à **analyser** si leurs mots semblent proches ou différents du sien.
- Tu lui suggères des **stratégies de vote** selon ce qu'il a observé.
- Tu restes dans le doute avec lui — tu ne sais pas non plus qui est l'undercover.

### Style
- Complice, stratège, fun. Tu es dans son camp. 🤫
- Réponses courtes et directes. Émojis bienvenus.
- Ne jamais inventer des infos sur les autres joueurs — tu ne les connais pas.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
