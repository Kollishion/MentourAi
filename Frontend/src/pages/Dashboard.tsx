import { useState, useRef, useEffect } from "react";
import Profile from "./Profile";
import type { DiagnoseResponse } from "../lib/ai";
interface Message {
    id: string;
    role: "user" | "assistant";

    content: string;

    type?:
        | "text"
        | "question"
        | "diagnosis"
        | "tutoring";

    payload?: DiagnoseResponse;
}
interface Conversation {
  id: string;
  title: string;
}

const Dashboard = () => {
  const [conversations] = useState<Conversation[]>([
    { id: "1", title: "New chat" },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [stage,setStage]=useState<"idle"|"awaitingAnswer"|"processing">("idle");
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "This is a placeholder response." },
      ]);
    }, 500);
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
                activeId === c.id
                  ? "bg-surface-2 text-text"
                  : "text-text-muted hover:bg-surface-2"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Profile trigger pinned at bottom */}
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
              <p className="text-text-subtle text-sm">Start a conversation</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-text"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-text placeholder:text-text-subtle text-sm max-h-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-primary hover:bg-secondary transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
