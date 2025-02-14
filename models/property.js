import mongoose from "mongoose";



const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Property name is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    country: {
        type: String,
        
    },
    state: {
        type: String,
        required: [true, "State is required"]
    },
    city: {
        type: String,
        required: [true, "City is required"]
    },
    zipCode: {
        type: String,
        required: [true, "Zip Code is required"]
    },
    address: {
        type: String,
        required: [true, "Address is required"]
    },
    type: {
        type: String,
        required: [true, "Type is required"],
        enum: ["Own Property", "Rental"]
    },
  
    images: [
        {
            url: {type: String, required: true},
            public_id: {type : String, required: true},
        }
    ],

    price: {
        type: Number,
        required: true
    },

    rooms: {
        type: Number,
        required: true
    },
    bathrooms: {
        type: Number, 
        required: true
    },

    size: {
        type: Number, 
        required: true, 
    },

    createdAt: { type: Date, 
        defult: Date.now},

        owner: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser", required: true },

        rentalStartDate: {type: Date},
        rentalEndDate: {type: Date},

        tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: "AuthUser" }], 
        tenantRequests: [
            {
                tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser" },
                status: {
                    type: String,
                    enum: ["Pending", "Approved", "Rejected", "Hidden"], 
                    default: "Pending",
                },
            },
        ],

     
}, { timestamps: true });

const PropertyModel = mongoose.model("Property", propertySchema);
export default PropertyModel;




