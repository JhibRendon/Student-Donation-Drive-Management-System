/**
 * ============================================
 * CONCURRENCY CONTROL MIDDLEWARE
 * ============================================
 * 
 * Prevents duplicate requests from reaching the backend
 * Tracks in-flight requests and rejects concurrent duplicate operations
 * 
 * How it works:
 * 1. For each POST/PUT request, creates a unique key: (userId, endpoint, email/id, timestamp)
 * 2. Stores key in memory cache with 3-second window
 * 3. If duplicate request detected within window, returns 429 (Too Many Requests)
 * 4. Prevents race condition where both requests pass validation before either saves
 */

import crypto from 'crypto';

// In-memory cache for tracking in-flight requests
// Structure: { 'key': { timestamp, endpoint, userId, identifier } }
const requestCache = new Map();

// Cache cleanup interval (every 5 seconds)
setInterval(() => {
  const now = Date.now();
  const maxAge = 3000; // 3 seconds
  
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > maxAge) {
      requestCache.delete(key);
    }
  }
}, 5000);

/**
 * Generate a unique key for deduplication
 * @param {Object} req - Express request object
 * @returns {string} Unique identifier for the request
 */
const generateRequestKey = (req) => {
  const userId = req.admin?.id || req.user?.id || 'unknown';
  const endpoint = `${req.method}:${req.path}`;
  
  // For create/update operations, use email or ID as identifier
  let identifier = '';
  
  if (req.method === 'POST' && req.body?.email) {
    identifier = req.body.email;
  } else if (req.method === 'PUT' && req.params?.id) {
    identifier = req.params.id;
  } else if (req.method === 'POST' && req.body?.userId) {
    identifier = req.body.userId;
  }
  
  // Include request body hash for more robust deduplication
  const bodyHash = identifier ? 
    crypto.createHash('md5').update(identifier).digest('hex').substring(0, 8) :
    '';
  
  return `${userId}:${endpoint}:${bodyHash}`;
};

/**
 * Concurrency control middleware
 * Prevents duplicate concurrent requests (double-clicks, rapid submissions)
 */
export const concurrencyControl = (req, res, next) => {
  // Only apply to state-changing operations
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  const requestKey = generateRequestKey(req);
  const now = Date.now();
  
  // Check if this is a duplicate request
  if (requestCache.has(requestKey)) {
    const cachedRequest = requestCache.get(requestKey);
    const timeDiff = now - cachedRequest.timestamp;
    
    // If request is within 3-second window, it's a duplicate
    if (timeDiff < 3000) {
      console.warn(`⚠️ DUPLICATE REQUEST DETECTED (${timeDiff}ms ago)`);
      console.warn(`   Key: ${requestKey}`);
      console.warn(`   Endpoint: ${cachedRequest.endpoint}`);
      console.warn(`   User: ${cachedRequest.userId}`);
      
      return res.status(429).json({
        success: false,
        message: 'Duplicate request detected. Please wait before trying again.',
        code: 'DUPLICATE_REQUEST',
        retryAfter: Math.ceil((3000 - timeDiff) / 1000),
      });
    }
  }
  
  // Register this request in cache
  requestCache.set(requestKey, {
    timestamp: now,
    endpoint: `${req.method}:${req.path}`,
    userId: req.admin?.id || req.user?.id || 'unknown',
    identifier: req.body?.email || req.params?.id || 'unknown',
  });
  
  console.log(`✓ Request registered for deduplication: ${requestKey}`);
  
  next();
};

/**
 * Clear request cache (useful for testing or manual cleanup)
 */
export const clearRequestCache = () => {
  requestCache.clear();
  console.log('✓ Request cache cleared');
};

/**
 * Get cache status (for debugging)
 */
export const getCacheStatus = () => {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
    timestamp: new Date().toISOString(),
  };
};

export default concurrencyControl;
