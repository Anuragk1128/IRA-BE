const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const mongoose = require("mongoose")
const swaggerUi = require("swagger-ui-express")
const fs = require("fs")
const path = require("path")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())

// Routes
const authRoutes = require("./routes/auth")
app.use("/api/auth", authRoutes)
const adminAuthRoutes = require("./routes/adminAuth")
app.use("/api/admin/auth", adminAuthRoutes)
// Product routes
const productRoutes = require("./routes/products")
app.use("/api/products", productRoutes)
const adminProductRoutes = require("./routes/adminProducts")
app.use("/api/admin/products", adminProductRoutes)
// Category routes
const categoryRoutes = require("./routes/categories")
app.use("/api/categories", categoryRoutes)
const adminCategoryRoutes = require("./routes/adminCategories")
app.use("/api/admin/categories", adminCategoryRoutes)
// Admin users routes
const adminUsersRoutes = require("./routes/adminUsers")
app.use("/api/admin/users", adminUsersRoutes)
// Wishlist routes
const wishlistRoutes = require("./routes/wishlist")
app.use("/api/wishlist", wishlistRoutes)
// Cart routes removed (endpoints disabled)

// Serve the latest OpenAPI spec from disk to avoid require cache
app.get("/openapi.json", (req, res) => {
  try {
    const specPath = path.join(__dirname, "docs", "openapi.json")
    const raw = fs.readFileSync(specPath, "utf8")
    const spec = JSON.parse(raw)

    // Prefer deployed base URL in production
    const deployedUrl = process.env.PUBLIC_BASE_URL || "https://ira-be.onrender.com"
    if (!Array.isArray(spec.servers)) spec.servers = []
    if (process.env.NODE_ENV === "production") {
      // Put deployed first; optionally drop localhost to avoid accidental selection
      spec.servers = [{ url: deployedUrl }]
    } else {
      // Dev: keep both, deployed first so Swagger defaults to it
      const withDeployedFirst = [{ url: deployedUrl }, ...spec.servers.filter(s => s.url !== deployedUrl)]
      spec.servers = withDeployedFirst
    }

    res.setHeader("Content-Type", "application/json")
    // Prevent caching so Swagger UI always loads the latest spec
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", "0")
    res.send(JSON.stringify(spec))
  } catch (err) {
    console.error("Failed to read openapi.json:", err)
    res.status(500).json({ message: "Failed to load OpenAPI spec" })
  }
})

// Swagger UI (loads spec from /openapi.json)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: "/openapi.json" } }))

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok" })
})

// DB connect then start server
const uri = process.env.MONGODB_URI
if (!uri) {
  console.error("MONGODB_URI is not set in .env")
  process.exit(1)
}

console.log("Connecting to MongoDB ...")
mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected")
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

