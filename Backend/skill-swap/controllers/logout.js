const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie('token', {
      httpOnly: false,
      sameSite: 'Strict',
      secure: false, // change to true in production (HTTPS)
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ message: 'Error logging out', error: err.message });
  }
};

module.exports = logout;
