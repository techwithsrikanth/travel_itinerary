const express = require('express');
const router = express.Router();
const Itinerary = require('../models/Itinerary');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure you have auth middleware to protect routes

// Save itinerary
router.post('/save-itinerary', authMiddleware, async (req, res) => {
  const { content, flights, hotels } = req.body; // Extracting itinerary details from request body
  const user = req.user.id; // From authMiddleware
  console.log('flights in routes', flights)
  console.log('hotels in routes', hotels)
  
  try {
    const newItinerary = new Itinerary({
      user,
      content,
      flights,
      hotels
    });
    
    await newItinerary.save();
    res.status(201).json(newItinerary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get itineraries for a user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // Fetch itineraries based on the authenticated user
    const itineraries = await Itinerary.find({ user: req.user._id });
    res.json(itineraries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
