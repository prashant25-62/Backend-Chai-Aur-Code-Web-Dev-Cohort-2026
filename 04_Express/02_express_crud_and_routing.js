const express = require("express");

// ---------------- BLOCK 1 : HTTP METHODS (CRUD) ----------------
function block_1_httpMethods() {
  return new Promise((resolve) => {
    const app = express();

    // Middleware → parse JSON request body
    app.use(express.json());

    // In-memory database (mock data)
    const routes = {
      1: { id: 1, name: "abc train 01", direction: "north" },
      2: { id: 2, name: "def train 02", direction: "south" },
    };

    // Auto-increment ID for new records
    let nextId = 3;

    // -------- GET all routes --------
    app.get("/routes", (req, res) => {
      res.json(Object.values(routes));
    });

    // -------- GET single route by ID --------
    app.get("/routes/:id", (req, res) => {
      const route = routes[req.params.id];

      if (!route) {
        return res.status(404).json({ error: "not found" });
      }

      res.json(route);
    });

    // -------- POST create new route --------
    app.post("/routes", (req, res) => {
      const newRoute = { id: nextId++, ...req.body };

      routes[newRoute.id] = newRoute;

      res.status(201).json(newRoute);
    });

    // -------- PUT full update --------
    app.put("/routes/:id", (req, res) => {
      const id = req.params.id;

      if (!routes[id]) {
        return res.status(404).json({ error: "not found" });
      }

      // Replace entire object
      routes[id] = { id: Number(id), ...req.body };

      res.json(routes[id]);
    });

    // -------- PATCH partial update --------
    app.patch("/routes/:id", (req, res) => {
      const id = req.params.id;

      if (!routes[id]) {
        return res.status(404).json({ error: "not found" });
      }

      // Merge existing + new fields
      routes[id] = { ...routes[id], ...req.body };

      res.json(routes[id]);
    });

    // -------- DELETE route --------
    app.delete("/routes/:id", (req, res) => {
      const id = req.params.id;

      if (!routes[id]) {
        return res.status(404).json({ error: "not found" });
      }

      delete routes[id];

      // 204 → No Content
      res.status(204).end();
    });

    // -------- START SERVER --------
    const server = app.listen(0, async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        //  GET all routes
        const listRes = await fetch(`${baseUrl}/routes`);
        console.log("GET /routes =>", await listRes.json());

        //  GET single route
        const singleRes = await fetch(`${baseUrl}/routes/1`);
        console.log("GET /routes/1 =>", await singleRes.json());

        //  POST create new route
        const createRes = await fetch(`${baseUrl}/routes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "ghi 03 train",
            direction: "east",
          }),
        });

        const createdRoute = await createRes.json();
        console.log("POST /routes =>", createdRoute);

        //  PUT full update
        const putRes = await fetch(`${baseUrl}/routes/1`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "updated train 01",
            direction: "west",
          }),
        });

        console.log("PUT /routes/1 =>", await putRes.json());

        //  PATCH partial update
        const patchRes = await fetch(`${baseUrl}/routes/2`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction: "east" }),
        });

        console.log("PATCH /routes/2 =>", await patchRes.json());

        //  DELETE route
        const deleteRes = await fetch(`${baseUrl}/routes/2`, {
          method: "DELETE",
        });

        console.log("DELETE /routes/2 => status", deleteRes.status);

      } catch (error) {
        console.log(error);
      }

      // Close server after tests
      server.close(() => {
        console.log("block 1 server closed");
        resolve();
      });
    });
  });
}


// ---------------- BLOCK 2 : ROUTES + WILDCARD + MIDDLEWARE ----------------
function block_2_routes() {
  return new Promise((resolve) => {
    const app = express();

    // Middleware → parse JSON
    app.use(express.json());

    // -------- WILDCARD ROUTE --------
    // Matches any path after /files/
    // Example:
    // /files/docs/readme.txt
    // /files/assets/style.css
    app.get("/files/*filepath", (req, res) => {
      const filePath = req.params.filepath;

      res.json({
        filepath: filePath,
        type: "wildcard",
      });
    });

    // -------- ROUTE CHAINING --------
    // Same path, different HTTP methods
    app
      .route("/schedule")

      .get((req, res) => {
        res.json({ method: "GET", message: "Fetch schedule" });
      })

      .post((req, res) => {
        res.json({ method: "POST", message: "Create schedule" });
      })

      .put((req, res) => {
        res.json({ method: "PUT", message: "Replace schedule" });
      })

      .patch((req, res) => {
        res.json({ method: "PATCH", message: "Update schedule" });
      })

      .delete((req, res) => {
        res.json({ method: "DELETE", message: "Delete schedule" });
      });

    // -------- MIDDLEWARE PREFIX --------
    // Runs for all routes starting with /api
    app.use("/api", (req, res, next) => {
      console.log("API middleware triggered");
      next(); // must call next()
    });

    // Test route under /api
    app.get("/api/test", (req, res) => {
      res.json({ message: "API route working" });
    });

    // -------- START SERVER --------
    const server = app.listen(0, async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        // -------- TEST: WILDCARD --------
        const fileRes = await fetch(`${baseUrl}/files/docs/readme.txt`);
        console.log("WILDCARD:", await fileRes.json());

        // -------- TEST: ROUTE CHAINING --------
        console.log("GET:", await (await fetch(`${baseUrl}/schedule`)).json());
        console.log("POST:", await (await fetch(`${baseUrl}/schedule`, { method: "POST" })).json());
        console.log("PUT:", await (await fetch(`${baseUrl}/schedule`, { method: "PUT" })).json());
        console.log("PATCH:", await (await fetch(`${baseUrl}/schedule`, { method: "PATCH" })).json());
        console.log("DELETE:", await (await fetch(`${baseUrl}/schedule`, { method: "DELETE" })).json());

        // -------- TEST: MIDDLEWARE --------
        const apiRes = await fetch(`${baseUrl}/api/test`);
        console.log("API TEST:", await apiRes.json());

      } catch (error) {
        console.log(error);
      } finally {
        // Close server
        server.close(() => {
          console.log("block 2 server closed");
          resolve();
        });
      }
    });
  });
}


// ---------------- MAIN FUNCTION ----------------
async function main() {
  await block_1_httpMethods(); // CRUD operations
  await block_2_routes();      // advanced routing
  process.exit(0);             // exit program
}

// Execute program
main();

