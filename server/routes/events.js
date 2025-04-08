const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Record activity when signal is received
router.get('/', async (req, res) => {
    try {
        const { username="", window="" } = req.query;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const utc8Time = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Yakutsk', // or 'Asia/Shanghai'
            dateStyle: 'full',
            timeStyle: 'long',
        }).format(new Date());

        // Save a single activity event
        const event = new Event({
            username,
            window,
            eventType: 'activity',
            dt: new Date()
        });

        await event.save();
        res.status(200).json({ message: 'Activity recorded' });
    } catch (error) {
        console.error('Error recording activity:', error);
        res.status(500).json({ error: 'Failed to record activity' });
    }
});

// Get events for a specific user (requires authentication)
router.get('/:username', auth, async (req, res) => {
    try {
        const { username } = req.params;
        const { year, month } = req.query;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Check if user is requesting their own events or is an admin
        if (req.user.username !== username && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not authorized to view these events' });
        }

        // Create date range for the selected month
        const startDate = new Date(year, month - 1, 1); // month is 1-based in query
        const endDate = new Date(year, month, 0); // last day of the month

        const events = await Event.find({
            username,
            dt: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .sort({ dt: -1 })
        .select('dt -_id');
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

module.exports = router; 