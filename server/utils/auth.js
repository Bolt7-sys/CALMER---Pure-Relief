// CALMER auth utilities: passkey generation, hashing, and JWT.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'calmer-dev-secret-change-me'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d'

// ---- CALMER PASSKEY ----
// Clients:  CALMER-XXXX-XXXX-XXXX
// Admins:   CALMER-ADMIN-XXXX-XXXX-XXXX
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)

function block(len = 4) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

export function generatePasskey(role = 'client') {
  const parts = [block(), block(), block()]
  return role === 'admin'
    ? `CALMER-ADMIN-${parts.join('-')}`
    : `CALMER-${parts.join('-')}`
}

// Validate the literal FORMAT of a passkey string
export function isValidPasskeyFormat(passkey, role) {
  if (typeof passkey !== 'string') return false
  const clientRe = /^CALMER-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/
  const adminRe = /^CALMER-ADMIN-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/
  if (role === 'admin') return adminRe.test(passkey)
  if (role === 'client') return clientRe.test(passkey)
  return clientRe.test(passkey) || adminRe.test(passkey)
}

// ---- USERNAME ----
// Clients: @username    Admins: @admin-username
export function isValidUsername(username, role) {
  if (typeof username !== 'string') return false
  if (role === 'admin') return /^@admin-[a-z0-9_]{3,20}$/.test(username)
  return /^@[a-z0-9_]{3,20}$/.test(username) && !username.startsWith('@admin-')
}

export function inferRoleFromUsername(username) {
  return typeof username === 'string' && username.startsWith('@admin-') ? 'admin' : 'client'
}

// ---- HASHING ----
export async function hashPasskey(passkey) {
  return bcrypt.hash(passkey, 10)
}
export async function verifyPasskey(passkey, hash) {
  return bcrypt.compare(passkey, hash)
}

// ---- JWT ----
export function signToken(user) {
  return jwt.sign(
    { id: String(user._id), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}
export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}
