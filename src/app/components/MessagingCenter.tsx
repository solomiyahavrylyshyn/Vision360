import { useState } from "react";
import "../../styles/messaging-center.css";

interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  initials: string;
  subtitle: string;
  unreadCount?: number;
  category: "Clients" | "Team" | "Requests" | "Archived";
  avatarColor?: string;
}

interface Message {
  id: string;
  text: string;
  time: string;
  isOutgoing: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "John Smith",
    preview: "Thanks, see you tomorrow!",
    time: "2m",
    initials: "JS",
    subtitle: "Client · (555) 123-4567",
    unreadCount: 2,
    category: "Clients",
  },
  {
    id: "2",
    name: "Maria Johnson",
    preview: "Can you send the invoice?",
    time: "18m",
    initials: "MJ",
    subtitle: "Client · (555) 234-5678",
    unreadCount: 1,
    category: "Clients",
  },
  {
    id: "3",
    name: "Team Chat",
    preview: "Job #089 assigned to Mike",
    time: "45m",
    initials: "TC",
    subtitle: "Internal · 4 members",
    category: "Team",
    avatarColor: "#7C3AED",
  },
  {
    id: "4",
    name: "Robert Lee",
    preview: "When can you come by?",
    time: "1h",
    initials: "RL",
    subtitle: "Client · (555) 345-6789",
    category: "Clients",
  },
  {
    id: "5",
    name: "New Request — Tom B.",
    preview: "Need a quote for AC repair",
    time: "4h",
    initials: "TR",
    subtitle: "Request · Pending",
    category: "Requests",
    avatarColor: "#059669",
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    text: "Hey, just wanted to confirm the appointment for tomorrow.",
    time: "10:14 AM",
    isOutgoing: false,
  },
  {
    id: "2",
    text: "Yes, we'll be there at 9 AM. Make sure the area is accessible.",
    time: "10:17 AM",
    isOutgoing: true,
  },
  {
    id: "3",
    text: "Thanks, see you tomorrow!",
    time: "10:19 AM",
    isOutgoing: false,
  },
];

interface MessagingCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagingCenter({ isOpen, onClose }: MessagingCenterProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All Messages");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const selectedConv = mockConversations.find((c) => c.id === selectedConvId);

  const getUnreadCount = (category: string) => {
    if (category === "All Messages") {
      return mockConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    }
    return 0;
  };

  const filteredConversations = mockConversations.filter((conv) => {
    // Filter by category
    const categoryMatch =
      activeFilter === "All Messages" || conv.category === activeFilter;
    
    // Filter by search
    const searchMatch =
      !searchQuery ||
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConvId(conv.id);
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In real app, send message here
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`messaging-center ${isOpen ? "open" : ""}`}>
      {/* Filter sidebar */}
      <div className="mc-filter-sidebar">
        <div className="mc-filter-header">
          <span className="mc-filter-title">Messages</span>
          <button className="mc-close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <nav className="mc-filter-nav">
          <button
            className={`mc-filter-item ${
              activeFilter === "All Messages" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("All Messages")}
          >
            All Messages
            {getUnreadCount("All Messages") > 0 && (
              <span className="mc-filter-badge">
                {getUnreadCount("All Messages")}
              </span>
            )}
          </button>
          <button
            className={`mc-filter-item ${
              activeFilter === "Clients" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("Clients")}
          >
            Clients
          </button>
          <button
            className={`mc-filter-item ${
              activeFilter === "Team" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("Team")}
          >
            Team
          </button>
          <button
            className={`mc-filter-item ${
              activeFilter === "Requests" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("Requests")}
          >
            Requests
          </button>
          <button
            className={`mc-filter-item ${
              activeFilter === "Archived" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("Archived")}
          >
            Archived
          </button>
        </nav>
      </div>

      {/* Conversations panel */}
      <div className="mc-conv-panel">
        <div className="mc-conv-topbar">
          <span className="mc-conv-topbar-title">{activeFilter}</span>
          <div className="mc-conv-topbar-actions">
            <button
              className="mc-icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <span className="material-icons">search</span>
            </button>
            <button className="mc-icon-btn">
              <span className="material-icons">filter_list</span>
            </button>
            <button className="mc-icon-btn">
              <span className="material-icons">group</span>
            </button>
          </div>
        </div>
        <div className={`mc-conv-search ${searchOpen ? "visible" : ""}`}>
          <div className="mc-search">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mc-conv-list">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`mc-conv-item ${
                selectedConvId === conv.id ? "active" : ""
              }`}
              onClick={() => handleSelectConv(conv)}
            >
              <div
                className={`mc-avatar ${
                  conv.category === "Team"
                    ? "team"
                    : conv.category === "Requests"
                    ? "request"
                    : ""
                }`}
                style={conv.avatarColor ? { background: conv.avatarColor } : {}}
              >
                {conv.initials}
              </div>
              <div className="mc-conv-body">
                <div className="mc-conv-name">{conv.name}</div>
                <div className="mc-conv-preview">{conv.preview}</div>
              </div>
              <div className="mc-conv-meta">
                <div className="mc-conv-time">{conv.time}</div>
                {conv.unreadCount && selectedConvId !== conv.id && (
                  <div className="mc-unread-badge">{conv.unreadCount}</div>
                )}
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#546478", fontSize: "14px" }}>
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="mc-main">
        {!selectedConv && (
          <div className="mc-empty">
            <span className="material-icons">chat_bubble_outline</span>
            <p>No conversation selected</p>
          </div>
        )}
        {selectedConv && (
          <div className="mc-chat visible">
            <div className="mc-chat-header">
              <div className="mc-chat-name">{selectedConv.name}</div>
              <div className="mc-chat-sub">{selectedConv.subtitle}</div>
            </div>
            <div className="mc-messages">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mc-msg ${msg.isOutgoing ? "outgoing" : ""}`}
                >
                  <div className="mc-msg-avatar">
                    {msg.isOutgoing ? "M" : selectedConv.initials}
                  </div>
                  <div className="mc-msg-wrap">
                    <div className="mc-msg-bubble">{msg.text}</div>
                    <div className="mc-msg-time">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mc-input-bar">
              <input
                type="text"
                className="mc-input-field"
                placeholder="Type a message…"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="mc-send-btn" onClick={handleSendMessage}>
                <span className="material-icons">send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
