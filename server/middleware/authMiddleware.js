const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as needed

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer token format

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch the user from the database using the userId from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
