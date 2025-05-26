const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/community-challenges', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema and Model
// Enhanced User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  challengesCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }]
});

// Enhanced Challenge Schema
const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  deadline: { type: Date },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }],
  tags: [String],
  voteCount: { type: Number, default: 0 }
});

// Submission Schema
const SubmissionSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  voteCount: { type: Number, default: 0 }
});

// Vote Schema
const VoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', UserSchema);
const Challenge = mongoose.model('Challenge', ChallengeSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);
const Vote = mongoose.model('Vote', VoteSchema);

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send('Username already exists');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    // Create token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.header('Authorization', token).send({ user, token });
  } catch (err) {
    res.status(500).send('Error registering user');
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Invalid credentials');
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');
    
    // Create token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.header('Authorization', token).send({ user, token });
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

// Protected Challenge Routes
app.post('/api/challenges', authenticate, async (req, res) => {
  try {
    const challenge = new Challenge({
      ...req.body,
      creator: req.user._id
    });
    await challenge.save();
    res.status(201).send(challenge);
  } catch (err) {
    res.status(500).send('Error creating challenge');
  }
});

app.get('/api/challenges', async (req, res) => {
  // Get all challenges
});

app.post('/api/challenges', async (req, res) => {
  // Create new challenge
});

// Voting Route
app.post('/api/challenges/:id/vote', async (req, res) => {
  // Handle voting
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});