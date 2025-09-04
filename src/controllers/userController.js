import User from "../models/User.js";

export const me = (req, res) => {
  res.json({ user: req.user || null });
};

export const listUsers = async (_req, res) => {
  const users = await User.find().select("-__v");
  res.json(users);
};
