require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/team_monitor",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// User Model
const User = mongoose.model("User", {
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

async function createAdminUser() {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ isAdmin: true });

    if (!adminExists) {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("0001", salt);

      const adminUser = new User({
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      });

      await adminUser.save();
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }

    // Close the connection
    mongoose.connection.close();
  } catch (err) {
    console.error("Error:", err);
    mongoose.connection.close();
  }
}

// Run the function
createAdminUser();
