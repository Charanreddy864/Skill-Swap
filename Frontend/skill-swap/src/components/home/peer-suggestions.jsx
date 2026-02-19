import React, { useState, useCallback } from "react";
import socket from '../../services/socket';
import { useSelector } from "react-redux";

// Helper function to convert level (1-10) to stars (0-5)
const getLevelStars = (level) => {
  const numLevel = Math.min(Math.max(parseInt(level) || 0, 0), 10);
  const stars = Math.round(numLevel / 2); // Convert 1-10 to 0-5 stars
  const filledStars = '★'.repeat(stars);
  const emptyStars = '☆'.repeat(5 - stars);
  return filledStars + emptyStars;
};

// Helper function to get two skills and their levels from the user object
const getPeerSkills = (user) => {
  if (!user.skillsHave || !Array.isArray(user.skillsHave) || user.skillsHave.length === 0) {
    return [];
  }
  return user.skillsHave.slice(0, 2).map(skillObj => ({
    name: skillObj.skill.skillName,
    level: skillObj.skillLevel
  }));
};

const PeerSuggestions = ({ 
  peerSuggestions = [], 
  loading = false,
  isSearching = false,
  searchQuery = "",
  onFriendRequestSent
}) => {
  const [expandedPeers, setExpandedPeers] = useState({}); // Track multiple expanded cards
  const [removedPeers, setRemovedPeers] = useState(new Set()); // Track removed peers for optimistic UI
  const user = useSelector((state) => state);

  // Memoized toggle function
  const toggleDetails = useCallback((peerId) => {
    setExpandedPeers(prev => ({
      ...prev,
      [peerId]: !prev[peerId]
    }));
  }, []);

  // Memoized add friend handler
  const handleAddFriend = useCallback((peerId) => {
    console.log(`Send friend request to peer ID: ${peerId}`);
    
    // Optimistically remove peer from UI
    setRemovedPeers(prev => new Set([...prev, peerId]));
    
    socket.emit("sendFriendRequest", {
      fromUserId: user._id,
      toUserId: peerId
    });
    
    // Notify parent to refresh
    if (onFriendRequestSent) {
      onFriendRequestSent();
    }
  }, [user._id, onFriendRequestSent]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg text-gray-500">Loading peer suggestions...</p>
      </div>
    );
  }

  // Filter out removed peers for optimistic UI
  const visiblePeers = peerSuggestions.filter(peer => !removedPeers.has(peer.user._id));

  return (
    <div className="p-6 bg-gray-50 min-h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {isSearching ? "Search Results" : "Peer Suggestions"}
      </h2>

      {searchQuery && (
        <p className="text-sm text-gray-600 mb-4">
          {visiblePeers.length} result{visiblePeers.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}

      {visiblePeers.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {visiblePeers.map((suggestion) => {
            const peer = suggestion.user;
            const skills = getPeerSkills(peer);
            const isOpen = expandedPeers[peer._id] || false;

            return (
              <li
                key={peer._id ?? peer.email ?? Math.random()}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-visible relative border border-gray-100"
              >
                {/* Conditional rendering: top card or details */}
                {!isOpen ? (
                  <div className="p-6 rounded-t-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {peer.userName ?? peer.fullname ?? "Unnamed"}
                        </h3>
                        <p className="text-sm text-gray-500">{peer.email ?? "—"}</p>
                      </div>

                      <button
                        onClick={() => handleAddFriend(peer._id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Friend
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-gray-600">
                      {/* Left column - Skills they have */}
                      <div className="border-r border-gray-200 pr-3">
                        <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          ⭐ OFFERS
                        </p>
                        {skills.length > 0 ? (
                          skills.map((skill, index) => (
                            <div key={index} className="text-sm mb-2 flex items-center justify-between gap-2">
                              <div className="font-medium text-gray-800 truncate">{skill.name}</div>
                              <div className="text-xs text-blue-600 font-bold tracking-wide whitespace-nowrap">{getLevelStars(skill.level)}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs italic text-gray-400">None</p>
                        )}
                      </div>
                      
                      {/* Right column - Skills they want */}
                      <div className="pl-3">
                        <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          🎓 SEEKING
                        </p>
                        {peer.skillsWant && peer.skillsWant.length > 0 ? (
                          peer.skillsWant.slice(0, 2).map((skillObj, index) => (
                            <div key={index} className="text-sm mb-1">
                              <div className="font-medium text-gray-800">{skillObj.skillName}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs italic text-gray-400">None</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDetails(peer._id)}
                      className="mt-4 text-teal-700 font-medium underline"
                    >
                      Show Details →
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-t-xl">
                    <div className="text-sm text-gray-700 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <p><span className="font-medium">Age:</span> {peer.age ?? "—"}</p>
                        <p><span className="font-medium">Gender:</span> {peer.gender ?? "—"}</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          ⭐ Skills They Offer
                        </p>
                        <ul className="ml-5 text-sm space-y-1">
                          {peer.skillsHave?.map((s, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              <span className="flex-1">{s.skill?.skillName ?? "Unknown"}</span>
                              <span className="text-blue-600 text-xs font-bold tracking-wide whitespace-nowrap">{getLevelStars(s.skillLevel)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          🎓 Skills They're Seeking
                        </p>
                        <ul className="ml-5 text-sm space-y-1">
                          {peer.skillsWant?.map((s, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-blue-600">→</span>
                              {s.skillName}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleAddFriend(peer._id)}
                          className="px-3 py-1.5 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                        >
                          Send Friend Request
                        </button>
                      </div>

                      <button
                        onClick={() => toggleDetails(peer._id)}
                        className="mt-4 text-teal-700 font-medium underline"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-lg text-gray-500">
            {searchQuery 
              ? `No peers found matching "${searchQuery}"`
              : "No peers found matching your skills."}
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(PeerSuggestions);
