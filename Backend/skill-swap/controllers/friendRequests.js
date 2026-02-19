const FriendRequest = require("../models/friendRequest");

const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user; // set by authMiddleware
    const requests = await FriendRequest.find({ to: userId, status: "pending" })
      .populate("from", "userName email skillsHave skillsWant"); // populate sender info
    res.json(requests);
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    res.status(500).json({ message: "Error fetching friend requests" });
  }
};

module.exports = getPendingFriendRequests;
