const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ success: false, message: error.message });
        }
        res.json({ success: true, url: result.secure_url, publicId: result.public_id });
      }
    );

    result.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
