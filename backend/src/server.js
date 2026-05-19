import http from 'http'
import app from './app.js'
import { connectDb } from './config/db.js'
import env from './config/env.js'
import { initSockets } from './sockets/index.js'

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const start = async () => {
  await connectDb()
  const server = http.createServer(app)
  initSockets(server)
  server.listen(env.port, () => {
    console.log(`Server running on ${env.port}`)
  })
}

start()
