const admin = require('firebase-admin');
require('dotenv').config();

let db = null;
let useFirebase = false;

// Try to initialize Firebase if credentials are provided
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    db = admin.database();
    useFirebase = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed, falling back to in-memory storage:', error.message);
  }
} else {
  console.log('Firebase credentials not configured — using in-memory storage');
  console.log('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to use Firebase');
}

// ---------------------------------------------------------------------------
// In-memory storage fallback
// ---------------------------------------------------------------------------
const memoryStore = new Map();

/**
 * Storage adapter that mirrors the Firebase Realtime Database ref/once/set/update
 * interface so route code can use the same API regardless of backing store.
 */
function createMemoryRef(path) {
  // Normalize path — remove leading/trailing slashes
  path = path.replace(/^\/+|\/+$/g, '');

  const getNestedValue = (obj, keys) => {
    for (const k of keys) {
      if (obj == null || typeof obj !== 'object') return undefined;
      obj = obj[k];
    }
    return obj;
  };

  const setNestedValue = (obj, keys, value) => {
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null || typeof obj[keys[i]] !== 'object') {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  };

  const keys = path.split('/');

  return {
    once: async () => {
      const root = memoryStore.get(keys[0]);
      const value = keys.length === 1 ? root : getNestedValue(root, keys.slice(1));
      return {
        exists: () => value !== undefined && value !== null,
        val: () => (value !== undefined ? JSON.parse(JSON.stringify(value)) : null),
      };
    },
    set: async (value) => {
      if (keys.length === 1) {
        memoryStore.set(keys[0], JSON.parse(JSON.stringify(value)));
      } else {
        let root = memoryStore.get(keys[0]);
        if (root == null || typeof root !== 'object') {
          root = {};
        }
        setNestedValue(root, keys.slice(1), JSON.parse(JSON.stringify(value)));
        memoryStore.set(keys[0], root);
      }
    },
    update: async (updates) => {
      let root = memoryStore.get(keys[0]);
      if (root == null || typeof root !== 'object') {
        root = {};
      }
      // Navigate to the target node
      let target = root;
      for (let i = 1; i < keys.length; i++) {
        if (target[keys[i]] == null || typeof target[keys[i]] !== 'object') {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }
      // Merge updates
      Object.assign(target, JSON.parse(JSON.stringify(updates)));
      memoryStore.set(keys[0], root);
    },
  };
}

// Create a db-like interface for in-memory storage
const memoryDb = {
  ref: (path) => createMemoryRef(path),
};

module.exports = {
  admin,
  db: useFirebase ? db : memoryDb,
  useFirebase,
};
