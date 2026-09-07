const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (folderName) => {
  const uploadDir = path.join(__dirname, `../../uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${folderName.slice(0, -1)}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, webp) and PDFs are allowed!'));
    }
  };

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  });
};

const createDocAndProfileUploader = () => {
  const documentsDir = path.join(__dirname, '../../uploads/documents');
  const profilesDir = path.join(__dirname, '../../uploads/profiles');

  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });
  if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'profile_photo') {
        cb(null, profilesDir);
      } else {
        cb(null, documentsDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, webp) and PDFs are allowed!'));
    }
  };

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  });
};

const uploadDocument = createUploader('documents');
const uploadProfile = createUploader('profiles');
const uploadDocWithProfile = createDocAndProfileUploader().fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'document_file', maxCount: 1 },
]);

module.exports = {
  uploadDocument,
  uploadProfile,
  uploadDocWithProfile,
};
