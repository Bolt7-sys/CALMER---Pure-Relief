import { store } from '../data/store.js'

// GET /api/products?category=Flower
export async function listProducts(req, res) {
  try {
    const category = req.query.category
    const products = await store.listProducts(category)
    return res.json({ products })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load products', detail: err.message })
  }
}

// GET /api/products/:id
export async function getProduct(req, res) {
  try {
    const product = await store.findProductById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json({ product })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load product', detail: err.message })
  }
}

// POST /api/products (admin)
export async function createProduct(req, res) {
  try {
    const { name, description, category, price, thcContent, cbdContent, imageUrl, stock, featured, isNewArrival } = req.body || {}
    if (!name || !category || price == null) {
      return res.status(400).json({ error: 'name, category and price are required.' })
    }
    const product = await store.createProduct({
      name, description: description || '', category,
      price: Number(price), thcContent: thcContent || '', cbdContent: cbdContent || '',
      imageUrl: imageUrl || '', stock: Number(stock) || 0,
      featured: !!featured, isNewArrival: !!isNewArrival
    })
    return res.status(201).json({ product })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create product', detail: err.message })
  }
}

// PUT /api/products/:id (admin)
export async function updateProduct(req, res) {
  try {
    const patch = { ...req.body }
    if (patch.price != null) patch.price = Number(patch.price)
    if (patch.stock != null) patch.stock = Number(patch.stock)
    const product = await store.updateProduct(req.params.id, patch)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json({ product })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update product', detail: err.message })
  }
}

// DELETE /api/products/:id (admin)
export async function deleteProduct(req, res) {
  try {
    await store.deleteProduct(req.params.id)
    return res.json({ message: 'Product deleted' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete product', detail: err.message })
  }
}
