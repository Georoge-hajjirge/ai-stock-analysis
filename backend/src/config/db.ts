import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing from backend/.env");
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("MongoDB Atlas connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};

export default connectDB;