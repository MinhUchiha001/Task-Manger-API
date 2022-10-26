const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { Task } = require("./task");

mongoose.connect("mongodb://127.0.0.1:27017/task-manager-api", {
  useNewUrlParser: true,
});

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
      validate(value) {
        if (!validator.isEmail(value))
          throw new Error("The entered email is not valid");
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) throw new Error("Age must be positive");
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password"))
          throw new Error("Password can not contain password!");
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// Prevent sensitive information to be exposed to users
userSchema.methods.toJSON = function () {
  const user = this;
  const newUser = user.toObject();
  delete newUser.password;
  delete newUser.tokens;
  return newUser;
};

// Function to generate a new authorization token and add it to the current user's list of tokens
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Find and return a user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw Error("Unable to login");
  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) throw Error("Unable to login");
  return user;
};

// Hash password before saving documents to the database
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password"))
    user.password = await bcrypt.hash(user.password, 8);

  next();
});

// Delete all created tasks when a user is deleted
userSchema.pre("remove", async function (req, res, next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
