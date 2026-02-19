const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
        ],

        isGroup: {
            type: Boolean,
            default: false
        },

        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    },
    {
        timestamps: true
    }
)

// Index for faster queries
conversationSchema.index({ participants: 1 });

// Unique compound index to prevent duplicate one-on-one conversations
conversationSchema.index(
    { participants: 1, isGroup: 1 },
    { 
        unique: true,
        partialFilterExpression: { isGroup: false }
    }
);

const Conversation = mongoose.model("Conversation", conversationSchema)

module.exports = Conversation;