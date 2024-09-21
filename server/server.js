const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { exec } = require('child_process');
const app = express();
const PORT = 5001;

const JWT_SECRET = "SUP3RS3CRET";

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
    return JSON.parse(data);
};

// Function to write users to the JSON file
const writeUsersToFile = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); // Pretty print the JSON
};

// Signup endpoint
app.post("/signup", (req, res) => {
    const { name, email, password, gender, age, city } = req.body;

    if (!name || !email || !password || !gender || !age || !city) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const users = readUsersFromFile();

    // Check if the user already exists
    if (users.find((user) => user.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = { name, email, password, gender, age, city };
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

    // Generate JWT token
    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: "1h",
    });

    res.status(200).json({
        message: "Signin successful",
        user: { name: user.name, email: user.email, gender: user.gender, age: user.age, city: user.city },
        token,
    });
});

app.post("/api/initial-recommendation", (req, res) => {
    const { email } = req.body;
    
    // Read user data from users.json
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const command = `python initial_recommendation.py "${user.email}" "${user.name}" ${user.age} ${user.gender} "${user.city}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'An error occurred while generating recommendations' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'An error occurred while generating recommendations' });
        }
        
        try {
            const recommendations = JSON.parse(stdout);
            res.json(recommendations);
        } catch (parseError) {
            console.error('Error parsing recommendation output:', parseError);
            res.status(500).json({ error: 'Error processing recommendations' });
        }
    });
});

// New route for updated recommendation
app.post("/api/updated-recommendation", (req, res) => {
    const { user_id, name, age, gender, city } = req.body;
    
    const command = `python ../update_recommendation.py ${user_id} "${name}" ${age} ${gender} ${city}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'An error occurred while generating updated recommendations' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'An error occurred while generating updated recommendations' });
        }
        
        try {
            const recommendations = JSON.parse(stdout);
            res.json(recommendations);
        } catch (parseError) {
            console.error('Error parsing updated recommendation output:', parseError);
            res.status(500).json({ error: 'Error processing updated recommendations' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});