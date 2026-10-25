const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

// Configure reliable DNS servers to prevent querySrv ECONNREFUSED on Windows / ISP DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // If setting DNS servers fails or is not permitted, proceed with system defaults
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('\n============================================================');
    console.warn('⚠️  MONGODB_URI is not set in your .env file!');
    console.warn('   The server will start, but database operations will fail.');
    console.warn('   Add your MongoDB Atlas connection string in .env:');
    console.warn('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/aldrin_art');
    console.warn('============================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully to host: ${conn.connection.host}`);
    console.log(`📁 Database name: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:');
    console.error(error.message);
    console.error('\nTroubleshooting Checklist:');
    console.error('1. Check that your IP address is whitelisted in MongoDB Atlas (Network Access -> 0.0.0.0/0).');
    console.error('2. Confirm your database username and password in the connection string.');
    console.error('3. Ensure special characters in your password are URL-encoded if applicable.\n');
    return false;
  }
};

module.exports = connectDB;
