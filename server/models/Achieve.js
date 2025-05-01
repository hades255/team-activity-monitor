const mongoose = require("mongoose");
//  y m d h
//  work, relax
const achieveSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  work: {
    type: Number,
    default: 0,
  },
  relax: {
    type: Number,
    default: 0,
  },
  windows: { type: Array, default: [] }, //  {window:"", total:0}
  dt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Create index for efficient querying
achieveSchema.index({ username: 1, dt: -1 });

module.exports = mongoose.model("Achieve", achieveSchema);
