import mongoose from "mongoose"
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';//generate strings to hash passwords
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js'

//implementing sign up
export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();//session of a mongoose transaction
    session.startTransaction();

    try{
        //create a new user
        const {name, email, password} = req.body

        //check if user exists
        const existingUser= await User.findOne({email});

        if(existingUser){
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        //securing a password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUsers = await User.create([{ name, email, password: hashedPassword }], { session });
        const token = jwt.sign({ userId: newUsers[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: newUsers[0],
      }
    })

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}



//implementing sign in
export const signIn = async (req, res, next) => {
  try {
    const {email, password} = req.body

    //check if user exists

    const user = await User.findOne({ email });

    //if user doesn't exist
    if(!user){
      const error = new Error('user not found');
      error.statusCode = 404;
      throw error;
    }

    //if user exists validate the password
    // checks if password is the same as the password stored in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
      const error = new Error('invalid password');
      error.statusCode = 401;
      throw error;
    }

    //if password is valid
     const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

     res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        token,
        user,
      }
    });

  } catch (error) {
    next(error)
  }
}

//implementing sign out
export const signOut = async (req, res, next) => {}