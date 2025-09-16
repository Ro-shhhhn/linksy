// backend/controllers/urlController.js
const Url = require("../models/Url");
const crypto = require("crypto");

/**
 * Convert SHA256 hex string to a base62 string.
 * Uses BigInt to convert hex -> base62 characters.
 */
function sha256ToBase62(input) {
  const hex = crypto.createHash("sha256").update(input).digest("hex");
  // base62 characters
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // convert hex to BigInt
  let value = BigInt("0x" + hex);

  // if zero (very unlikely) return first char
  if (value === 0n) return chars[0];

  let out = "";
  while (value > 0n) {
    const rem = value % 62n;
    out = chars[Number(rem)] + out;
    value = value / 62n;
  }

  return out;
}

/** Simple primality test (sufficient for small numbers like count of docs) */
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/** Return smallest prime >= start (we'll pass n+1 or L+1 as needed) */
function nextPrime(start) {
  let x = Math.max(2, Math.floor(start));
  while (!isPrime(x)) x++;
  return x;
}

/** Build the external short URL that the user can click.
 * Prefers BACKEND_URL if provided, otherwise falls back to FRONTEND_URL, then localhost:5000.
 * (Keeping this flexible to match your current frontend/backed routing setup.)
 */
function buildShortUrl(shortCode) {
  const base = process.env.BACKEND_URL || process.env.FRONTEND_URL || "http://localhost:5000";
  // ensure no trailing slash
  return `${base.replace(/\/$/, "")}/r/${shortCode}`;
}

/**
 * POST /shorten
 * - deterministic: same longUrl -> same shortCode (unless DB changed)
 * - prime-length: start length = smallest prime > count(active docs)
 * - collision-probe: if shortCode collision with different longUrl, increase to next prime length and retry
 */
exports.shortenUrl = async (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ error: "longUrl is required" });

  try {
    // If longUrl already exists in DB, return its shortCode immediately (deterministic behavior)
    const existingByLong = await Url.findOne({ longUrl });
    if (existingByLong) {
      return res.json({
        shortCode: existingByLong.shortCode,
        shortUrl: buildShortUrl(existingByLong.shortCode),
        longUrl: existingByLong.longUrl,
      });
    }

    // 1) Count active documents (all docs in collection)
    const n = await Url.countDocuments();

    // 2) Smallest prime greater than n (convention used here: smallest_prime(n + 1))
    let L = nextPrime(n + 1);

    // 3) Compute base62(sha256(longUrl))
    const hashBase62 = sha256ToBase62(longUrl);

    // we will probe up to a maximum number of attempts to avoid infinite loops or runaway
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    // start candidate using first L chars. If the hash string is shorter than L (very unlikely),
    // use the whole hash (but SHA256->base62 should be long enough).
    let candidate = hashBase62.slice(0, L);

    while (attempts < MAX_ATTEMPTS) {
      // check DB for candidate
      const existing = await Url.findOne({ shortCode: candidate });

      if (!existing) {
        // candidate free — try to insert into DB
        try {
          const newDoc = await Url.create({ longUrl, shortCode: candidate });
          return res.json({
            shortCode: newDoc.shortCode,
            shortUrl: buildShortUrl(newDoc.shortCode),
            longUrl: newDoc.longUrl,
          });
        } catch (err) {
          // handle duplicate key error (concurrent insert); E11000 is duplicate key code
          if (err.name === "MongoServerError" && err.code === 11000) {
            // collision via race condition, fall through to probe with larger prime
            L = nextPrime(L + 1);
            candidate = hashBase62.slice(0, L);
            attempts++;
            continue;
          }
          // other DB error
          console.error("Error inserting URL:", err);
          return res.status(500).json({ error: "Database error while creating short URL" });
        }
      } else {
        // existing shortCode found
        if (existing.longUrl === longUrl) {
          // maps to same long URL — deterministic match (return existing)
          return res.json({
            shortCode: existing.shortCode,
            shortUrl: buildShortUrl(existing.shortCode),
            longUrl: existing.longUrl,
          });
        } else {
          // collision with different longUrl — probe with next prime length
          L = nextPrime(L + 1);
          candidate = hashBase62.slice(0, L);
          attempts++;
          continue;
        }
      }
    }

    // If we reach here, we failed to resolve collision within MAX_ATTEMPTS
    return res.status(500).json({ error: "Failed to generate unique short code (max probes reached)" });
  } catch (err) {
    console.error("Error in shortenUrl:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /r/:shortCode
 * - find by shortCode and redirect to longUrl (or return 404)
 */
exports.redirectUrl = async (req, res) => {
  const { shortCode } = req.params;
  try {
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).send("404 - Short link not found");
    }
    // redirect (backend-level redirect)
    return res.redirect(urlDoc.longUrl);
  } catch (err) {
    console.error("Error in redirectUrl:", err);
    return res.status(500).send("Server error");
  }
};
