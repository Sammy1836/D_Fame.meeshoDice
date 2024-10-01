const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { exec } = require('child_process');
const app = express();
const PORT = 5001;

const JWT_SECRET = "SUP3RS3CRET";

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");

const readUsersFromFile = () => {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
};

const writeUsersToFile = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const findUserByEmail = (email) => {
    const users = readUsersFromFile();
    return users.find(user => user.email === email);
};

app.post("/signup", (req, res) => {
    const { name, email, password, gender, age, city } = req.body;

    if (!name || !email || !password || !gender || !age || !city) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const users = readUsersFromFile();

    if (users.find((user) => user.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = { name, email, password, gender, age, city };
    users.push(newUser);
    writeUsersToFile(users);

    res.status(201).json({ message: "User registered successfully" });
});

app.post("/signin", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: "1h",
    });

    res.status(200).json({
        message: "Signin successful",
        user: {
            name: user.name,
            email: user.email,
            gender: user.gender,
            age: user.age,
            city: user.city
        },
        token,
    });
});

app.post("/api/initial-recommendation", (req, res) => {
    const { email, page = 0 } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // const command = `python initial_recommendation.py "${user.email}" "${user.name}" ${user.age} ${user.gender} "${user.city}" ${page}`;
    const command = `python dummy_recommendation.py "${user.email}" "${user.name}" ${user.age} ${user.gender} "${user.city}" ${page}`;

    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'An error occurred while generating recommendations' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            // Log stderr but don't necessarily treat it as an error
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});