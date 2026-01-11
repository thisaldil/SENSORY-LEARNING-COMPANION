require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const animationRoutes = require('./routes/animation');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualScience';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

app.use('/api/animation', animationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
