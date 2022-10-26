const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/dev.env") });
require("../db/mongoose");

const app = express();
const userRouter = require("../routes/user");
const taskRouter = require("../routes/task");
const PORT = process.env.PORT || 8080;

// Enable necesssary middlewares
app.use(express.json());

// Use routers
app.use("/users", userRouter);
app.use("/tasks", taskRouter);

app.listen(PORT, () => console.log("The server is listening to port", PORT));
