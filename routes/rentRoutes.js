import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import PropertyModel from "../models/property.js";
import AuthUser from "../models/authUser.js";

const router = express.Router();


router.post("/:propertyId/request", authMiddleware, async (req, res) => {
    try {
        const { propertyId } = req.params;
        console.log("🔹 Tenant skickar hyresförfrågan:", propertyId);

        const user = await AuthUser.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "tenant") {
            return res.status(403).json({ message: "Only tenants can request to rent" });
        }

        const property = await PropertyModel.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Kontrollera om hyresförfrågan redan finns
        const alreadyRequested = property.tenantRequests.some(
            (request) => request.tenantId.toString() === user._id.toString()
        );

        if (alreadyRequested) {
            return res.status(400).json({ message: "You have already requested to rent this property" });
        }

        // Lägg till en hyresförfrågan till ägaren
        property.tenantRequests.push({
            tenantId: user._id,
            status: "Pending",
        });

        await property.save();

        res.json({ message: "Rent request sent successfully" });

    } catch (error) {
        console.error(" Error handling rent request:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/:propertyId/accept", authMiddleware, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { tenantId, action } = req.body; // action: "accept" eller "deny"

        console.log("🔹 Owner hanterar hyresförfrågan:", propertyId, "Tenant ID:", tenantId, "Action:", action);

        const user = await AuthUser.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "owner") {
            return res.status(403).json({ message: "Only owners can accept rent requests" });
        }

        const property = await PropertyModel.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        if (property.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not the owner of this property" });
        }

        // Hitta rätt förfrågan
        const requestIndex = property.tenantRequests.findIndex(
            (req) => req.tenantId.toString() === tenantId
        );

        if (requestIndex === -1) {
            return res.status(404).json({ message: "Rent request not found" });
        }

        if (action === "accept") {
            property.tenantRequests[requestIndex].status = "accepted";
            property.tenants.push(tenantId); // Lägg till hyresgästen i tenants-listan
        } else if (action === "deny") {
            property.tenantRequests[requestIndex].status = "denied";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await property.save();

        res.json({ message: `Rent request ${action}ed successfully` });

    } catch (error) {
        console.error(" Error handling rent approval:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.get("/:propertyId/status", authMiddleware, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const user = await AuthUser.findById(req.user.id);

        if (!user || user.role !== "tenant") {
            return res.status(403).json({ message: "Only tenants can check request status" });
        }

        const property = await PropertyModel.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Kontrollera om denna tenant redan har en request
        const hasRequested = property.tenantRequests.some(
            (request) => request.tenantId.toString() === user._id.toString()
        );

        res.json({ hasRequested });

    } catch (error) {
        console.error(" Error checking rent request status:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:propertyId/cancel", authMiddleware, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const user = await AuthUser.findById(req.user.id);

        if (!user || user.role !== "tenant") {
            return res.status(403).json({ message: "Only tenants can cancel rent requests" });
        }

        const property = await PropertyModel.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        //  Ta bort tenantens request
        property.tenantRequests = property.tenantRequests.filter(
            (request) => request.tenantId.toString() !== user._id.toString()
        );

        await property.save();

        res.json({ message: "Rent request canceled successfully" });

    } catch (error) {
        console.error(" Error canceling rent request:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/my-requests", authMiddleware, async (req, res) => {
    try {
        const user = await AuthUser.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(" Hämtar hyresförfrågningar för användare:", user._id);

        const requests = await PropertyModel.find({
            "tenantRequests.tenantId": user._id
        });

        if (!requests || requests.length === 0) {
            console.log(" Inga hyresförfrågningar hittades.");
            return res.status(404).json({ message: "No rent requests found." });
        }

        console.log("📩 Hyresförfrågningar:", requests);

        const formattedRequests = requests.map((property) => {
            const tenantRequest = property.tenantRequests.find(
                (request) => request.tenantId.toString() === user._id.toString()
            );

            return {
                property: {
                    _id: property._id,
                    name: property.name,
                    price: property.price,
                    images: property.images?.length > 0 
                        ? property.images.map(img => ({ url: img.url || "https://via.placeholder.com/400" })) 
                        : [{ url: "https://via.placeholder.com/400" }]
                },
                status: tenantRequest ? tenantRequest.status : "unknown"
            };
        });

        res.json(formattedRequests);
    } catch (error) {
        console.error(" Error fetching rent requests:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/owner-requests", authMiddleware, async (req, res) => {
    try {
        const owner = await AuthUser.findById(req.user.id);

        if (!owner || owner.role !== "owner") {
            return res.status(403).json({ message: "Only owners can view rental requests" });
        }

        // Hämta alla properties där Owner är ägare och har pending tenant requests
        const properties = await PropertyModel.find({ owner: owner._id, "tenantRequests.0": { $exists: true } })
            .populate("tenantRequests.tenantId", "firstName lastName email")
            .lean();

        if (!properties.length) {
            return res.json([]);
        }

        // Formatera svar
        const formattedRequests = properties.flatMap(property =>
            property.tenantRequests.map(request => ({
                property: {
                    _id: property._id,
                    name: property.name,
                    price: property.price,
                    images: property.images.length > 0 ? [{ url: property.images[0].url }] : [{ url: "https://via.placeholder.com/400" }]
                },
                tenant: {
                    _id: request.tenantId._id,
                    firstName: request.tenantId.firstName,
                    lastName: request.tenantId.lastName,
                    email: request.tenantId.email,
                },
                status: request.status
            }))
        );

        res.json(formattedRequests);
    } catch (error) {
        console.error(" Error fetching owner requests:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.put("/:propertyId/:tenantId/:action", authMiddleware, async (req, res) => {
    try {
        const { propertyId, tenantId, action } = req.params;
        const owner = await AuthUser.findById(req.user.id);

        if (!owner || owner.role !== "owner") {
            return res.status(403).json({ message: "Only owners can update rental requests" });
        }

        const property = await PropertyModel.findById(propertyId);
        if (!property || property.owner.toString() !== owner._id.toString()) {
            return res.status(404).json({ message: "Property not found or unauthorized" });
        }

        // Hitta rätt request
        const tenantRequest = property.tenantRequests.find(request => request.tenantId.toString() === tenantId);
        if (!tenantRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Uppdatera status beroende på action
        if (action === "approve") {
            tenantRequest.status = "Approved";
        } else if (action === "reject") {
            tenantRequest.status = "Rejected";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await property.save();
        res.json({ message: `Request ${action}ed successfully`, status: tenantRequest.status });

    } catch (error) {
        console.error(" Error updating request status:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/unread-requests/:ownerId", async (req, res) => {
    try {
        const { ownerId } = req.params;

        console.log(` Hämtar properties för ownerId: ${ownerId}`);

        const properties = await PropertyModel.find({ owner: ownerId });

        if (!properties.length) {
            console.warn(" Inga properties hittades för denna owner.");
            return res.json({ unreadRequests: 0 });
        }

        let unreadRequests = 0;
        properties.forEach(property => {
            console.log(` Property: ${property.name}, Requests:`, property.tenantRequests);

            unreadRequests += property.tenantRequests.filter(req => req.status === "Pending").length;
        });

        console.log(` Totalt antal olästa requests: ${unreadRequests}`);

        res.json({ unreadRequests });
    } catch (error) {
        console.error(" Server error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});


router.get("/unread-responses/:tenantId", async (req, res) => {
    try {
        const { tenantId } = req.params;

        console.log(` Hämtar olästa svar för tenantId: ${tenantId}`);

        // Hitta alla requests för denna tenant
        const properties = await PropertyModel.find({
            "tenantRequests.tenantId": tenantId,
            "tenantRequests.status": { $in: ["Approved", "Rejected"] } // Endast Approved eller Rejected
        });

        let unreadResponses = 0;
        properties.forEach(property => {
            unreadResponses += property.tenantRequests.filter(req =>
                req.tenantId.equals(tenantId) && (req.status === "Approved" || req.status === "Rejected")
            ).length;
        });

        console.log(`Totalt antal olästa svar: ${unreadResponses}`);

        res.json({ unreadResponses });
    } catch (error) {
        console.error(" Error fetching unread responses:", error);
        res.status(500).json({ message: "Server error", error });
    }
});



















export default router;
