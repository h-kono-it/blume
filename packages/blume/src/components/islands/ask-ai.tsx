import { useState } from "react";
import type { FormEvent } from "react";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

let idCounter = 0;
const nextId = (): number => {
  idCounter += 1;
  return idCounter;
};

const AskAI = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) {
      return;
    }

    const userMessage: ChatMessage = {
      content: question,
      id: nextId(),
      role: "user",
    };
    const history = [...messages, userMessage];
    const assistant: ChatMessage = {
      content: "",
      id: nextId(),
      role: "assistant",
    };
    setMessages([...history, assistant]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/ask", {
        body: JSON.stringify({
          messages: history.map((m) => ({ content: m.content, role: m.role })),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let done = false;
        while (!done) {
          // oxlint-disable-next-line no-await-in-loop -- sequential stream reads
          const chunk = await reader.read();
          ({ done } = chunk);
          if (chunk.value) {
            assistant.content += decoder.decode(chunk.value);
            setMessages((current) => [
              ...current.slice(0, -1),
              { ...assistant },
            ]);
          }
        }
      }
    } catch {
      assistant.content = "Sorry, something went wrong.";
      setMessages((current) => [...current.slice(0, -1), { ...assistant }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="blume-ask">
      <button
        className="blume-search-button"
        onClick={() => setOpen(!open)}
        type="button"
      >
        Ask AI
      </button>
      {open && (
        <div className="blume-ask__panel">
          <div className="blume-ask__messages">
            {messages.length === 0 && (
              <p className="blume-ask__hint">Ask a question about the docs.</p>
            )}
            {messages.map((message) => (
              <div
                className={`blume-ask__message blume-ask__message--${message.role}`}
                key={message.id}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form className="blume-ask__form" onSubmit={send}>
            <input
              aria-label="Ask a question"
              className="blume-search-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              value={input}
            />
            <button
              className="blume-search-button"
              disabled={busy}
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AskAI;
