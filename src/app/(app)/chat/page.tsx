"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Cuánto levanté en sentadilla la última vez?",
  "¿Cuántas sesiones hice esta semana?",
  "¿Cuál es mi récord en press banca?",
  "Muéstrame mi progresión en los últimos 30 días",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola 👋 Puedes preguntarme sobre tu historial de entrenamientos. Por ejemplo: «¿cuánto levanté la última vez en sentadilla?» o «¿cuántas sesiones hice esta semana?»",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const { answer } = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Lo siento, no pude procesar tu consulta en este momento." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
          <MessageCircle size={16} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Consultar IA</h1>
          <p className="text-xs text-slate-400">Pregunta sobre tu historial</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5 max-w-[88%]",
              m.role === "user" ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-emerald-400" />
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-slate-900 text-white rounded-tr-sm"
                  : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="self-start flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-emerald-400" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs text-slate-400 font-medium px-1">Sugerencias</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm text-slate-600 bg-white border border-slate-100 rounded-xl px-4 py-2.5 hover:border-emerald-200 hover:text-slate-900 hover:bg-emerald-50/50 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-3 shrink-0 border-t border-slate-100">
        <label htmlFor="chat-question" className="sr-only">
          Pregunta sobre tu historial de entrenamientos
        </label>
        <textarea
          id="chat-question"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 shadow-sm leading-relaxed max-h-32"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar pregunta"
          className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 transition-colors shadow-sm shrink-0"
        >
          <Send size={15} className="text-white" />
        </button>
      </form>
    </div>
  );
}
