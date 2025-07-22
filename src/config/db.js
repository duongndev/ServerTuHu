import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import cloudinary from "cloudinary";

const connectDB = async () => {
  try {
    await mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI, {
      user: process.env.DB_USER,
      pass: process.env.DB_PASS,
      dbName: process.env.DB_NAME,
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log("MongoDB connection successful");
    }
  } catch (error) {
    console.error("MongoDB connection fail");
    console.error(error);
  }
};

const connectCloudinary = async () => {
  try {
    await cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
      secure: true,
    });
  } catch (error) {
    console.error(error);
  }
};

export { connectDB, connectCloudinary };
