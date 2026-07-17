"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, PlusCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hola 👋 Puedes preguntarme sobre tu historial de entrenamientos. Por ejemplo: «¿cuánto levanté la última vez en sentadilla?» o «¿cuántas sesiones hice esta semana?»",
};

const SUGGESTIONS = [
  "¿Cuánto levanté en sentadilla la última vez?",
  "¿Cuántas sesiones hice esta semana?",
  "¿Cuál es mi récord en press banca?",
  "Muéstrame mi progresión en los últimos 30 días",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
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

  function resetChat() {
    setMessages([WELCOME]);
    setInput("");
    inputRef.current?.focus();
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
    <div className="flex h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-5rem)] gap-6">
      {/* Panel lateral desktop — como el diseño de Stitch */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-6 py-1">
        <button
          onClick={resetChat}
          className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-3 px-4 text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <PlusCircle size={16} />
          Nuevo Chat
        </button>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono font-semibold text-on-surface-variant/70 uppercase tracking-widest px-2 mb-2">
            Sugerencias
          </p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="flex items-start gap-2.5 p-3 rounded-lg text-left text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            >
              <MessageCircle size={14} className="shrink-0 mt-0.5 text-on-surface-variant/60" />
              <span className="leading-snug">{s}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Lienzo de chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-3 min-h-0">
          {/* Cabecera Coach IA */}
          <section className="flex flex-col items-center justify-center py-6 shrink-0">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3">
              <Bot size={26} className="text-inverse-primary" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">Coach IA</h1>
            <p className="text-xs text-on-surface-variant">Pregunta sobre tu historial en tiempo real</p>
          </section>

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1 max-w-[85%]",
                m.role === "user" ? "self-end items-end" : "self-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-outline-variant/60 text-on-surface rounded-tl-md"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="self-start bg-white border border-outline-variant/60 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <span className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-inverse-primary animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          )}

          {/* Sugerencias en móvil */}
          {showSuggestions && (
            <div className="flex flex-col gap-2 mt-1 lg:hidden">
              <p className="text-xs text-on-surface-variant/80 font-medium px-1 flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" />
                Sugerencias
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm text-on-surface-variant bg-white border border-outline-variant/60 rounded-xl px-4 py-2.5 hover:border-accent/40 hover:text-on-surface hover:bg-accent-container/30 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input — pastilla con botón circular */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-3 shrink-0 border-t border-outline-variant/60">
          <label htmlFor="chat-question" className="sr-only">
            Pregunta sobre tu historial de entrenamientos
          </label>
          <textarea
            id="chat-question"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-white border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 shadow-sm leading-relaxed max-h-32"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Enviar pregunta"
            className="w-11 h-11 rounded-full bg-primary hover:bg-primary/85 flex items-center justify-center disabled:opacity-30 transition-all duration-200 active:scale-95 shadow-sm shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Send size={15} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
