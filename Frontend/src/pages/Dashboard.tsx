import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Profile from "./Profile";
import TutorCard from "../components/TutorCard";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthStore } from "../store/AuthContext.tsx";
import type { TutorResponse } from "../lib/ai";
import axios from "axios";
import { API } from "../lib/api";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "tutoring" | "diagnostic-prompt";
  tutor?: TutorResponse;
  concept?: string;
  badge?: string;
}

interface Conversation {
  id: string;
  title: string;
}

const CONCEPT_MAP: Record<string, string> = {
  "Explain recursion like I'm a beginner.": "recursion",
  "Teach me dynamic programming.": "dynamic programming",
  "Explain binary trees.": "binary trees",
  "Teach linked lists.": "linked lists",
};

const PROMPT_SUGGESTIONS = [
  { label: "Explain Recursion", prompt: "Explain recursion like I'm a beginner." },
  { label: "Dynamic Programming", prompt: "Teach me dynamic programming." },
  { label: "Binary Trees", prompt: "Explain binary trees." },
  { label: "Linked Lists", prompt: "Teach linked lists." },
];

function extractConcept(prompt: string): string {
  return CONCEPT_MAP[prompt] ?? prompt;
}

const Dashboard = () => {
  const navigate = useNavigate();  
  const [conversations] = useState<Conversation[]>([{ id: "1", title: "New chat" }]);
  const [activeId, setActiveId] = useState("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function TypingIndicator() {
    return (
      <div className="flex gap-1">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    );
  }

  async function sendPrompt(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      setLoading(true);
      const res = await axios.post(API.AI.MENTOR, {
        student_id: useAuthStore.getState().user?.id,
        prompt: text,
      });

      const tutor: TutorResponse | null = res.data.tutoring ?? null;
      const canDiagnose = !tutor && res.data.mode === "chat";

      if (tutor) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "tutoring",
            tutor,
            content: "",
            badge: "Teaching",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "text",
            content: res.data.response,
            badge: res.data.mode === "diagnostic" ? "Review" : "Chat",
          },
        ]);
      }

      if (canDiagnose) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "diagnostic-prompt",
            content: "Ready to check your understanding?",
            concept: extractConcept(text),
            badge: "Diagnostic",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          type: "text",
          content: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    sendPrompt(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="h-screen flex bg-background text-text">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-3">
          <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary transition-colors text-white rounded-lg py-2.5 text-sm font-medium">
            + New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left truncate px-3 py-2 rounded-lg text-sm transition-colors ${
                activeId === c.id ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className="relative border-t border-border p-3">
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
              U
            </div>
            <span className="text-sm text-text-muted truncate">My account</span>
          </button>

          {showProfile && (
            <div className="absolute bottom-16 left-3 z-10">
              <Profile />
            </div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 text-center max-w-lg">
                <h2 className="text-3xl font-bold purple-fade-text">MentourAI</h2>
                <p className="text-text-muted">Ask a question or test your understanding.</p>

                <div className="grid grid-cols-2 gap-3 mt-10">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => sendPrompt(s.prompt)}
                      className="p-4 rounded-xl bg-surface border border-border hover:border-primary transition text-sm text-text"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-7 shadow-lg ${
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-text"
                    }`}
                  >
                    {m.role === "assistant" && m.badge && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                          {m.badge}
                        </span>
                        {m.content && (
                          <button
                            onClick={() => navigator.clipboard.writeText(m.content)}
                            className="text-xs text-text-muted hover:text-white"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    )}

                    {m.type === "tutoring" && m.tutor ? (
                      <TutorCard tutor={m.tutor} />
                    ) : m.type === "diagnostic-prompt" ? (
                      <div className="space-y-3">
                        <p>{m.content}</p>
                        <button onClick={() => navigate(`/learn?concept=${encodeURIComponent(m.concept ?? "")}`)}
                          className="bg-primary hover:bg-secondary transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium"
                        >
                          Start Diagnostic
                        </button>
                      </div>
                    ) : (
                      <article className="prose prose-invert max-w-none prose-p:my-2 prose-headings:text-white prose-strong:text-white prose-code:text-purple-300">
                        <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                      </article>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={loading ? "MentourAI is thinking..." : "Ask anything"}
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent resize-none outline-none placeholder:text-text-subtle text-sm max-h-40"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-secondary transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Thinking.." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
