import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for project images
const projectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/projects';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'project-' + uniqueSuffix + fileExt);
  }
});

// Filter to accept only images
const imageFilter = function (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Accept only image files
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Тільки зображення дозволені до завантаження!'));
  }
  cb(null, true);
};

// Create upload middleware
export const projectImageUpload = multer({
  storage: projectStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
}).single('projectImage');