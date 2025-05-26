// userHandlers.mjs
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto"; // Usar randomUUID de node:crypto

import { JWT_EXPIRATION, JWT_SECRET_KEY } from "./settings.mjs";
import { insertUser, getUser } from "./db.mjs";

export const registerUser = (req, res) => { // Removido async pois não há awaits para Promises diretas aqui
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const existingUser = getUser.get({ $email: email }); // Removido await
  if (existingUser) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUserId = randomUUID(); // Usar randomUUID importado

  const newUser = insertUser.get({ // Removido await
    $id: newUserId,
    $name: name,
    $email: email,
    $password: hashedPassword,
  });

  if (!newUser) { // Adicionar verificação caso a inserção falhe por algum motivo
    return res.status(500).json({ error: "Failed to register user" });
  }

  return res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
};

export const loginUser = async (req, res) => { // Mantido async por causa do bcrypt.compare
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const user = getUser.get({ $email: email }); // Removido await

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ user: { id: user.id, email: user.email, name: user.name } }, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRATION });

  res.json({
    id: user.id, // Adicionar id do usuário na resposta do login
    email: user.email,
    name: user.name,
    token
  });
};