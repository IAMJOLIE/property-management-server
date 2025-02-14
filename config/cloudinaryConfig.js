import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config(); 

if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_SECRET) {
  console.error("❌ Saknade Cloudinary miljövariabler!");
  process.exit(1);
}


cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.CLOUD_API_KEY,
  api_secret:process.env.CLOUD_SECRET
});


console.log("✅ Cloudinary API_KEY:", process.env.CLOUD_API_KEY ? "Laddad" : "Saknas");



const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "property_images", 
      allowed_formats: ["jpg", "png", "jpeg"],
      transformation: [{ width: 800, height: 600, crop: "limit" }]
    }
  });


const upload = multer({ storage });

export { cloudinary, upload };
