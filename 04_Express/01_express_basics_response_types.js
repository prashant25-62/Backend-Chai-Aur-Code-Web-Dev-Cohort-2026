const express = require("express")

// ---------------- BLOCK 1 : BASIC SERVER ----------------
function block_1_basicServer() {
  return new Promise((resolve) => {
    const app = express()

    // Middleware to parse JSON body
    app.use(express.json())

    // Route: GET /menu - returns list of items
    app.get("/menu", (req, res) => {
      res.json({
        items: ["thali", "biryani"]
      })
    })

    // Route: GET /search - query params handling
    app.get("/search", (req, res) => {
      const { q: searchQuery, limit } = req.query

      res.json({
        query: searchQuery,
        limit: limit || "10" // default value if not provided
      })
    })

    // Route: GET /menu/:itemId - route params
    app.get("/menu/:itemId", (req, res) => {
      const { itemId } = req.params

      res.json({
        item: itemId,
        price: 149
      })
    })

    // Route: POST /order - create new order
    app.post("/order", (req, res) => {
      const orderPayload = req.body

      res.status(201).json({
        status: "created",
        order: orderPayload
      })
    })

    // Start server on random available port
    const server = app.listen(0, async () => {
      const port = server.address().port
      const baseUrl = `http://127.0.0.1:${port}`

      try {
        // -------- TEST: GET /menu --------
        const menuResponse = await fetch(`${baseUrl}/menu`)
        const menuResult = await menuResponse.json()
        console.log("GET /menu", JSON.stringify(menuResult))

        // Normal object logging
        console.log("GET /menu:", menuResult)
        console.log("=================================")

        // -------- TEST: GET /search --------
        const searchResponse = await fetch(`${baseUrl}/search?q=biryani&limit=5&page=3`)
        const searchResult = await searchResponse.json()
        console.log("GET /search", JSON.stringify(searchResult))

        // -------- TEST: GET /menu/:id --------
        const itemResponse = await fetch(`${baseUrl}/menu/42`)
        const itemResult = await itemResponse.json()
        console.log("GET /menu/:id", JSON.stringify(itemResult))
        console.log("======================================")

        // -------- TEST: POST /order --------
        const orderResponse = await fetch(`${baseUrl}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dish: "biryani",
            quantity: 2
          })
        })

        const orderResult = await orderResponse.json()
        console.log("POST /order", JSON.stringify(orderResult))
        console.log("======================================")

      } catch (error) {
        console.log(error)
      }

      // Close server after tests
      server.close(() => {
        console.log("block 1 served....")
        resolve()
      })
    })
  })
}


// ---------------- BLOCK 2 : RESPONSE TYPES ----------------
function block_2_response() {
  return new Promise((resolve) => {
    const app = express()

    // Route: send plain text response
    app.get("/text", (req, res) => {
      res.send("hello world")
    })

    // Route: send JSON response
    app.get("/json", (req, res) => {
      res.json({
        framework: "express",
        version: "6.1.1"
      })
    })

    // Route: custom 404 response
    app.get("/not-found", (req, res) => {
      res.status(404).json({
        error: "page not found"
      })
    })

    // Route: health check (only status)
    app.get("/health", (req, res) => {
      res.sendStatus(200)
    })

    // Route: redirect to new route (301 permanent)
    app.get("/old-menu", (req, res) => {
      // Useful for tracking old API usage
      res.redirect(301, "/new-menu")
    })

    // Route: send XML response
    app.get("/xml", (req, res) => {
      res
        .type("application/xml") // set content-type
        .send("<dish><name>Biryani</name></dish>")
    })

    // Route: custom headers
    app.get("/custom-headers", (req, res) => {
      res.set("X-Powered-By", "ChaiCode")
      res.set("X-Request-Id", "ChaiCode")

      res.json({
        message: "Custom Header Set"
      })
    })

    // Route: no content response (204)
    app.get("/no-content", (req, res) => {
      res.status(204).end()
    })

    // Start server
    const server = app.listen(0, async () => {
      const port = server.address().port
      const baseUrl = `http://127.0.0.1:${port}`

      try {
        // -------- TEST: TEXT --------
        const textResponse = await fetch(`${baseUrl}/text`)
        const textResult = await textResponse.text()
        console.log("TEXT:", textResult)

        // -------- TEST: JSON --------
        const jsonResponse = await fetch(`${baseUrl}/json`)
        const jsonResult = await jsonResponse.json()
        console.log("JSON:", jsonResult)

        // -------- TEST: 404 --------
        const notFoundResponse = await fetch(`${baseUrl}/not-found`)
        const notFoundResult = await notFoundResponse.json()
        console.log("NOT FOUND:", notFoundResponse.status, notFoundResult)

        // -------- TEST: HEALTH --------
        const healthResponse = await fetch(`${baseUrl}/health`)
        console.log("HEALTH STATUS:", healthResponse.status)

        // -------- TEST: REDIRECT --------
        const redirectResponse = await fetch(`${baseUrl}/old-menu`, {
          redirect: "manual" // prevent auto-follow
        })
        console.log("REDIRECT STATUS:", redirectResponse.status)
        console.log("REDIRECT LOCATION:", redirectResponse.headers.get("location"))

        // -------- TEST: XML --------
        const xmlResponse = await fetch(`${baseUrl}/xml`)
        const xmlResult = await xmlResponse.text()
        console.log("XML:", xmlResult)

        // -------- TEST: HEADERS --------
        const headerResponse = await fetch(`${baseUrl}/custom-headers`)
        const headerResult = await headerResponse.json()
        console.log("CUSTOM HEADER:", headerResult)
        console.log("X-Powered-By:", headerResponse.headers.get("X-Powered-By"))

        // -------- TEST: NO CONTENT --------
        const noContentResponse = await fetch(`${baseUrl}/no-content`)
        console.log("NO CONTENT STATUS:", noContentResponse.status)

      } catch (error) {
        console.log(error)
      } finally {
        // Always close server
        server.close(() => {
          console.log("block 2 served....")
          resolve()
        })
      }
    })
  })
}


// ---------------- MAIN FUNCTION ----------------
async function main() {
  await block_1_basicServer() // run block 1
  await block_2_response()    // run block 2
  process.exit(0)             // exit process
}

// Execute program
main()