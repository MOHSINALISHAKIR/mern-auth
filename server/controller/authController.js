import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import transproter from '../config/nodemailer.js';

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
        const mailOptions= {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:'welcome to website',
            text:`Welcome to website . Your account has been  created with email :${email}`
        }
        await transproter.sendMail(mailOptions)
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
        const user = await userModel.findOne({email})
        console.log(user)
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
        return res.json({success:true,message:'login successfully'})


        
    } catch (error) {
        console.log(error)
        res.json({success:false})
    }
}
export const logOut = async(req,res)=>{
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
export const sendVerifyOtp = async (req,res)=>{
    const {userId}= req.body;
    const user = await userModel.findById(userId)
    if(user.isAccountVerified){
        return res.json({success:false,message:'Account already verified'})
    }
    const otp= String(Math.floor(100000+Math.random()*900000))
    user.verifyOtp=otp;
    user.verifyOtpExpireAt=Date.now()+24*60*60*1000
    await user.save()
    const mailOption={
        from:process.env.SENDER_EMAIL,
        to:user.email,
        subject:'Account Verification OTP',
        text:`Your OTP ${otp}`
    }
    await transproter.sendMail(mailOption)
    res.json({success:true,message:'verification send'})
}
export const verifyEmail = async (req,res)=>{
    const {userId,otp}= req.body;
    if(!userId||!otp){
        return res.json({success:false,message:'send otp please'})
    }
    try {
        const user= await userModel.findById(userId)
        if(!user){
            return res.json({success:false,message:'user not found'})
        }
        if(user.verifyOtp === ''||user.verifyOtp!==otp){
            return res.json({success:false,message:'invalid otp'})
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success:false,message:'otp expired'})
        }
        user.isAccountVerified=true
        user.verifyOtpExpireAt=0
        await user.save()
        return res.json({success:true,message:'email verified'})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
        
    }
}