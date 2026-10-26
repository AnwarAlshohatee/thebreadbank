require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middleware/authMiddleware");
const donationRoutes = require("./routes/donationRoutes");

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
connectDB();

// EJS template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Read form submissions
app.use(express.urlencoded({ extended: true }));

// Serve CSS and other static files
app.use(express.static(path.join(__dirname, "public")));

// Login sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Homepage
app.get("/", (req, res) => {
  res.render("index");
});

// Mount registration, login, and logout routes.
app.use("/", authRoutes);

// Donation routes: dashboard, create, edit, delete.
app.use("/", donationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Bread Bank running at http://localhost:${PORT}`);
});