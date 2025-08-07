import { useState, useEffect, useRef } from "react";
import "./App.css";
import { io } from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const adjustTextareaHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          120
        )}px`;
      }
    };
    adjustTextareaHeight();
  }, [inputMessage]);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnectionStatus("connected");
    });

    socketInstance.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socketInstance.on("connect_error", () => {
      setConnectionStatus("error");
    });

    socketInstance.on("ai-message-response", (response) => {
      setIsTyping(false);
      const newMessage = {
        id: Date.now() + 1,
        text: response.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sender: "assistant",
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    socketInstance.on("typing-indicator", () => {
      setIsTyping(true);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim() === "" || !socket) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit("ai-message", inputMessage);
    setIsTyping(true);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500";
      case "connecting":
        return "bg-amber-500";
      case "disconnected":
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="chat-container">
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="chat-title">AI Assistant</div>
          </div>
          <div className={`chat-status ${getStatusColor()}`}>
            {connectionStatus.charAt(0).toUpperCase() +
              connectionStatus.slice(1)}
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>Start a conversation</h3>
              <p>Ask me anything or share your thoughts</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.sender === "user"
                    ? "user-message"
                    : "assistant-message"
                }`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.sender === "user" ? "You" : "Assistant"}
                  </span>
                  <span className="message-timestamp">{message.timestamp}</span>
                </div>
                <div className="message-content">{message.text}</div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="message assistant-message typing-indicator">
              <div className="message-header">
                <span className="message-sender">Assistant</span>
              </div>
              <div className="typing-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            ref={textareaRef}
            className="message-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={inputMessage.trim() === ""}
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
