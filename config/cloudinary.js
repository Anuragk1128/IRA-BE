const { v2: cloudinary } = require("cloudinary");

function connectCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });

  // Print a startup status similar to MongoDB
  cloudinary.api
    .ping()
    .then((r) => {
      console.log("Cloudinary connected");
    })
    .catch((err) => {
      const code = (err && err.response && err.response.status) || "";
      console.error("Cloudinary connection failed", code ? `(${code})` : "", "-", err.message || err);
    });

  return cloudinary;
}

module.exports = connectCloudinary;