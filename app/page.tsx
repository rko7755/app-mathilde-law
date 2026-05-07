"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function SetupScreen({ onStart }: { onStart: (word: string) => void }) {
  const [word, setWord] = useState("");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤫</div>
          <h1 className="text-3xl font-bold text-white">Undercover</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Entre ton mot secret pour recevoir de l&apos;aide pendant la partie
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Ton mot secret
          </label>
          <input
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none text-base"
            placeholder="ex: café"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && word.trim() && onStart(word.trim())}
            autoFocus
          />
          <p className="text-xs text-gray-600 mt-2">
            Visible uniquement sur ton téléphone 👀
          </p>
        </div>

        <button
          onClick={() => onStart(word.trim())}
          disabled={!word.trim()}
          className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
        >
          Jouer 🕵️
        </button>
      </div>
    </div>
  );
}

function GameScreen({ word, onReset }: { word: string; onReset: () => void }) {
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
        { role: "assistant", content: "❌ Erreur de connexion." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!started) {
      setStarted(true);
      sendMessage(`Mon mot secret est : "${word}". Aide-moi à jouer !`, []);
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
          <span className="text-xl">🤫</span>
          <span className="font-semibold text-white">Coach Undercover</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
            mot : <span className="text-indigo-400 font-medium">{word}</span>
          </span>
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition"
          >
            Nouvelle partie
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5">
                🤫
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
            placeholder='Ex: "les autres ont dit soleil, mer, sable" ou "aide-moi à voter"'
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
  const [word, setWord] = useState<string | null>(null);

  if (!word) {
    return <SetupScreen onStart={setWord} />;
  }

  return <GameScreen word={word} onReset={() => setWord(null)} />;
}
