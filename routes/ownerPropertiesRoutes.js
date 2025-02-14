import express from "express";

import PropertyModel from "../models/property.js";

const router = express.Router();


router.get("/:ownerId", async (req, res) => {
    try {
        const ownerId = req.params.ownerId;
        console.log("🔍 Hämtar fastigheter för ägare:", ownerId);

        const properties = await PropertyModel.find({ owner: ownerId }).populate("owner", "email firstName");

        if (!properties.length) {
            console.log(" Inga fastigheter hittades för ägare:", ownerId);
            return res.status(404).json({ message: "Inga fastigheter hittades" });
        }

        res.json(properties);
    } catch (error) {
        console.error("Fel vid hämtning av fastigheter för ägare:", error);
        res.status(500).json({ message: "Serverfel", error: error.message });
    }
});

router.delete("/:propertyId", async (req, res) => {
       
        console.log("delete request received for id:", req.params.propertyId)
        try{
            const property = await PropertyModel.findById(req.params.propertyId);
            if(!property) {
                return res.status(404).json({error: "property not found"})
            }
      

            await PropertyModel.findByIdAndDelete(req.params.propertyId)
            console.log("property deleted successfully")
            res.json({message: "Property deleted sussessfully"})


        } catch (error) {
            console.error("error deleting property", error.message)
            res.status(500).json({error: error.message})
        }
})


router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(` Uppdaterar fastighet med ID: ${id}`);


        let property = await PropertyModel.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Fastighet hittades inte" });
        }


        property = await PropertyModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        console.log("Fastighet uppdaterad:", property);
        res.status(200).json({ message: "Fastigheten har uppdaterats!", property });

    } catch (error) {
        console.error(" Fel vid uppdatering av fastighet:", error);
        res.status(500).json({ message: "Serverfel vid uppdatering av fastighet", error: error.message });
    }
});











export default router;