import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { MultiAgentSystem } from './agent-system';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let connectedClients: Set<WebSocket> = new Set();

// Broadcast to all connected clients
export function broadcast(data: any) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('✅ Dashboard connected');
  connectedClients.add(ws);

  ws.on('close', () => {
    console.log('❌ Dashboard disconnected');
    connectedClients.delete(ws);
  });
});

// API endpoint to start a task
app.post('/api/start', async (req, res) => {
  const { userInput } = req.body;
  
  if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }

  console.log(`🚀 Starting task: "${userInput}"`);

  // Start task asynchronously
  const system = new MultiAgentSystem();
  
  // Run in background
  system.run(userInput).catch(err => {
    broadcast({
      type: 'error',
      data: { message: err.message },
      timestamp: new Date().toISOString()
    });
  });

  res.json({ status: 'started', userInput });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000\n`);
});