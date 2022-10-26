const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendGoodbyeEmail } = require("../emails/account.js");

// Create a new user
router.post("/", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).json({ user, token });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get user's profile
router.get("/me", auth, async (req, res) => {
  res.status(200).send(req.user);
});

// Update a user by id
router.patch("/me", auth, async (req, res) => {
  const validFields = ["name", "email", "age", "password"];
  const updatedFields = Object.keys(req.body);

  const isValidOperation = updatedFields.every((field) =>
    validFields.includes(field)
  );

  if (!isValidOperation)
    return res
      .status(400)
      .json({ error: "One or more unexisting updated fields" });

  try {
    updatedFields.forEach((field) => (req.user[field] = req.body[field]));
    await req.user.save();
    res.status(200).json(req.user);
  } catch (e) {
    res.status(404).json(e.message);
  }
});

// Log a user in
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const jwt = await user.generateAuthToken();
    res.status(200).json({ data: user, token: jwt });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Log a user out
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

// Log a user out from all devices
router.post("/logout/all", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

// Delete current user
router.delete("/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendGoodbyeEmail(req.user.email, req.user.name);
    res.status(200).json({ data: req.user });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Upload user avatar
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|jpeg)$/))
      cb(new Error("Only accept jpg and png filetypes"));
    cb(undefined, true);
  },
});

router.post(
  "/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.user.avatar)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send();
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// Delete a user's avatar
router.delete("/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Serve avatar
router.get("/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw Error("Bad request");
    res.set("Content-type", "image/png");
    res.status(200).send(user.avatar);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

module.exports = router;
