const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Add this line to include CORS
const app = express();
const PORT = 5001;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON bodies
app.use(express.json());

// File path to store users' data
const USERS_FILE = path.join(__dirname, "users.json");

// Function to read users from the JSON file
const readUsersFromFile = () => {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([])); // Create an empty file if it doesn't exist
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    console.log(data);
    return JSON.parse(data);
};

// Function to write users to the JSON file
const writeUsersToFile = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); // Pretty print the JSON
};

// Signup endpoint
app.post("/signup", (req, res) => {
    const { name, email, password, gender, age } = req.body;

    if (!name || !email || !password || !gender || !age) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const users = readUsersFromFile();

    // Check if the user already exists
    if (users) {
        const existingUser = users.find((user) => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
    }

    // Create new user
    const newUser = { name, email, password, gender, age };
    users.push(newUser);
    writeUsersToFile(users);

    res.status(201).json({ message: "User registered successfully" });
});

// Signin endpoint
app.post("/signin", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Email and password are required" });
    }

    const users = readUsersFromFile();

    // Check if user exists and password matches
    const user = users.find(
        (user) => user.email === email && user.password === password
    );
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Signin successful", user });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
