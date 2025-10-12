import multer from "multer";

export const createFileUploadHandler = (destination: string) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination); 
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); 
    }
  });

  return multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB file limit
  });
};
