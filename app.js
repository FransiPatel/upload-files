const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed!"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter,
});

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
// Render the upload page
app.get("/", (req, res) => {
  res.render("index");
});

// Upload endpoint
app.post(
    "/upload",
    upload.single("file"),
    (req, res) => {
      console.log("Uploaded file:", req.file);  // Log file details on successful upload
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }
      console.log("File uploaded successfully: ", req.file.filename);  // Log success message
      res.status(200).json({
        message: "File uploaded successfully.",
        file: req.file,
      });
    },
    (err, req, res, next) => {
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  );

// Delete endpoint
app.delete("/delete", (req, res) => {
    const { fileName } = req.body;
  
    if (!fileName) {
      return res.status(400).json({ message: "File name is required." });
    }
  
    const filePath = path.join(uploadDir, fileName);
  
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          return res.status(404).json({ message: "File not found." });
        }
        return res.status(500).json({ message: "Error deleting the file.", error: err });
      }
      console.log(`File deleted successfully: ${fileName}`);  // Log success message
      res.status(200).json({ message: "File deleted successfully." });
    });
  });
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
