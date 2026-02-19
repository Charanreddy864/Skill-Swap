import React, { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import { useSelector } from "react-redux";

const ChatWindow = ({ activeChatFriend, setChatWindowOpen, setActiveChatFriend }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((state) => state);
  const messagesEndRef = useRef(null);

  const closeChatWindow = () => {
    setChatWindowOpen(false);
    setActiveChatFriend(null);
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() === "" || !activeChatFriend) return;

    // Emit message via socket
    socket.emit("sendMessage", {
      fromUserId: currentUser._id,
      toUserId: activeChatFriend._id,
      message: message.trim(),
    });

    // Optimistically add message to UI
    const newMessage = {
      _id: Date.now().toString(), // Temporary ID
      sender: {
        _id: currentUser._id,
        userName: currentUser.userName
      },
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Fetch messages for the active conversation
  useEffect(() => {
    if (!activeChatFriend?._id) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/chat/messages/${activeChatFriend._id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          
          // Mark messages as read when opening chat
          if (data.conversationId) {
            socket.emit('markMessagesAsRead', {
              conversationId: data.conversationId,
              userId: currentUser._id
            });
          }
        } else {
          console.error('Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeChatFriend]);

  // Listen for incoming messages via socket
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log("Received message in chat window:", data);
      
      // Handle different data structures
      const newMessage = data.message || data;
      
      // Only add message if it's from the active chat friend
      if (newMessage.sender?._id === activeChatFriend?._id || 
          newMessage.from === activeChatFriend?._id) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        // Mark this specific message as read immediately since chat window is open
        socket.emit('markMessageAsRead', { messageId: newMessage._id });
      }
    };

    // Listen to multiple possible event names
    socket.on("receiveMessage", handleNewMessage);
    socket.on("newMessage", handleNewMessage);
    socket.on("message", handleNewMessage);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
      socket.off("message", handleNewMessage);
    };
  }, [activeChatFriend]);

  return (
    <div className="w-80 h-[450px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-900/90 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
            {activeChatFriend?.userName?.charAt(0) || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold">{activeChatFriend?.userName || "User"}</p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>

        <button
          onClick={closeChatWindow}
          className="text-white text-lg hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white/0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 && activeChatFriend ? (
          <>
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.sender?._id === activeChatFriend._id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`text-sm p-2 rounded-lg max-w-[70%] ${
                    msg.sender?._id === activeChatFriend._id
                      ? 'bg-gray-200/80'
                      : 'bg-blue-500/80 text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-3 border-t flex gap-2 bg-white/90">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200" 
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
