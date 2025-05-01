const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ msg: "not admin" });
    }
  } else {
    res.status(404).json({ msg: "user not found" });
  }
};

module.exports = { auth, isAdmin };
