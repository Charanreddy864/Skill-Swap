import React, { useEffect, useState, useMemo, useCallback } from "react";
import PeerSuggestions from "./peer-suggestions";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import FriendsList from "./friendsList";
import ChatWindow from "./chatWindow";
import ChatPage from "./chatPage";

const Dashboard = () => {
  const user = useSelector((state) => state);
  const currentUserId = user._id;
  const navigate = useNavigate();

  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [animating, setAnimating] = useState({}); // { reqId: "accepted" | "declined" }
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [chatPageOpen, setChatPageOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [activeConversationFriend, setActiveConversationFriend] = useState(null); // For chatPage conversations
  const [unreadCounts, setUnreadCounts] = useState({}); // { friendId: count } - Single source of truth
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [peerSuggestions, setPeerSuggestions] = useState([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Memoized fetch functions for performance
  const fetchFriendRequests = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/users/friend-requests", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const requests = await res.json();
      setFriendRequests(requests);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/users/friends", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const friends = await res.json();
      setFriends(friends);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/conversations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const counts = {};
        if (data.conversations) {
          data.conversations.forEach(conv => {
            const otherParticipant = conv.participants.find(p => p._id !== currentUserId);
            if (otherParticipant && conv.unreadCount) {
              counts[otherParticipant._id] = conv.unreadCount;
            }
          });
        }
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, [currentUserId]);

  // Fetch peer suggestions (moved from child component)
  const fetchPeerSuggestions = useCallback(async () => {
    setPeersLoading(true);
    try {
      const response = await fetch("http://localhost:8000/users/peer-suggestions", {
        method: 'GET',
        credentials: "include"
      });
      const data = await response.json();
      setPeerSuggestions(data.peerSuggestions || []);
    } catch (error) {
      console.error("Error fetching peer suggestions:", error);
    } finally {
      setPeersLoading(false);
    }
  }, []);

  // Search users (moved from child component)
  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setPeersLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:8000/users/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          credentials: "include"
        }
      );
      const data = await response.json();
      setPeerSuggestions(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setPeersLoading(false);
    }
  }, []);

  // Accept friend request
  const acceptFriendRequest = (reqId) => {
    setAnimating((prev) => ({ ...prev, [reqId]: "accepted" }));

    socket.emit("updateFriendRequest", {
      requestId: reqId,
      status: "accepted",
    });
  };

  const openChatPage = () => {
    setChatPageOpen(true);
  };

  // Decline friend request
  const declineFriendRequest = (reqId) => {
    setAnimating((prev) => ({ ...prev, [reqId]: "declined" }));

    socket.emit("updateFriendRequest", {
      requestId: reqId,
      status: "rejected",
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
    fetchUnreadCounts();
    fetchPeerSuggestions();
  }, [fetchFriendRequests, fetchFriends, fetchUnreadCounts, fetchPeerSuggestions]);

  // Socket listeners
useEffect(() => {
  socket.emit("registerUser", currentUserId);

  // When a new friend request arrives
  socket.on("newFriendRequest", (newRequest) => {
    setFriendRequests((prev) => [...prev, newRequest]);
  });

  // When a request is accepted by anyone (sender or receiver)
  socket.on("friendRequestAccepted", (updated) => {
    const friendId =
      updated.from._id === currentUserId ? updated.to : updated.from;

    // 🔥 Add newly accepted friend immediately
    setFriends((prev) => [...prev, friendId]);
  });

socket.on("friendRequestUpdated", (updated) => {
  setFriendRequests((prev) =>
    prev.filter((req) => req._id !== updated._id)
  );
});

  // Handle incoming messages - update unread counts
  const handleReceiveMessage = (data) => {
    const newMessage = data.message || data;
    const senderId = newMessage.sender?._id || newMessage.from;
    
    // Only increment if message is not from current user AND not from active chat/conversation friend
    if (senderId && 
        senderId !== currentUserId && 
        senderId !== activeChatFriend?._id &&
        senderId !== activeConversationFriend) {
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));
    }
    
    // Always acknowledge message delivery
    if (senderId && senderId !== currentUserId) {
      socket.emit('messageDelivered', { messageId: newMessage._id });
    }
  };

  // Handle messages marked as read - reset unread count
  const handleMessagesMarkedAsRead = (data) => {
    console.log('Messages marked as read:', data);
    if (data.friendId) {
      setUnreadCounts(prev => ({
        ...prev,
        [data.friendId]: 0
      }));
    }
  };

  socket.on("receiveMessage", handleReceiveMessage);
  socket.on("newMessage", handleReceiveMessage);
  socket.on("message", handleReceiveMessage);
  socket.on("messagesMarkedAsRead", handleMessagesMarkedAsRead);

  return () => {
    socket.off("newFriendRequest");
    socket.off("friendRequestUpdated");
    socket.off("friendRequestAccepted");
    socket.off("receiveMessage", handleReceiveMessage);
    socket.off("newMessage", handleReceiveMessage);
    socket.off("message", handleReceiveMessage);
    socket.off("messagesMarkedAsRead", handleMessagesMarkedAsRead);
  };
}, [currentUserId, activeChatFriend, activeConversationFriend]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchUsers(searchQuery);
      } else if (isSearching) {
        // If search cleared, reload peer suggestions
        setIsSearching(false);
        fetchPeerSuggestions();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSearching, searchUsers, fetchPeerSuggestions]);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem('user');
        // Redirect to landing page
        navigate('/');
      } else {
        alert('Failed to logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Error during logout');
    }
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">SkillSwap</span>
        </div>
        <input
          type="text"
          placeholder="Search peers or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/3 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg"
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center rounded-full font-bold text-sm">
                {user.userName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="font-medium text-gray-700">{user.userName}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-200">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3 text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </button>
              <hr className="my-2 border-gray-200" />
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors duration-200 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Section */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <PeerSuggestions 
            peerSuggestions={peerSuggestions}
            loading={peersLoading}
            isSearching={isSearching}
            searchQuery={searchQuery}
            onFriendRequestSent={() => {
              fetchFriendRequests();
              fetchPeerSuggestions();
            }}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto shadow-lg">
          {/* Friend Requests */}
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Friend Requests
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-3">
              {friendRequests.length > 0 ? (
                friendRequests.map((req) => (
                  <div
                    key={req._id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 border
                      ${
                        animating[req._id] === "accepted"
                          ? "bg-green-50 border-green-200 opacity-50"
                          : animating[req._id] === "declined"
                          ? "bg-red-50 border-red-200 opacity-50"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }
                    `}
                  >
                    <span className="font-medium text-gray-800">{req.from.userName}</span>
                    <div className="flex gap-2">
                      {/* Accept */}
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                        onClick={() => acceptFriendRequest(req._id)}
                        title="Accept"
                      >
                        ✓
                      </button>
                      {/* Decline */}
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                        onClick={() => declineFriendRequest(req._id)}
                        title="Decline"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
              )}
            </div>
          </div>

          {/* Friends List */}
          <FriendsList 
            friends={friends} 
            setChatWindowOpen={setChatWindowOpen} 
            setActiveChatFriend={setActiveChatFriend} 
            activeChatFriend={activeChatFriend}
            activeConversationFriend={activeConversationFriend}
            unreadCounts={unreadCounts}
            setUnreadCounts={setUnreadCounts}
          />
          
          {/* Chat Button */}
          <button 
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-white text-2xl rounded-full shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center z-30"
            onClick={() => openChatPage()}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>

        {/* Chat Page - Slides from right (inside MAIN) */}
        <div
          className={`
            absolute right-0 top-0 bottom-0 w-1/2 bg-white shadow-2xl
            transform transition-transform duration-300 ease-in-out z-50
            overflow-hidden
            ${chatPageOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col overflow-hidden">
            {/* Chat Page Content */}
            <div className="flex-1 overflow-hidden">
              <ChatPage 
                setChatPageOpen={setChatPageOpen} 
                chatPageOpen={chatPageOpen}
                setActiveConversationFriend={setActiveConversationFriend}
                unreadCounts={unreadCounts}
              />
            </div>
          </div>
        </div>

        {/* Overlay for Chat Page - only covers MAIN area */}
        {chatPageOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-40 pointer-events-auto"
            onClick={() => setChatPageOpen(false)}
          ></div>
        )}
      </div>

{/* Chat Window Popup */}
<div
  className={`
    fixed z-[60] bottom-6 right-6
    transition-all duration-300 ease-in-out
    ${
      chatWindowOpen
        ? "scale-100 opacity-100 pointer-events-auto"
        : "scale-0 opacity-0 pointer-events-none"
    }
  `}
  style={{ transformOrigin: "bottom right" }}
>
  <ChatWindow
    setChatWindowOpen={setChatWindowOpen}
    setActiveChatFriend={setActiveChatFriend}
    activeChatFriend={activeChatFriend}
  />
</div>

    </div>
  );
};

export default Dashboard;