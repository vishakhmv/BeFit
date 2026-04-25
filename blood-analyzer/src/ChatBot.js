import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./ChatBot.css";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export default function ChatBot({ isOpen, onClose, reportData }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I'm your BeFit personal assistant. I can help analyze your health reports, suggest workout plans, or answer nutrition questions. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);

      let systemInstruction =
        "You are BeFit Assistant, a friendly and knowledgeable health and fitness AI. You help users understand their blood reports, suggest workout plans, provide nutrition advice, and answer general health questions. Keep responses concise, helpful, and easy to understand. Always remind users to consult healthcare professionals for serious medical concerns.";

      if (reportData?.results?.length) {
        const reportSummary = reportData.results
          .map((r) => `${r.name}: ${r.value} (${r.status})`)
          .join(", ");

        systemInstruction += `\n\nThe user has already uploaded a blood report in this app. Use this exact report data when answering report-related questions: ${reportSummary}. Do not say you don't have access to the report unless the user asks outside this uploaded data.`;
      }
      
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction,
      });

      // Build conversation history for context (keeping our .slice(1) fix!)
      const chatHistory = messages.slice(1).map((msg) => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      // 2. startChat is now clean and only handles the history and config
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        }
      });

      const result = await chat.sendMessage(userMessage.text);
      // ... the rest of your code stays exactly the same
      const response = await result.response;
      const botText = response.text();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, I'm having trouble connecting right now. Please check your API key or try again later.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "bot",
        text: "Hello! I'm your BeFit personal assistant. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className={`chatbot-overlay ${isOpen ? "chatbot-open" : ""}`}>
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar">
              <span className="material-icons-outlined">smart_toy</span>
            </div>
            <div>
              <h3 className="chatbot-title">BeFit Assistant</h3>
              <div className="chatbot-status">
                <span className="status-dot"></span>
                <p>Online</p>
              </div>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button onClick={resetChat} title="Reset chat">
              <span className="material-icons-outlined">refresh</span>
            </button>
            <button onClick={onClose} title="Close chat">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages chat-scroll">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.role === "user" ? "message-user" : "message-bot"}`}
            >
              {msg.role === "bot" && (
                <div className="msg-avatar bot-avatar">
                  <span className="material-icons-outlined">smart_toy</span>
                </div>
              )}
              <div className="msg-content">
                <div
                  className={`msg-bubble ${
                    msg.role === "user" ? "user-bubble" : "bot-bubble"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="msg-time">{msg.time}</span>
              </div>
              {msg.role === "user" && (
                <div className="msg-avatar user-avatar">
                  <span className="material-icons-outlined">person</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="message-row message-bot">
              <div className="msg-avatar bot-avatar">
                <span className="material-icons-outlined">smart_toy</span>
              </div>
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <form className="chatbot-form" onSubmit={sendMessage}>
            <div className="chatbot-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
              <span className="material-icons-outlined">send</span>
            </button>
          </form>
          <p className="chatbot-disclaimer">
            BeFit Assistant can make mistakes. Verify important health information.
          </p>
        </div>
      </div>
    </div>
  );
}
