// backend/controllers/urlController.js
const Url = require("../models/Url");
const crypto = require("crypto");

// Convert SHA256 to base62
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

// Build short URL for response
function buildShortUrl(shortCode) {
  const base = process.env.BACKEND_URL || "http://localhost:5000";
  return `${base}/r/${shortCode}`;
}

// POST /shorten - Create short URL following exact requirements
exports.shortenUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;
    
    if (!longUrl) {
      return res.status(400).json({ error: "longUrl is required" });
    }

    // Step 1: n = count(active docs), L = smallest_prime(n + 1)
    const n = await Url.countDocuments();
    let L = smallestPrime(n + 1);

    // Step 2: Compute h = base62(sha256(longUrl))
    const h = base62(longUrl);

    // Cap total probe attempts to avoid infinite loops
    const MAX_PROBE_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_PROBE_ATTEMPTS) {
      // Take first L chars as candidate
      const candidate = h.slice(0, L);

      // Step 3: Check if candidate exists
      const existing = await Url.findOne({ shortCode: candidate });

      if (!existing) {
        // No collision - insert new record
        try {
          // Step 4: Insert { longUrl, shortCode, createdAt }
          const newUrl = await Url.create({
            longUrl,
            shortCode: candidate,
            createdAt: new Date()
          });

          return res.json({
            shortCode: newUrl.shortCode,
            shortUrl: buildShortUrl(newUrl.shortCode),
            longUrl: newUrl.longUrl
          });

        } catch (error) {
          
          if (error.code === 11000) {
          
            L = nextPrime(L);
            attempts++;
            continue;
          }
          throw error;
        }

      } else {
        // Candidate exists - check if same longUrl
        if (existing.longUrl === longUrl) {
          // Same longUrl → return existing (deterministic)
          return res.json({
            shortCode: existing.shortCode,
            shortUrl: buildShortUrl(existing.shortCode),
            longUrl: existing.longUrl
          });
        } else {
          // Different longUrl → collision: compute L2 = next_prime(L+1)
          L = nextPrime(L);
          attempts++;
        }
      }
    }

    // Max probe attempts reached
    return res.status(500).json({ 
      error: "Failed to generate unique short code (max probe attempts reached)" 
    });

  } catch (error) {
    console.error("Error in shortenUrl:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /r/:shortCode → redirect or 404
exports.redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const urlDoc = await Url.findOne({ shortCode });
    
    if (!urlDoc) {
      return res.status(404).send("404 - Short link not found");
    }
    
    // Redirect to longUrl
    return res.redirect(urlDoc.longUrl);
    
  } catch (error) {
    console.error("Error in redirectUrl:", error);
    return res.status(500).send("Server error");
  }
};