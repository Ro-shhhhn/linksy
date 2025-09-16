const express = require("express");
const router = express.Router();
const { shortenUrl, redirectUrl } = require("../controllers/urlController");

router.post("/shorten", shortenUrl);
router.get("/r/:shortCode", redirectUrl);

module.exports = router;
