import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { exec, execSync } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const PORT = 4000;
const APP_PORT = 3000;
const IS_WINDOWS = platform() === 'win32';

const app = express();
const server = new McpServer({
  name: 'codemie-capstone-deployer',
  version: '1.0.0',
});

// ── Tool: deploy_app ──────────────────────────────────────────────────────────
server.tool(
  'deploy_app',
  'Deploy the codemie-capstone app locally by pulling latest code from GitHub, installing dependencies, and starting the server on port 3000.',
  {
    branch: z.string().optional().describe('Git branch to deploy (default: main)'),
    use_docker: z.boolean().optional().describe('Build and run as Docker container instead of npm start'),
  },
  async ({ branch = 'main', use_docker = false }) => {
    const script = IS_WINDOWS
      ? `powershell -ExecutionPolicy Bypass -File "${PROJECT_DIR}\\scripts\\deploy-local.ps1" -Branch ${branch}${use_docker ? ' -UseDocker' : ''}`
      : `bash "${PROJECT_DIR}/scripts/deploy-local.sh" --branch ${branch}${use_docker ? ' --docker' : ''}`;

    console.log(`Running: ${script}`);
    return new Promise((resolve) => {
      exec(script, { cwd: PROJECT_DIR, timeout: 120000 }, (err, stdout, stderr) => {
        const output = (stdout + stderr).trim();
        if (err && !output.includes('Starting application') && !output.includes('App running at')) {
          resolve({ content: [{ type: 'text', text: `Deployment failed:\n${output}` }] });
        } else {
          resolve({
            content: [{
              type: 'text',
              text: `Deployment complete.\n\n${output}\n\nApp: http://localhost:${APP_PORT}\nLogin: demo / C0dem!e@Secure#24`,
            }],
          });
        }
      });
    });
  }
);

// ── Tool: app_status ──────────────────────────────────────────────────────────
server.tool(
  'app_status',
  'Check whether the codemie-capstone app is currently running on port 3000.',
  {},
  async () => {
    try {
      const response = await fetch(`http://localhost:${APP_PORT}/api/session`);
      const data = await response.json();
      return {
        content: [{
          type: 'text',
          text: `App is RUNNING on port ${APP_PORT}.\nSession endpoint: ${JSON.stringify(data)}\nURL: http://localhost:${APP_PORT}`,
        }],
      };
    } catch {
      return {
        content: [{ type: 'text', text: `App is NOT running on port ${APP_PORT}.` }],
      };
    }
  }
);

// ── Tool: stop_app ────────────────────────────────────────────────────────────
server.tool(
  'stop_app',
  'Stop the codemie-capstone app by killing the process on port 3000.',
  {},
  async () => {
    try {
      if (IS_WINDOWS) {
        const result = execSync(`netstat -ano | findstr :${APP_PORT}`, { encoding: 'utf8' });
        const match = result.match(/LISTENING\s+(\d+)/);
        if (match) {
          execSync(`taskkill /PID ${match[1]} /F`);
          return { content: [{ type: 'text', text: `Stopped process PID ${match[1]} on port ${APP_PORT}.` }] };
        }
      } else {
        execSync(`lsof -ti:${APP_PORT} | xargs kill -9`);
        return { content: [{ type: 'text', text: `Stopped process on port ${APP_PORT}.` }] };
      }
      return { content: [{ type: 'text', text: `No process found on port ${APP_PORT}.` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Stop failed: ${err.message}` }] };
    }
  }
);

// ── SSE transport (required for CodeMie to connect) ───────────────────────────
const transports = {};

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on('close', () => delete transports[transport.sessionId]);
  await server.connect(transport);
});

app.post('/messages', express.json(), async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (!transport) return res.status(400).json({ error: 'Session not found' });
  await transport.handlePostMessage(req, res);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', tools: ['deploy_app', 'app_status', 'stop_app'] }));

app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}`);
  console.log(`Tools: deploy_app, app_status, stop_app`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});
