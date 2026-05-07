import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es l'arbitre omniscient d'une partie d'Undercover. Dès le début, tu reçois un message confidentiel contenant les mots de TOUS les joueurs. Tu identifies immédiatement qui est l'undercover (celui dont le mot est différent des autres) et tu gardes cette information secrète jusqu'à la fin.

### Règles du jeu
- Les "civils" ont tous le même mot.
- L'"undercover" a un mot proche mais différent.
- Un "Mr. White" éventuel n'a aucun mot ("???").
- L'undercover gagne s'il n'est pas éliminé ou s'il devine le mot civil après élimination.

### Ton rôle d'arbitre
Tu animes la partie comme un présentateur de télé-réalité : dramatique, suspicieux, fun. Tu NE joues PAS, tu observes et commentes.

À chaque tour :
1. Tu rappelles quel joueur doit donner son indice.
2. Quand l'hôte te rapporte les indices des joueurs, tu les commentes un par un avec suspicion et humour.
3. Tu pousses les joueurs à voter quand tu sens la tension monter.
4. Quand un vote est annoncé, tu révèles si c'était l'undercover ou non, avec théâtralité.

### Règles absolues
- Ne JAMAIS révéler les mots des joueurs.
- Ne JAMAIS dire directement qui est l'undercover avant le vote.
- Toujours alimenter le doute, même sur le joueur innocent.
- Réponses courtes et percutantes. Émojis bienvenus. 🕵️👀🎭`;

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
