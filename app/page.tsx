"use client";

import { useState, useRef, useEffect } from "react";

interface Player {
  name: string;
  word: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function SetupScreen({ onStart }: { onStart: (players: Player[]) => void }) {
  const [players, setPlayers] = useState<Player[]>([
    { name: "Joueur 1 (hôte)", word: "" },
    { name: "Joueur 2", word: "" },
    { name: "Joueur 3", word: "" },
  ]);

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, { name: `Joueur ${players.length + 1}`, word: "" }]);
    }
  };

  const removePlayer = (i: number) => {
    if (players.length > 3) setPlayers(players.filter((_, idx) => idx !== i));
  };

  const updatePlayer = (i: number, field: keyof Player, value: string) => {
    setPlayers(players.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };

  const canStart = players.every((p) => p.name.trim() && p.word.trim());

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕵️</div>
          <h1 className="text-3xl font-bold text-white">Undercover</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Entre les mots confidentiels de chaque joueur pour lancer la partie
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-3">
          {players.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none"
                placeholder={`Nom joueur ${i + 1}`}
                value={p.name}
                onChange={(e) => updatePlayer(i, "name", e.target.value)}
              />
              <input
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none"
                placeholder="Mot secret"
                value={p.word}
                onChange={(e) => updatePlayer(i, "word", e.target.value)}
              />
              {players.length > 3 && (
                <button
                  onClick={() => removePlayer(i)}
                  className="text-gray-500 hover:text-red-400 text-lg leading-none px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addPlayer}
            disabled={players.length >= 8}
            className="w-full py-2 text-sm text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Ajouter un joueur
          </button>
        </div>

        <button
          onClick={() => onStart(players)}
          disabled={!canStart}
          className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
        >
          🎭 Lancer la partie
        </button>
      </div>
    </div>
  );
}

function GameScreen({ players, onReset }: { players: Player[]; onReset: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (content: string, history: Message[]) => {
    setLoading(true);
    const newHistory: Message[] = [...history, { role: "user", content }];
    setMessages(newHistory);

    try {
      const res = await fetch("/api/referee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (!res.ok) throw new Error("API error");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: text };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Erreur de connexion à l'arbitre." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!started) {
      setStarted(true);
      const wordList = players
        .map((p, i) => `Joueur ${i + 1} (${p.name}) : "${p.word}"`)
        .join("\n");
      const firstMessage = `[CONFIDENTIEL — ARBITRE SEULEMENT]\nMots des joueurs :\n${wordList}\n\nIdentifie l'undercover (le mot différent), garde-le secret, et lance la partie avec un message dramatique en invitant le Joueur 1 (${players[0].name}) à donner son premier indice.`;
      sendMessage(firstMessage, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    sendMessage(text, messages);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕵️</span>
          <span className="font-semibold text-white">Undercover — Arbitre</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition"
        >
          Nouvelle partie
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5">
                🎭
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-gray-800 text-gray-100 rounded-tl-sm"
              }`}
            >
              {m.content || (
                <span className="animate-pulse text-gray-400">...</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            className="flex-1 bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none"
            placeholder='Ex: "J1: café, J2: expresso, J3: café" — ou "on vote J2"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-medium transition"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [players, setPlayers] = useState<Player[] | null>(null);

  if (!players) {
    return <SetupScreen onStart={setPlayers} />;
  }

  return <GameScreen players={players} onReset={() => setPlayers(null)} />;
}
