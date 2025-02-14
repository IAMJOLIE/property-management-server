import express from "express";
import PropertyModel from "../models/property.js"
import { upload } from "../config/cloudinaryConfig.js";

import mongoose from "mongoose";
import AuthUser from "../models/authUser.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();



router.get("/", async (req, res) => {
    try {
        const properties = await PropertyModel.find();
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch properties" });
    }
});


router.get("/:id", async (req, res) => {
    try {

        const property = await PropertyModel.findById(req.params.id).populate("owner", "firstName lastName email")
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        res.json(property);
    } catch (error) {
        console.error(" Error fetching property:", error.message);
        res.status(500).json({ error: "Failed to fetch property" });
    }
});

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Ingen bild uppladdad" });
        }

        console.log(" Cloudinary URL:", req.file.path); 

        res.status(200).json({ imageUrl: req.file.path });
    } catch (error) {
        console.error(" Fel vid uppladdning:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        console.log("📥 Mottagen fastighetsdata i backend:", req.body);

        const { type, name, description, country, state, city,
            zipCode, address, images, price, size, rooms,
             bathrooms, owner, rentalStartDate, rentalEndDate } = req.body;

  
        const requiredFields = { type, name, description, country, state, city,
            zipCode, address, images, price, size, rooms, bathrooms, owner };



        const missingFields = Object.entries(requiredFields).filter(([key, value]) => !value);

        if (missingFields.length > 0) {
            console.error("❌ Saknade fält i backend:", missingFields.map(([key]) => key));
            return res.status(400).json({ message: "Saknade fält", missingFields: missingFields.map(([key]) => key) });
        }

        if (!owner) {
            console.log("❌ Ägare saknas i inkommande data!");
            return res.status(400).json({ message: "Ägaren (owner) saknas!" });
        }

        //  KONVERTERA OWNER TILL OBJECTID
        const ownerObjectId = new mongoose.Types.ObjectId(owner);
        // Skapa ny fastighet
        const newProperty = new PropertyModel({
            type, name, description, country, state, city,
            zipCode, address, images, price, size, rooms,
            bathrooms, owner: ownerObjectId , rentalStartDate, rentalEndDate
        });

        await newProperty.save();
        console.log(" Fastighet sparad!");
        res.status(201).json({ message: "Fastighet sparad!", property: newProperty });

    } catch (error) {
        console.error(" Error saving property:", error);
        res.status(500).json({ message: "Serverfel vid sparande av fastighet", error: error.message });
    }
});






router.get("/owner/:ownerId", async (req, res) => {
    try{
        const ownerId = req.params.ownerId;
        const properties = await PropertyModel.find({ owner: ownerId});

        if (!properties.length) {
            return res.status(404).json({message: "Inga fastigheter hittades för denna ägare", ownerId})
        }

        res.json(properties);
    } catch (error) {
        console.error("fel vid hämtning av fastighter för ägare:", error);
        res.status(500).json({message: "serverfel", error: error.message});
    }
})

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔄 Uppdaterar fastighet med ID: ${id}`);

        let property = await PropertyModel.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Fastighet hittades inte" });
        }

        //  Se till att alla fält uppdateras korrekt
        const updatedProperty = await PropertyModel.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log(" Fastighet uppdaterad:", updatedProperty);
        res.status(200).json({ message: "Fastigheten har uppdaterats!", property: updatedProperty });

    } catch (error) {
        console.error(" Fel vid uppdatering av fastighet:", error);
        res.status(500).json({ message: "Serverfel vid uppdatering av fastighet", error: error.message });
    }


router.post("/favorites", authMiddleware, async (req, res) => {
    try {
        const { propertyIds } = req.body;

        if (!propertyIds || !Array.isArray(propertyIds)) {
            return res.status(400).json({ message: "Invalid property IDs" });
        }

        const properties = await Property.find({ _id: { $in: propertyIds } });
        res.json(properties);
    } catch (error) {
        console.error(" Fel vid hämtning av favorit-properties:", error);
        res.status(500).json({ message: "Server error" });
    }
});

})









export default router;