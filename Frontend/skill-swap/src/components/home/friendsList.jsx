import React from "react";

const FriendsList = ({ 
  friends, 
  setChatWindowOpen, 
  setActiveChatFriend, 
  activeChatFriend, 
  activeConversationFriend,
  unreadCounts,
  setUnreadCounts
}) => {
  
  const openChatWindow = (friend) => {
    setChatWindowOpen(true);
    setActiveChatFriend(friend);
    // Clear unread count for this friend
    if (setUnreadCounts) {
      setUnreadCounts(prev => ({
        ...prev,
        [friend._id]: 0
      }));
    }
  };

  return (
    <div className="p-4 border-b bg-gray-50 flex-1 overflow-hidden flex flex-col">
      <h3 className="font-semibold mb-3 text-gray-700 text-lg flex-shrink-0">Friends</h3>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 border hover:border-blue-500"
            >
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-3 flex-1">
                {/* Avatar Circle with Badge */}
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold text-sm">
                    {friend.userName.charAt(0).toUpperCase()}
                  </div>
                  {unreadCounts[friend._id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCounts[friend._id] > 9 ? '9+' : unreadCounts[friend._id]}
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-gray-800 truncate">
                    {friend.userName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {unreadCounts[friend._id] > 0 ? (
                      <span className="text-red-500 font-medium">
                        {unreadCounts[friend._id]} new message{unreadCounts[friend._id] > 1 ? 's' : ''}
                      </span>
                    ) : (
                      'Online'
                    )}
                  </span>
                </div>
              </div>

              {/* Right: Chat Icon Button */}
              <button
                onClick={() => openChatWindow(friend)}
                className={`p-2 rounded-full w-12 hover:bg-blue-500 hover:text-white transition-all duration-200 text-lg relative ${
                  unreadCounts[friend._id] > 0 ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'
                }`}
              >
                💬
              </button>

            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No friends yet</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(FriendsList);
