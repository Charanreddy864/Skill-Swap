import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import socket from '../../services/socket';
import ConversationView from './conversationView';

const ChatPage = ({ setChatPageOpen, chatPageOpen, setActiveConversationFriend, unreadCounts }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const currentUser = useSelector((state) => state);

    // Helper function to get the other participant's info
    const getOtherParticipant = (participants) => {
        return participants.find(p => p._id !== currentUser._id) || participants[0];
    };

    // Helper function to format time
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Function to fetch conversations with unread counts
    const fetchConversations = async () => {
        setLoading(true);
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
                setConversations(data.conversations || []);
            } else {
                console.error('Failed to fetch conversations');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch conversations whenever chat page opens
    useEffect(() => {
        if (!chatPageOpen) return;
        fetchConversations();
    }, [chatPageOpen]);

    // Refetch conversations when returning from a conversation view
    useEffect(() => {
        if (chatPageOpen && !selectedConversation) {
            fetchConversations();
        }
    }, [selectedConversation, chatPageOpen]);

    // Handle going back from conversation view
    const handleBackFromConversation = () => {
        setSelectedConversation(null);
        // Clear active conversation friend
        if (setActiveConversationFriend) {
            setActiveConversationFriend(null);
        }
        // Refresh conversations to show latest messages
        fetchConversations();
    };

    // Real-time updates for conversations list
    useEffect(() => {
        if (!chatPageOpen) return;

        const handleNewMessage = (data) => {
            const newMessage = data.message || data;
            console.log("📨 Received:", newMessage._id);
            
            // Acknowledge message delivery or read status
            if (newMessage.sender?._id !== currentUser._id) {
                // Check if this message is from the currently open conversation
                if (selectedConversation) {
                    const otherParticipant = selectedConversation.participants.find(p => p._id !== currentUser._id);
                    if (otherParticipant?._id === newMessage.sender._id) {
                        // Chat is open with this person, mark as read
                        socket.emit('markMessageAsRead', { messageId: newMessage._id });
                    } else {
                        // Different conversation is open
                        socket.emit('messageDelivered', { messageId: newMessage._id });
                    }
                } else {
                    // No conversation selected, just mark as delivered
                    socket.emit('messageDelivered', { messageId: newMessage._id });
                }
            }

            setConversations((prevConversations) => {
                // Find the conversation with this message
                const conversationIndex = prevConversations.findIndex(conv => {
                    const otherParticipant = conv.participants.find(p => p._id !== currentUser._id);
                    return otherParticipant?._id === newMessage.sender?._id || 
                           otherParticipant?._id === newMessage.receiver?._id ||
                           conv._id === newMessage.conversationId;
                });

                if (conversationIndex !== -1) {
                    // Update existing conversation
                    const updatedConversations = [...prevConversations];
                    const conversation = { ...updatedConversations[conversationIndex] };
                    
                    // Update last message
                    conversation.lastMessage = newMessage;
                    conversation.updatedAt = newMessage.createdAt || new Date().toISOString();
                    
                    // Note: Unread count is now managed by Dashboard, no need to increment here
                    
                    // Remove from current position and add to top
                    updatedConversations.splice(conversationIndex, 1);
                    return [conversation, ...updatedConversations];
                } else {
                    // New conversation - refetch all to get complete data
                    fetchConversations();
                    return prevConversations;
                }
            });
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
    }, [chatPageOpen, currentUser._id, selectedConversation]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading conversations...</p>
                </div>
            </div>
        );
    }

    // If a conversation is selected, show the conversation view
    if (selectedConversation) {
        return (
            <ConversationView
                conversation={selectedConversation}
                onBack={handleBackFromConversation}
                setActiveConversationFriend={setActiveConversationFriend}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 shadow-md flex-shrink-0 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Messages</h1>
                <button
                    onClick={() => setChatPageOpen(false)}
                    className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                >
                    ✕
                </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {conversations.map((conversation) => {
                            const otherParticipant = getOtherParticipant(conversation.participants);
                            const isCurrentUserSender = conversation.lastMessage?.sender?._id === currentUser._id;
                            // Use unreadCounts from Dashboard props if available, otherwise fall back to conversation.unreadCount
                            const unreadCount = unreadCounts?.[otherParticipant?._id] ?? conversation.unreadCount ?? 0;

                            return (
                                <div
                                    key={conversation._id}
                                    onClick={() => {
                                        setSelectedConversation(conversation);
                                        // Set the active conversation friend ID
                                        const otherParticipant = getOtherParticipant(conversation.participants);
                                        if (setActiveConversationFriend) {
                                            setActiveConversationFriend(otherParticipant._id);
                                        }
                                    }}
                                    className={`
                                        p-4 cursor-pointer transition-all duration-200
                                        hover:bg-blue-50 hover:shadow-sm
                                        ${selectedConversation?._id === conversation._id 
                                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                                            : 'bg-white'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                {otherParticipant?.userName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {otherParticipant?.userName || 'Unknown User'}
                                                </h3>
                                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                    {conversation.lastMessage?.createdAt 
                                                        ? formatTime(conversation.lastMessage.createdAt)
                                                        : ''
                                                    }
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                {isCurrentUserSender && (
                                                    <span className="text-sm text-gray-500">You:</span>
                                                )}
                                                <p className="text-sm text-gray-600 truncate flex-1">
                                                    {conversation.lastMessage?.content || 'No messages yet'}
                                                </p>
                                            </div>

                                            {/* Unread badge */}
                                            {unreadCount > 0 && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                                        {unreadCount} new
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h3>
                        <p className="text-gray-500 max-w-sm">
                            Start chatting with your friends to see your conversations here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;