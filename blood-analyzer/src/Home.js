import "./Home.css";
import "./ChatBot.css";
import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export default function Home() {
  const [files, setFiles] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chatbot state
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
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const clearFiles = () => {
    setFiles([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if API key is configured
    if (!API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "❌ Error: API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }

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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Filter messages to start from the first user message (Gemini API requires first message to be from user)
      const firstUserIndex = messages.findIndex((msg) => msg.role === "user");
      const conversationMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : [];

      const chatHistory = conversationMessages.map((msg) => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
        systemInstruction:
          "You are BeFit Assistant, a friendly and knowledgeable health and fitness AI. You help users understand their blood reports, suggest workout plans, provide nutrition advice, and answer general health questions. Keep responses concise, helpful, and easy to understand. Always remind users to consult healthcare professionals for serious medical concerns.",
      });

      const result = await chat.sendMessage(userMessage.text);
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
      const errorStr = JSON.stringify(error);
      console.error("Gemini API error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        errorString: errorStr,
        fullError: error,
      });
      console.log("Full error object:", error);
      
      let errorMessage = error.message || "Sorry, I'm having trouble connecting right now. Please check your API key or try again later.";
      
      // Provide specific error messages for common issues
      const lowerError = errorStr.toLowerCase();
      if (lowerError.includes("401") || lowerError.includes("invalid") || lowerError.includes("unauthorized")) {
        errorMessage = "❌ API Key Error - Your API key may be invalid or expired. Check: https://console.cloud.google.com/";
      } else if (lowerError.includes("429")) {
        errorMessage = "⏳ Rate limit exceeded - Please wait a moment and try again.";
      } else if (lowerError.includes("cors")) {
        errorMessage = "🔒 CORS error - This may require backend configuration.";
      } else if (lowerError.includes("network")) {
        errorMessage = "🌐 Network error - Check your internet connection.";
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errorMessage,
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

  return (
    <div className="home-container">
      
      <nav className="navbar">
        <h1 className="logo">BeFit</h1>
        <div className="nav-links">
          <span>About us</span>
          <span>Help & Support</span>
          <span>Profile</span>
        </div>
      </nav>

      <div className="home-body">

        <aside className="sidebar">
          <div className="sidebar-item active">Dashboard</div>
          <div className="sidebar-item">Todo Tracker</div>
        </aside>
        <main className="main-content">
          <h2>Upload Your Blood Report's</h2>
          <div className="card">
              <div className="upload-box" onDrop={handleDrop} onDragOver={handleDragOver}>
                <label className="drop-zone">
                  <span>Drop Report here, or click to upload</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange}/>
                </label>
                <ul className="preview">
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
              <button className="clear-btn" onClick={clearFiles} disabled={files.length===0}>Clear Files</button>
              <button className="analyze-btn">
              Analyze Report & Get Suggestion's
              </button>
          </div>
        </main>
      </div>

      <div className="bot-button" onClick={() => setIsChatOpen(!isChatOpen)}>
        <span className="material-icons-outlined">smart_toy</span>
      </div>

      {/* Chatbot */}
      {isChatOpen && (
        <div className="chatbot-overlay chatbot-open">
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
                <button onClick={() => setIsChatOpen(false)} title="Close chat">
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
      )}
    </div>
  );
}