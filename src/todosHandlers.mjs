// todosHandlers.mjs

import { randomUUID } from "node:crypto";
import * as db  from "./db.mjs";

export const allTodos = (req, res) => {
  // AJUSTE AQUI:
  const userId = req.user.user.id; // Alterado de req.user.id para req.user.user.id

  const allUserTodos = db.getAllTodos.all({ $user_id: userId });

  return res.status(200).json(
    allUserTodos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      done: Boolean(todo.done),
    }))
  );
}

export const createTodo = (req, res) => {
  // AJUSTE AQUI:
  const userId = req.user.user.id; // Alterado de req.user.id para req.user.user.id
  const text = req.body.text?.trim();

  if (!text || text.length === 0) {
    return res.status(400).json({ error: "Text is required" });
  }

  const newId = randomUUID();

  const newTodo = db.insertTodo.get({ $id: newId, $text: text, $user_id: userId });

  if (!newTodo) {
    return res.status(500).json({ error: "Failed to create todo" });
  }

  return res.status(200).json({
    id: newTodo.id,
    text: newTodo.text,
    done: Boolean(newTodo.done),
  });
};

export const updateTodo = (req, res) => {
  // AJUSTE AQUI:
  const userId = req.user.user.id; // Alterado de req.user.id para req.user.user.id
  const todoId = req.params.id;

  const todo = db.getTodo.get({ $id: todoId, $user_id: userId });

  if (!todo) {
    return res.status(404).json({ error: "Todo not found or access denied" });
  }

  const isTextUpdated = req.body.text !== undefined && req.body.text !== null;
  const isDoneUpdated = req.body.done !== undefined && req.body.done !== null;

  if (!isTextUpdated && !isDoneUpdated) {
    return res.status(400).json({ error: "Text or done is required" });
  }

  const newText = isTextUpdated ? req.body.text.trim() : todo.text;
  const newDone = isDoneUpdated ? Number(Boolean(req.body.done)) : todo.done;

  if (isTextUpdated && newText.length === 0) {
    return res.status(400).json({ error: "Text should not be empty" });
  }
  
  const updatedTodo = db.updateTodo.get({
    $id: todoId,
    $text: newText,
    $done: newDone,
    $user_id: userId, 
  });

  if (!updatedTodo) {
    return res.status(500).json({ error: "Failed to update todo" });
  }

  return res.status(200).json({
    id: updatedTodo.id,
    text: updatedTodo.text,
    done: Boolean(updatedTodo.done),
  });
}