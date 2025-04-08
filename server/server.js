require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

// Set timezone to Asia/Taipei (UTC+8)
process.env.TZ = 'Asia/Taipei';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/team_monitor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Models
const User = mongoose.model('User', {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Routes
const eventsRouter = require('./routes/events');
const downloadRoutes = require('./routes/download');
app.use('/api/events', eventsRouter);
app.use('/api/download', downloadRoutes);

// Test connection endpoint
app.get('/api/test-connection', (req, res) => {
    try {
        res.status(200).json({ msg: 'Connection successful' });
    } catch (err) {
        console.error('Test connection error:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Login endpoint
app.post('/api/login', [
    body('username').notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Create user endpoint (admin only)
app.post('/api/users', auth, [
    body('username').notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ msg: 'User created successfully' });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get all users (admin only)
app.get('/api/users', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete user (admin only)
app.delete('/api/users/:username', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ msg: 'Username is required' });
        }

        const Event = require('./models/Event');
        await User.findOneAndDelete({ username });
        await Event.deleteMany({ username });
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 