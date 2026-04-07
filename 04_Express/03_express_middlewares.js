const express = require("express");

function first() {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    // ================== ROLE MIDDLEWARE ==================
    function getRole(role) {
      return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
          return res.status(403).json({ error: `${role} required` });
        }
        next();
      };
    }

    // ================== LOGGER ==================
    const logs = [];

    app.use((req, res, next) => {
      const logEntry = `${req.method} : ${req.url}`;
      logs.push(logEntry);
      console.log(`LOGS: ${logEntry}`);
      next();
    });

    // ================== TIMER ==================
    app.use((req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log(`TIMER - ${req.method} ${req.url} ${duration}ms`);
      });

      next();
    });

    // ================== AUTH ==================
    function autme(req, res, next) {
      const token = req.headers["my-token"];

      if (!token) {
        return res.status(401).json({ message: "no token" });
      }

      if (token !== "secret") {
        return res.status(403).json({ message: "invalid token" });
      }

      req.user = { id: 1, name: "abcd", role: "admin" };
      next();
    }

    // ================== RATE LIMIT ==================
    function rateLimit(maxRequest) {
      let count = 0;

      return (req, res, next) => {
        count++;

        if (count > maxRequest) {
          return res
            .status(429)
            .json({ error: "Too many requests, try later" });
        }

        next();
      };
    }

    const limitedEndpoint = rateLimit(3);

    // ================== ROUTES ==================

    app.get("/home", (req, res) => {
      res.send("home");
    });

    app.get("/exit", (req, res) => {
      res.json({ name: "hello" });
    });

    app.get("/check", autme, (req, res) => {
      res.json({
        message: "protected user",
        user: req.user,
      });
    });

    app.get("/profile", autme, getRole("admin"), (req, res) => {
      res.json({
        message: "Admin profile",
        user: req.user,
      });
    });

    app.get("/middleware", (req, res) => {
      res.json(logs);
    });

    // -------- SINGLE ROUTE RATE LIMIT --------
    app.get("/limited", limitedEndpoint, (req, res) => {
      res.json({ message: "Limited route accessed" });
    });

    // -------- APPLY RATE LIMIT TO GROUP (/api) --------
    app.use("/api", limitedEndpoint);

    app.get("/api/data", (req, res) => {
      res.json({ message: "API data accessed" });
    });

    // ================== SERVER ==================
    const server = app.listen(0, async () => {
      const port = server.address().port;
      const base = `http://127.0.0.1:${port}`;

      try {
        console.log(await (await fetch(`${base}/home`)).text());
        console.log(await (await fetch(`${base}/exit`)).json());

        console.log(await (await fetch(`${base}/middleware`)).json());

        console.log(
          "WRONG TOKEN =>",
          await (
            await fetch(`${base}/check`, {
              headers: { "my-token": "abc" },
            })
          ).json()
        );

        console.log(
          "CORRECT TOKEN =>",
          await (
            await fetch(`${base}/check`, {
              headers: { "my-token": "secret" },
            })
          ).json()
        );

        console.log(
          "PROFILE =>",
          await (
            await fetch(`${base}/profile`, {
              headers: { "my-token": "secret" },
            })
          ).json()
        );

        // -------- RATE LIMIT TEST (/api) --------
        for (let i = 1; i <= 5; i++) {
          const res = await fetch(`${base}/api/data`);
          const data = await res.json();
          console.log(`API Request ${i}:`, res.status, data);
        }

      } catch (error) {
        console.error(error);
      }

      server.close(() => {
        console.log("server closed");
        resolve();
      });
    });
  });
}

async function main() {
  await first();
  process.exit(0);
}

main();