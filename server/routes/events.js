const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { auth } = require("../middleware/auth");

// Record activity when signal is received
router.get("/", auth, async (req, res) => {
  try {
    const { username = "", window = "" } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Save a single activity event
    const event = new Event({
      username,
      window,
      eventType: "activity",
      dt: new Date(),
    });

    await event.save();
    res.status(200).json({ message: "Activity recorded" });
  } catch (error) {
    console.error("Error recording activity:", error);
    res.status(500).json({ error: "Failed to record activity" });
  }
});

// Get team activities
router.get("/team", auth, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: "Year and month are required" });
    }

    // Create date range for the selected month
    const startDate = new Date(year, month - 1, -7); // month is 1-based in query
    const endDate = new Date(year, month, 7, 23, 59, 59); // last day of the month

    // Get all events for all users in the specified month
    const events = await Event.find({
      dt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ dt: 1 })
      .select("username dt window -_id");

    res.json(events);
  } catch (error) {
    console.error("Error fetching team events:", error);
    res.status(500).json({ error: "Failed to fetch team events" });
  }
});

// Get last event for each user (admin only)
router.get("/team/current", auth, async (req, res) => {
  try {
    // Get all unique users
    const users = await Event.distinct("username");

    // Get last event for each user within last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const currentActivities = await Promise.all(
      users.map(async (username) => {
        const lastEvent = await Event.findOne({
          username,
          dt: { $gte: tenMinutesAgo },
        })
          .sort({ dt: -1 })
          .select("username window dt -_id");

        return lastEvent || { username, window: null, dt: null };
      })
    );

    res.json(currentActivities);
  } catch (error) {
    console.error("Error fetching current activities:", error);
    res.status(500).json({ error: "Failed to fetch current activities" });
  }
});

// Get events for a specific user (requires authentication)
router.get("/:username", auth, async (req, res) => {
  try {
    const { username } = req.params;
    const { year, month } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if user is requesting their own events or is an admin
    if (req.user.username !== username && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these events" });
    }

    // Create date range for the selected month
    const startDate = new Date(year, month - 1, -7); // month is 1-based in query
    const endDate = new Date(year, month, 7, 23, 59, 59); // last day of the month

    const events = await Event.find({
      username,
      dt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ dt: -1 })
      .select("dt window -_id");

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

module.exports = router;
