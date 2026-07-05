import { store } from '../data/store.js'
import {
  generatePasskey, hashPasskey, verifyPasskey, signToken,
  isValidUsername, isValidPasskeyFormat, inferRoleFromUsername
} from '../utils/auth.js'

// POST /api/auth/register
// Body: { username, role, fullName, email, phone }
// Server GENERATES a one-time CALMER passkey, returns it ONCE (plaintext) to the user.
export async function register(req, res) {
  try {
    let { username, role, fullName, email, phone } = req.body || {}
    role = role === 'admin' ? 'admin' : 'client'

    username = (username || '').trim().toLowerCase()
    if (!username.startsWith('@')) username = '@' + username

    if (!isValidUsername(username, role)) {
      return res.status(400).json({
        error: role === 'admin'
          ? 'Admin username must look like @admin-yourname (3-20 chars, a-z 0-9 _).'
          : 'Username must look like @yourname (3-20 chars, a-z 0-9 _) and cannot start with @admin-.'
      })
    }

    const existing = await store.findUserByUsername(username)
    if (existing) return res.status(409).json({ error: 'That username is already taken.' })

    // Generate the CALMER PASSKEY (shown only once)
    const passkey = generatePasskey(role)
    const hashed = await hashPasskey(passkey)

    const user = await store.createUser({
      username, passkey: hashed, role,
      fullName: fullName || '', email: email || '', phone: phone || '',
      isActive: true
    })

    const token = signToken(user)
    return res.status(201).json({
      message: 'Account created. Save your CALMER PASSKEY — it is shown only once.',
      passkey, // ONE-TIME reveal
      token,
      user: { id: String(user._id), username: user.username, role: user.role, fullName: user.fullName }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed', detail: err.message })
  }
}

// POST /api/auth/login
// Body: { username, passkey }
export async function login(req, res) {
  try {
    let { username, passkey } = req.body || {}
    username = (username || '').trim().toLowerCase()
    if (!username.startsWith('@')) username = '@' + username
    passkey = (passkey || '').trim().toUpperCase()

    const role = inferRoleFromUsername(username)
    if (!isValidPasskeyFormat(passkey, role)) {
      return res.status(400).json({ error: 'Invalid passkey format. Expected CALMER-XXXX-XXXX-XXXX.' })
    }

    const user = await store.findUserByUsername(username)
    if (!user) return res.status(401).json({ error: 'Invalid username or passkey.' })
    if (!user.isActive) return res.status(403).json({ error: 'Account disabled. Contact support.' })

    const ok = await verifyPasskey(passkey, user.passkey)
    if (!ok) return res.status(401).json({ error: 'Invalid username or passkey.' })

    const token = signToken(user)
    return res.json({
      message: 'Welcome back to CALMER.',
      token,
      user: { id: String(user._id), username: user.username, role: user.role, fullName: user.fullName }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Login failed', detail: err.message })
  }
}

// GET /api/auth/me
export async function me(req, res) {
  return res.json({ user: req.user })
}
