import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_events');
    
    // Check if owner already exists
    const existingOwner = await User.findOne({ role: 'owner' });
    
    if (existingOwner) {
      console.log('Owner already exists');
      return;
    }

    // Create default owner
    const owner = new User({
      userId: '808690',
      password: 'OwnerOfW56',
      role: 'owner'
    });

    await owner.save();
    console.log('Owner created successfully');
    console.log('ID: 808690');
    console.log('Password: OwnerOfW56');
    
  } catch (error) {
    console.error('Error creating owner:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedOwner();