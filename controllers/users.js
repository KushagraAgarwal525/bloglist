const userRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

userRouter.post("/", async (request, response) => {
  const { name, username, password } = request.body;
  if (!username || !password)
    return response
      .status(400)
      .json({ error: "Username and/or password missing" });
  if (username.length < 3 || password.length < 3)
    return response
      .status(400)
      .json({ error: "Username and/or password too short" });
  const userExists = await User.findOne({ username });
  if (userExists)
    return response.status(400).json({ error: "Username already in use" });
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const user = new User({ name, username, passwordHash });
  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

userRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs", {
    url: 1,
    title: 1,
    author: 1,
  });
  response.json(users);
});

userRouter.get("/:id", async (request, response) => {
  const users = await User.findById(request.params.id).populate("blogs", {
    url: 1,
    title: 1,
    author: 1,
  });
  response.json(users);
});

module.exports = userRouter;
