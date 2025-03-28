import mongoose from "mongoose";

const tryMongoDBAtlasConnection = async () => {
  try {
    const uri = process.env.MONGO_URI;
    // console.log("URI : ", uri);
    const isConnected = await mongoose.connect(uri);
    if (isConnected) {
      console.log("CONNECTED TO ATLAS DATABASE");
    } else {
      console.log("CANNOT CONNECT TO ATLAS DATABASE");
    }
  } catch (error) {
    console.error(error);
  }
};

export { tryMongoDBAtlasConnection };
