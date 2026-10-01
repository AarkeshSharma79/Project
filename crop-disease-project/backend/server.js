const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;
const FLASK_API_URL = 'http://127.0.0.1:5000/predict';

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Validate image files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WEBP are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Endpoint to receive image and forward to Flask API
app.post('/api/predict', upload.any(), async (req, res) => {
  const uploadedFile = req.file || (req.files && req.files[0]);
  if (!uploadedFile) {
    return res.status(400).json({ error: 'No image uploaded or invalid file type' });
  }

  const filePath = uploadedFile.path;

  try {
    // Prepare form data to send to Flask
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    // Send to Flask ML API
    const flaskResponse = await axios.post(FLASK_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Return prediction to React
    res.json(flaskResponse.data);

  } catch (error) {
    console.error('Error calling Flask API:', error.message);
    
    // Check if error is from Flask API or network issue
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({ 
        error: error.response.data.error || 'Failed to process image in ML model.' 
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({ error: 'Python ML API is currently unavailable.' });
    } else {
      // Something happened in setting up the request
      res.status(500).json({ error: 'Internal server error while processing request.' });
    }
  } finally {
    // Clean up: delete the uploaded file after processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Handle Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Node server running on http://localhost:${PORT}`);
});
