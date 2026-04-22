import { useState } from "react";

interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedTopics = [
  "Get paid faster",
  "Increase efficiency",
  "Win more work",
];

export function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        text: inputValue,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputValue("");

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          text: "Thank you for your question. I'm here to help you optimize your field service operations. How can I assist you further?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputValue(topic);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 top-20 w-[420px] h-[calc(100vh-112px)] bg-white border border-[#DDE3EE] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[4000] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EE] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>
            Vision360 AI
          </h2>
          <span
            className="px-2 py-0.5 bg-[#EBF2FC] text-[#4A6FA5] text-[11px] rounded-md"
            style={{ fontWeight: 600 }}
          >
            Beta
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#546478] hover:bg-[#F5F7FA] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "20px" }}>
            close
          </span>
        </button>
      </div>

      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="px-5 py-6 border-b border-[#DDE3EE] flex-shrink-0">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-white" style={{ fontSize: "18px" }}>
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="text-[15px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>
                Hello, I'm Vision360 AI.
              </h3>
              <p className="text-[14px] text-[#546478] leading-relaxed">
                I'm an AI-powered virtual assistant and business coach. I've been
                trained to help you succeed at running a field service business.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 600 }}>
              You can ask me about things like...
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleSuggestedTopic(topic)}
                  className="px-3 py-2 bg-white border border-[#4A6FA5] text-[#4A6FA5] rounded-lg text-[13px] hover:bg-[#EBF2FC] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "assistant"
                      ? "bg-[#4A6FA5]"
                      : "bg-[#8899AA]"
                  }`}
                >
                  <span className="material-icons text-white" style={{ fontSize: "16px" }}>
                    {message.type === "assistant" ? "auto_awesome" : "person"}
                  </span>
                </div>
                <div
                  className={`flex-1 px-4 py-3 rounded-lg ${
                    message.type === "assistant"
                      ? "bg-[#F5F7FA] text-[#1A2332]"
                      : "bg-[#4A6FA5] text-white"
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[#8899AA]">
              <span className="material-icons mb-2" style={{ fontSize: "48px" }}>
                chat_bubble_outline
              </span>
              <p className="text-[14px]">Start a conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-5 py-4 border-t border-[#DDE3EE] flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              rows={1}
              className="w-full px-4 py-3 pr-10 border border-[#DDE3EE] rounded-lg text-[14px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none resize-none transition-all focus:border-[#4A6FA5] focus:ring-1 focus:ring-[#4A6FA5]/20"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button className="absolute right-3 bottom-3 text-[#8899AA] hover:text-[#4A6FA5] transition-colors">
              <span className="material-icons" style={{ fontSize: "20px" }}>
                attach_file
              </span>
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="w-11 h-11 bg-[#4A6FA5] rounded-lg flex items-center justify-center text-white hover:bg-[#3d5a85] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="material-icons" style={{ fontSize: "20px" }}>
              arrow_upward
            </span>
          </button>
        </div>
        <p className="text-[11px] text-[#8899AA] mt-2 px-1">
          Vision360 AI is experimental. Results may not be accurate.
        </p>
      </div>
    </div>
  );
}
