const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '874837483274837',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'a676b67565c6767a6767d6767f67671',
});

module.exports = cloudinary;
