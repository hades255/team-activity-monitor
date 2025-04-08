const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        required: true,
        enum: ['key_press', 'mouse_click', 'inactive', 'start', 'activity']
    },
    dt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

// Create index for efficient querying
eventSchema.index({ username: 1, dt: -1 });

module.exports = mongoose.model('Event', eventSchema); 