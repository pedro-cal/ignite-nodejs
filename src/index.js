const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const currentUser = users.find((user) => user.username === username);

  if (!currentUser) {
    return response.status(404).json({ message: 'User not found' });
  }

  request.user = currentUser;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const usernameExists = users.find((item) => item.username === username) || false;
  if (usernameExists) return response.status(400).json({ error: 'User already exists' });

  const userObject = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(userObject);
  return response.status(201).json(userObject);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const userData = users.find((item) => item.username === username);

  return response.status(200).json(userData.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { title, deadline } = request.body;

  const userIndex = users.findIndex((item) => item.username === username);
  const currentUser = users.find((item) => item.username === username) || {};

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  currentUser.todos = [...currentUser.todos, newTodo];
  users.splice(userIndex, 1, currentUser);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;
  const { title, deadline } = request.body;

  const todos = user.todos;
  const currentTodo = todos.find((each) => each.id === id);

  if (!currentTodo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  currentTodo.title = title;
  currentTodo.deadline = new Date(deadline);

  const responseObj = { title: currentTodo.title, deadline: currentTodo.deadline, done: currentTodo.done };

  return response.status(200).json(responseObj);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  const currentUser = users.find((item) => item.username === username) || {};
  const todo = currentUser.todos.find(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).json();
});

module.exports = app;