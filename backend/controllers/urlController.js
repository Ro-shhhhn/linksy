const Url = require("../models/Url");
const crypto = require("crypto");

// Generate random short code (like "a1bk9")
function generateShortCode() {
  return crypto.randomBytes(3).toString("base64url"); // ~5 chars
}

// POST /shorten
exports.shortenUrl = async (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: "Long URL is required" });
  }

  try {
    // Check if already exists
    let existing = await Url.findOne({ longUrl });
    if (existing) {
      return res.json({
        shortUrl: `${process.env.FRONTEND_URL}/r/${existing.shortCode}`,
        longUrl: existing.longUrl
      });
    }

    const shortCode = generateShortCode();

    const newUrl = new Url({ shortCode, longUrl });
    await newUrl.save();

    res.json({
      shortUrl: `${process.env.FRONTEND_URL}/r/${shortCode}`,
      longUrl
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /r/:shortCode
exports.redirectUrl = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).send("404 - Link not found");
    }
    res.redirect(url.longUrl);
  } catch (error) {
    res.status(500).send("Server error");
  }
};
