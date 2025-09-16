const express = require("express");
const router = express.Router();
const { shortenUrl, redirectUrl } = require("../controllers/urlController");

// Shorten URL
router.post("/shorten", shortenUrl);

// Redirect to original URL
router.get("/r/:shortCode", redirectUrl);

module.exports = router;
