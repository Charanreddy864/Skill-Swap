import React, { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import { useSelector } from "react-redux";

const ConversationView = ({ conversation, onBack, setActiveConversationFriend }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const currentUser = useSelector((state) => state);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUser._id
  ) || conversation.participants[0];

  // Set active conversation friend when mounting
  useEffect(() => {
    if (setActiveConversationFriend) {
      setActiveConversationFriend(otherParticipant._id);
    }
    
    // Clear on unmount
    return () => {
      if (setActiveConversationFriend) {
        setActiveConversationFriend(null);
      }
    };
  }, [otherParticipant._id, setActiveConversationFriend]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages for this conversation
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/chat/messages/${otherParticipant._id}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          
          // Mark messages as read when opening conversation
          if (data.conversationId) {
            socket.emit('markMessagesAsRead', {
              conversationId: data.conversationId,
              userId: currentUser._id
            });
          }
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [otherParticipant._id]);

  // Listen for incoming messages and typing indicators via socket
  useEffect(() => {
    const handleNewMessage = (data) => {
      // Handle different data structures
      const newMessage = data.message || data;
      console.log("📨 Received in chat:", newMessage._id);
      
      // Only add message if it's from the current conversation
      if (newMessage.sender?._id === otherParticipant._id || 
          newMessage.from === otherParticipant._id) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        // Mark this specific message as read since conversation is open and visible
        socket.emit('markMessageAsRead', { 
          messageId: newMessage._id,
          userId: currentUser._id 
        });
      }
    };

    const handleTyping = (data) => {
      if (data.userId === otherParticipant._id && data.isTyping) {
        setIsTyping(true);
        // Auto-clear typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      } else if (data.userId === otherParticipant._id) {
        setIsTyping(false);
      }
    };

    const handleUserStatus = (data) => {
      if (data.userId === otherParticipant._id) {
        setIsOnline(data.online);
      }
    };

    // Listen to multiple possible event names
    socket.on("receiveMessage", handleNewMessage);
    socket.on("newMessage", handleNewMessage);
    socket.on("message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("userStatus", handleUserStatus);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
      socket.off("message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("userStatus", handleUserStatus);
    };
  }, [otherParticipant._id]);

  // Send message
  const sendMessage = () => {
    if (message.trim() === "") return;

    // Emit message via socket
    socket.emit("sendMessage", {
      fromUserId: currentUser._id,
      toUserId: otherParticipant._id,
      message: message.trim(),
    });

    // Optimistically add message to UI
    const newMessage = {
      _id: Date.now().toString(),
      sender: {
        _id: currentUser._id,
        userName: currentUser.userName,
      },
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  // Handle typing indicator
  const handleTyping = () => {
    // Emit typing indicator
    socket.emit("typing", {
      toUserId: otherParticipant._id,
      isTyping: true,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        toUserId: otherParticipant._id,
        isTyping: false,
      });
    }, 1000);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 text-xl transition-colors"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
          {otherParticipant?.userName?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">
            {otherParticipant?.userName || "Unknown User"}
          </h3>
          <p className="text-xs text-blue-100">
            {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg) => {
              const isCurrentUser = msg.sender._id === currentUser._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isCurrentUser
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <span
                      className={`text-xs mt-1 block ${
                        isCurrentUser ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ConversationView;
