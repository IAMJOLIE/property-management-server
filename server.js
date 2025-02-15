

import  express  from "express";
import cors from "cors";



import propertyRoutes from "./routes/propertyRoutes.js"
import authRoutes from "./routes/authRoutes.js";  
import FavoritRoutes from "./routes/FavoritRoutes.js";
import rentRoutes from "./routes/rentRoutes.js";


import connectDB from "./config/db.js";
import ownerPropertiesRoutes from "./routes/ownerPropertiesRoutes.js"




const app= express();

app.use(express.json({limit: "50mb"}));


const allowedOrigins = [
    "http://localhost:5173",  
    "https://property-managment-system.netlify.app" 
];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true, 
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));



connectDB();


console.log(" Loading property routes..."); 
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/owner-properties", ownerPropertiesRoutes)
app.use("/api/favorites", FavoritRoutes)
app.use("/api/rent", rentRoutes);




const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});