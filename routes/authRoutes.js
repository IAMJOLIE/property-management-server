import express from "express";
import bcrypt from "bcryptjs";
import AuthUser from "../models/authUser.js"; 
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import authMiddleware from "../middleware/authMiddleware.js";
dotenv.config();



const router = express.Router();

    router.post("/register", async (req, res) => {
        try {
            const { firstName, lastName, email, password, confirmPassword, role } = req.body;
    
            console.log(" Tar emot registreringsdata:", email, password);
    
            if (password !== confirmPassword) {
                return res.status(400).json({ message: "Passwords do not match" });
            }
    

            let existingUser = await AuthUser.findOne({ email })
         
        console.log(" Söker i databasen... Hittade:", existingUser);
            if(existingUser) {
                console.log(" E-postadressen finns redan i databasen!");

                return res.status(400).json({message: "Email already registered"})
            }

            console.log(" Hashar lösenord...");
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log(" Hashat lösenord:", hashedPassword);
    
            const user = new AuthUser({
                firstName,
                lastName,
                email,
                password,
                role: role || "tenant"
            });
    
            await user.save();
                const token = jwt.sign(
                    {id: user._id, email: user.email, role: user.role},
                    process.env.JWT_SECRET,
                    {expiresIn: "1h"}
                )

            console.log(" Användare registrerad!");
            res.status(201).json({ message: "User registered successfully!" });
    
        } catch (error) {
            console.error(" Registration error:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });
    

    router.post("/login", async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log(" Inloggningsförsök med email:", email);
    
            const user = await AuthUser.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
    
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
    
            console.log(" Lösenord korrekt, genererar JWT-token...");
            console.log(" Användarroll från databasen:", user.role);  
    
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },  
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            console.log("Användar-ID skickas:", user._id);

            console.log(" Inloggning lyckades! Roll skickas:", user.role);
            res.status(200).json({ 
                message: "Login successful!", 
                token, 
                firstName: user.firstName,
                role: user.role || "tenant",
                userId: user._id
            });
    
        } catch (error) {
            console.log(" Login error:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    router.get("/account", authMiddleware, async (req, res) => {
        try {
            const user = await AuthUser.findById(req.user.id).select("-password"); 
            if (!user) return res.status(404).json({ message: "User not found" });
    
            res.json(user);
        } catch (error) {
            console.error(" Error fetching user account:", error.message);
            res.status(500).json({ message: "Server error" });
        }
    });
    
    
    




export default router;



