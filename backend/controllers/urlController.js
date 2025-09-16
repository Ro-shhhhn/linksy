const Url = require("../models/Url");
const crypto = require("crypto");

function validateAndNormalizeUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: "URL is required" };
  }
  
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: "URL cannot be empty" };
  }
  
  // Block invalid inputs first
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: "Please enter a valid URL" };
  }
  
  // Check for double dots (invalid)
  if (trimmed.includes('..')) {
    return { valid: false, error: "Invalid URL format" };
  }
  
  // Check for misspelled protocols
  if (/^(htp|htps|http|https):\/\//.test(trimmed) && !/^https?:\/\//.test(trimmed)) {
    return { valid: false, error: "Invalid protocol. Use http:// or https://" };
  }
  
  // Check for incomplete protocols
  if (trimmed === 'http://' || trimmed === 'https://') {
    return { valid: false, error: "Please enter a complete URL" };
  }
  
  // Normalize URL - add https:// if no protocol
  let normalizedUrl = trimmed;
  if (!/^https?:\/\//.test(trimmed) && !/^ftp:\/\//.test(trimmed)) {
    normalizedUrl = `https://${trimmed}`;
  }
  
  // Final validation with URL constructor
  try {
    const urlObj = new URL(normalizedUrl);
    
    // Allow http, https, and ftp protocols
    if (!['http:', 'https:', 'ftp:'].includes(urlObj.protocol)) {
      return { valid: false, error: "Only HTTP, HTTPS, and FTP URLs are supported" };
    }
    
    // Check for valid hostname (must contain at least one dot for domain)
    if (!urlObj.hostname.includes('.') && !urlObj.hostname.startsWith('localhost')) {
      return { valid: false, error: "Please enter a valid domain name" };
    }
    
    return { valid: true, url: urlObj.href };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// Convert string to base62 hash
function base62(input) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  let num = BigInt("0x" + hash);
  if (num === 0n) return chars[0];
  
  let result = "";
  while (num > 0n) {
    result = chars[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}

// Check if number is prime
function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Get smallest prime >= start
function smallestPrime(start) {
  let num = Math.max(2, start);
  while (!isPrime(num)) num++;
  return num;
}

// Get next prime after current
function nextPrime(current) {
  return smallestPrime(current + 1);
}

// Build complete short URL
function buildShortUrl(shortCode) {
  const base = process.env.BACKEND_URL || "http://localhost:5000";
  return `${base}/r/${shortCode}`;
}

// Create short URL with collision resolution

exports.shortenUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;
    
    // Validate and normalize URL
    const validation = validateAndNormalizeUrl(longUrl);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const normalizedUrl = validation.url;

    // STEP 1: Check if URL already exists - DETERMINISTIC REQUIREMENT
    const existing = await Url.findOne({ longUrl: normalizedUrl });
    if (existing) {
      return res.json({
        shortCode: existing.shortCode,
        shortUrl: buildShortUrl(existing.shortCode),
        longUrl: existing.longUrl
      });
    }

    // STEP 2: Generate new short code following prime-length logic
    const n = await Url.countDocuments();
    let L = smallestPrime(n + 1);
    const h = base62(normalizedUrl);

    const MAX_PROBE_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_PROBE_ATTEMPTS) {
      const candidate = h.slice(0, L);
      const existingCode = await Url.findOne({ shortCode: candidate });

      if (!existingCode) {
        // No collision - create new entry
        try {
          const newUrl = await Url.create({
            longUrl: normalizedUrl,
            shortCode: candidate,
            createdAt: new Date()
          });

          return res.json({
            shortCode: newUrl.shortCode,
            shortUrl: buildShortUrl(newUrl.shortCode),
            longUrl: newUrl.longUrl
          });

        } catch (error) {
          // Handle race condition duplicate key
          if (error.code === 11000) {
            L = nextPrime(L);
            attempts++;
            continue;
          }
          throw error;
        }

      } else {
        // Collision detected - try next prime length
        L = nextPrime(L);
        attempts++;
      }
    }

    return res.status(500).json({ 
      error: "Failed to generate unique short code (max attempts reached)" 
    });

  } catch (error) {
    console.error("Error in shortenUrl:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
// Redirect short URL to long URL
exports.redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const urlDoc = await Url.findOne({ shortCode });
    
    if (!urlDoc) {
      return res.status(404).send("404 - Short link not found");
    }
    
    return res.redirect(urlDoc.longUrl);
    
  } catch (error) {
    console.error("Error in redirectUrl:", error);
    return res.status(500).send("Server error");
  }
};