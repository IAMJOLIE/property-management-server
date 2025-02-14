import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import AuthUser from "../models/authUser.js";
import PropertyModel from "../models/property.js";
import mongoose from "mongoose"; 

const router = express.Router();





router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await AuthUser.findById(req.user.id).populate("favorites");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("🔹 Hämtar favoriter:", user.favorites); 

        res.json(user.favorites); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/properties", authMiddleware, async (req, res) => {
    try {
        console.log("🔹 Request body från frontend:", req.body); 

        const { propertyIds } = req.body;

        if (!propertyIds || !Array.isArray(propertyIds)) {
            console.log(" Ogiltigt propertyIds-format:", propertyIds);
            return res.status(400).json({ message: "Invalid property IDs" });
        }


        const validObjectIds = propertyIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        console.log("🔹 Konverterade ObjectIds:", validObjectIds); 

        if (validObjectIds.length === 0) {
            return res.status(400).json({ message: "No valid property IDs provided" });
        }

        const properties = await PropertyModel.find({ _id: { $in: validObjectIds } });
        res.json(properties);
    } catch (error) {
        console.error(" Fel vid hämtning av favorit-properties:", error);
        res.status(500).json({ message: "Server error" });
    }



});


router.post("/:propertyId/favorite", authMiddleware, async (req, res) => {  
    try {
        console.log("🔹 Favorit API anropat med propertyId:", req.params.propertyId);

        const user = await AuthUser.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { propertyId } = req.params;

     
        const isFavorite = user.favorites.includes(propertyId);

        if (isFavorite) {
            user.favorites = user.favorites.filter(id => id.toString() !== propertyId);
        } else {
            user.favorites.push(propertyId);
        }

        await user.save();
        res.json({ message: isFavorite ? "Removed from favorites" : "Added to favorites", favorites: user.favorites });

    } catch (error) {
        console.error(" Error in favorites API:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;

