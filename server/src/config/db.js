import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection String:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.error('Stack Trace:', error.stack);
        process.exit(1);
    }
};