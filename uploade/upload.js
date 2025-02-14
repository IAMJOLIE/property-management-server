import multer from "multer";

import {CloudinaryStorage} from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js"; 




const storage = new CloudinaryStorage({
   cloudinary,
    param: {
        folder: "property_images",
        
        allowedFormats: ["jpeg", "png", "jpg"],

    }
})

const upload= multer({storage})

export default upload;