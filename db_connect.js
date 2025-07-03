import mongoose from "mongoose";

export const DB_CONNECT = async () => {
  try {
   const connect =  await mongoose.connect(process.env.MONGO_URI);

    console.log(`Mongo connected :`, connect.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};
