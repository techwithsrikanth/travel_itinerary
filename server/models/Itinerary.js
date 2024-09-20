const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: [Object], 
    required: true,
  },
  flights: {
    type: Object,
    required: true,
  },
  hotels: {
    type: [Object], 
    required: true,
  },
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
module.exports = Itinerary;
