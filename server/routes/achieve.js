const express = require("express");
const { auth, isAdmin } = require("../middleware/auth");
const { BANNED_APPS } = require("../contants");
const Event = require("../models/Event");
const Achieve = require("../models/Achieve");
const router = express.Router();

/** achieve events - only last months - admin */
router.get("/", async (req, res) => {  //  , auth, isAdmin
  try {
    const startDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const events = await Event.find({ dt: { $lt: startDate } })
      .sort({ dt: 1 })
      .select("username dt window -_id");

    let data = [];

    let _y = 0;
    let _m = 0;
    let _d = 0;
    let _h = 0;
    let y = 0;
    let m = 0;
    let d = 0;
    let h = 0;
    let defaultData = {
      y: 0,
      m: 0,
      d: 0,
      h: 0,
      username: "",
      work: 0,
      relax: 0,
      windows: [],
    };
    let _data = null;
    let _windows = {};
    events.forEach((event) => {
      const eventDate = new Date(event.dt);
      y = eventDate.getFullYear();
      m = eventDate.getMonth();
      d = eventDate.getDate();
      h = eventDate.getHours();
      const isBannedApp = BANNED_APPS.includes(event.window);
      if (y === _y && m === _m && d === _d && h === _h) {
        _data.work = _data.work + (isBannedApp ? 0 : 1);
        _data.relax = _data.relax + (isBannedApp ? 1 : 0);
        if (_windows[event.window]) _windows[event.window] += 1;
        else _windows[event.window] = 1;
      } else {
        if (_data && Object.entries(_windows).length > 0) {
          data.push({
            ..._data,
            windows: Object.entries(_windows).map(([window, total]) => ({
              window,
              total,
            })),
            dt: new Date(y, m, d, h),
          });
        }
        _y = y;
        _m = m;
        _d = d;
        _h = h;
        _data = {
          ...defaultData,
          y,
          m,
          d,
          h,
          username: event.username,
          work: isBannedApp ? 0 : 1,
          relax: isBannedApp ? 1 : 0,
        };
        _windows = {};
        _windows[event.window] = 1;
      }
    });
    if (_data && Object.entries(_windows).length > 0) {
      data.push({
        ..._data,
        windows: Object.entries(_windows).map(([window, total]) => ({
          window,
          total,
        })),
        dt: new Date(y, m, d, h),
      });
    }
    // await Achieve.insertMany(data);
    // await Event.deleteMany({ dt: { $lt: startDate } });
    res.send({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/** get achieved events for team */
router.get("/teams", auth, async (req, res) => {
  res.send({ msg: "ok" });
});

/** get achieved events for a user */
router.get("/:username", auth, async (req, res) => {
  res.send({ msg: "ok" });
});

module.exports = router;
