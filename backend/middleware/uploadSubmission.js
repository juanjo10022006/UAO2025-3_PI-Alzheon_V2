import multer from 'multer';
import path from 'path';
import fs from 'fs';

const submissionsDir = path.join(process.cwd(), 'uploads/submissions');
fs.mkdirSync(submissionsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, submissionsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Tipo de archivo no permitido'), false);
  cb(null, true);
};

export const uploadSubmission = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});