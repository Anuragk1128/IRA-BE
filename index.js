import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/mongodb.js';
import authRoutes from './routes/auth.js';

dotenv.config();

// Connect to DB
await connectDB();

// Init app
const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

