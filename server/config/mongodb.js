import mongoose from "mongoose";
const connectDB = async ()=>{
    mongoose.connection.on('connected',()=>{
        console.log("DATABASE CONNECT")
    })
    await mongoose.connect(`${process.env.MONGODB_URL}/mernauth`)
}
export default connectDB; 