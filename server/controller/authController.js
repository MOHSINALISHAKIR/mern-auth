import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';

export const register =  async (req,res)=>{
    const {name,email,password}=req.body;
    if(!name||!email||!password){
        return res.json({success:false,message:'please fill all fiels...'})
    }
    try {
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false,message:'user already exist'})
        }
        const hashedPassword= await bcrypt.hash(password,10);

        const user = new userModel({
            name,
            email,
            password:hashedPassword
        })
        await user.save()
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:7*24*60*60*1000 
        })
         return res.json({ success: true, message: 'User registered successfully', user });



        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
        
    }
}
export const login = async(req,res)=>{
    const {email,password}=req.body;
    if(!email||!password){
        return res.json({success:false,message:'Email and Password Required'})
    }
    try {
        const user = await userModel.find({email})
        if(!user){
            return res.json({success:false,message:'invalid credentials...'})
        }
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.json({success:false,message:'invalid credentials..'})
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:7*24*60*60*1000 
        });
        return res.json({success:true})


        
    } catch (error) {
        console.log(error)
        res.json({success:false})
    }
}
export const loginOut = async(req,res)=>{
    try {
        res.clearCookie('token',{
             httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:7*24*60*60*1000 
        })
        return res.json({success:true,message:'logout'})
        
    } catch (error) {
         console.log(error)
        res.json({success:false})
        
    }
}