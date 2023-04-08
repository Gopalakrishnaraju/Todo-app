const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const checkValidValues = (request, response, next) => {
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
  const method = request.method;

  if (method === "GET") {
    const { status, priority, category, date } = request.query;

    if (date !== undefined) {
      const due_date = new Date(date);
      const isValidDate = isValid(due_date);
      if (isValidDate) {
        const newDate = format(due_date, "yyyy-MM-dd");
        request.dueDate = newDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    }
    if (status !== undefined && !statusList.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
    if (priority !== undefined && !priorityList.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
    if (category !== undefined && !categoryList.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      next();
    }
  }
  if (method === "POST" || method === "PUT") {
    const { status, priority, category, dueDate } = request.body;

    if (status !== undefined && !statusList.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
    if (priority !== undefined && !priorityList.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
    if (category !== undefined && !categoryList.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      next();
    }
  }
};

// API 1
app.get("/todos/", checkValidValues, async (request, response) => {
  const requestObject = request.query;
  const { search_q = "", priority, status, category } = requestObject;
  let getTodoQuery;
  const { dueDate } = request;
  switch (true) {
    case hasStatusAndPriority(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE status = '${status}' AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatus(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE status = '${status}' AND category = '${category}';`;
      break;
    case hasCategoryAndPriority(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE priority = '${priority}' AND category = '${category}';`;
      break;
    case hasStatus(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE status = '${status}';`;
      break;
    case hasPriority(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE priority = '${priority}';`;
      break;
    case hasCategory(requestObject):
      getTodoQuery = `SELECT * FROM todo 
                WHERE category = '${category}';`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo 
                WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  const data = await db.all(getTodoQuery);

  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = '${date}';`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 4
app.post("/todos/", checkValidValues, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, category, priority, status,  due_date)
  VALUES
    (${id}, '${todo}', '${category}', '${priority}', '${status}', '${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// API 5

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});