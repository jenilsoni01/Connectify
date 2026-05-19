/* ── E2E Encryption Utility (Web Crypto API) ── */

const DB_NAME = 'connectify-e2ee'
const STORE_NAME = 'keys'
const KEY_ID = 'user-keypair'

/* ── IndexedDB helpers ── */
const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const dbGet = async (key) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const dbPut = async (key, value) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/* ── Key Generation ── */
export const generateKeyPair = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
  return keyPair
}

/* ── Export / Import Keys ── */
export const exportPublicKey = async (key) => {
  const exported = await crypto.subtle.exportKey('spki', key)
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  return `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`
}

export const importPublicKey = async (pem) => {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s/g, '')
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'spki',
    binary.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  )
}

/* ── Store / Retrieve private key from IndexedDB ── */
export const storePrivateKey = async (privateKey) => {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey)
  await dbPut(KEY_ID, exported)
}

export const getStoredPrivateKey = async () => {
  const raw = await dbGet(KEY_ID)
  if (!raw) return null
  return crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  )
}

/* ── Encrypt a message for multiple recipients ── */
export const encryptMessage = async (plaintext, recipientPublicKeys) => {
  /* Generate random AES-GCM key for this message */
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded)

  /* Export AES key */
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)

  /* Wrap AES key for each recipient's RSA public key */
  const encryptedKeys = {}
  for (const [userId, publicKey] of Object.entries(recipientPublicKeys)) {
    const cryptoKey = typeof publicKey === 'string' ? await importPublicKey(publicKey) : publicKey
    const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cryptoKey, rawAesKey)
    encryptedKeys[userId] = btoa(String.fromCharCode(...new Uint8Array(wrappedKey)))
  }

  /* Combine IV + ciphertext */
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  const encryptedContent = btoa(String.fromCharCode(...combined))

  return { encryptedContent, encryptedKeys }
}

/* ── Decrypt a message ── */
export const decryptMessage = async (encryptedContent, wrappedKeyB64, privateKey) => {
  /* Unwrap AES key */
  const wrappedKey = Uint8Array.from(atob(wrappedKeyB64), (c) => c.charCodeAt(0))
  const rawAesKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedKey.buffer)
  const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])

  /* Separate IV and ciphertext */
  const combined = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext.buffer)
  return new TextDecoder().decode(decrypted)
}

/* ── Initialize: generate keypair if needed ── */
export const initializeE2EE = async () => {
  const existing = await getStoredPrivateKey()
  if (existing) {
    return { privateKey: existing, isNew: false }
  }
  const keyPair = await generateKeyPair()
  await storePrivateKey(keyPair.privateKey)
  const publicKeyPem = await exportPublicKey(keyPair.publicKey)
  return { privateKey: keyPair.privateKey, publicKeyPem, isNew: true }
}
