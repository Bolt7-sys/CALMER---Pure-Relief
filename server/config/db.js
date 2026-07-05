import mongoose from 'mongoose'

// State flag: true when connected to a real MongoDB, false when using in-memory fallback.
export let usingMongo = false

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('⚠️  No MONGO_URI provided — starting with IN-MEMORY data store (data resets on restart).')
    console.warn('   Set MONGO_URI in .env to persist data with MongoDB.')
    usingMongo = false
    return false
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
    usingMongo = true
    console.log('✅ Connected to MongoDB')
    return true
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.warn('⚠️  Falling back to IN-MEMORY data store so the app keeps running.')
    usingMongo = false
    return false
  }
}
