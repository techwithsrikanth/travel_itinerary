const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const ItineraryRoutes = require('./routes/ItineraryRoutes');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
// Add this line to your server setup
app.use('/api/itinerary', ItineraryRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
