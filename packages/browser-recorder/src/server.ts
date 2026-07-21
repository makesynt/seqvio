import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { requestAiPlan } from './planner';
import { runPipeline } from './pipeline';
import { samplePlan } from './sample';
import type { RecorderJob } from './types';
import { validatePlan } from './validate';

const jobs = new Map<string, RecorderJob>();

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 2_000_000) throw new Error('Request body is too large');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function serveFile(req: http.IncomingMessage, res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath);
  const contentType = ext === '.mp4' ? 'video/mp4'
    : ext === '.js' ? 'text/javascript; charset=utf-8'
    : ext === '.css' ? 'text/css; charset=utf-8'
    : ext === '.html' ? 'text/html; charset=utf-8'
    : 'application/octet-stream';
  const range = req.headers.range;
  if (range && ext === '.mp4') {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      res.writeHead(206, {
        'content-type': contentType,
        'content-length': end - start + 1,
        'content-range': `bytes ${start}-${end}/${stat.size}`,
        'accept-ranges': 'bytes',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }
  res.writeHead(200, { 'content-type': contentType, 'content-length': stat.size });
  fs.createReadStream(filePath).pipe(res);
}

function demoHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font:16px system-ui,sans-serif}.shell{width:1180px;margin:0 auto;padding:50px}.top{display:flex;justify-content:space-between;align-items:center}.brand{font-weight:800;font-size:24px}.status{color:#287653}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;margin-top:42px}.panel{background:white;border:1px solid #dce2ec;padding:28px;box-shadow:0 14px 36px rgba(35,49,75,.08)}label{display:block;font-size:13px;font-weight:700;margin:20px 0 8px}input{width:100%;height:48px;border:1px solid #b8c2d2;padding:0 14px;font-size:16px}.templates{display:grid;grid-template-columns:1fr 1fr;gap:12px}.template{border:1px solid #b8c2d2;background:white;padding:18px;text-align:left}.template.active{border:2px solid #2563eb;background:#eef5ff}button{cursor:pointer}#create-task{margin-top:24px;height:48px;border:0;background:#172033;color:white;padding:0 22px;font-weight:700}.timeline{margin-top:24px}.row{display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #e6eaf0}.dot{width:10px;height:10px;background:#22c55e;border-radius:50%;margin-top:6px}.muted{color:#687386;font-size:14px}</style></head><body><div class="shell">
  <div class="top"><div class="brand">Seqvio Recorder</div><div class="status">Workspace ready</div></div>
  <div class="grid"><section class="panel"><h1>New recording task</h1><label for="project-name">Project name</label><input id="project-name" placeholder="Untitled walkthrough"><label>Template</label><div class="templates"><button class="template active" data-template="tutorial"><strong>Tutorial</strong><div class="muted">Guided product flow</div></button><button class="template" data-template="release"><strong>Release</strong><div class="muted">Feature announcement</div></button></div><button id="create-task">Create task</button></section>
  <aside class="panel"><div class="muted">Recording profile</div><h2>Product walkthrough</h2><p>1280 × 720 · Smooth focus · Cursor track</p><div class="timeline"><div class="row"><span class="dot"></span><div><strong>Capture browser</strong><div class="muted">Deterministic action plan</div></div></div><div class="row"><span class="dot"></span><div><strong>Build focus track</strong><div class="muted">Element bounds and clicks</div></div></div><div class="row"><span class="dot"></span><div><strong>Render with Seqvio</strong><div class="muted">Local MP4 output</div></div></div></div></aside></div>
  </div><script>document.querySelectorAll('.template').forEach(b=>b.onclick=()=>{document.querySelectorAll('.template').forEach(x=>x.classList.remove('active'));b.classList.add('active')});document.querySelector('#create-task').onclick=()=>{document.querySelector('#create-task').textContent='Task created';document.querySelector('#create-task').style.background='#287653'}</script></body></html>`;
}

export function createRecorderServer(options: { port: number; host?: string; outputDir: string }) {
  const host = options.host ?? '127.0.0.1';
  const webDir = path.resolve(__dirname, '..', 'web');
  fs.mkdirSync(options.outputDir, { recursive: true });
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${host}:${options.port}`);
    try {
      if (req.method === 'GET' && url.pathname === '/') return serveFile(req, res, path.join(webDir, 'index.html'));
      if (req.method === 'GET' && url.pathname === '/app.js') return serveFile(req, res, path.join(webDir, 'app.js'));
      if (req.method === 'GET' && url.pathname === '/styles.css') return serveFile(req, res, path.join(webDir, 'styles.css'));
      if (req.method === 'GET' && url.pathname === '/demo') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(demoHtml()); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/sample-plan') {
        return json(res, 200, samplePlan(`http://${host}:${options.port}`));
      }
      if (req.method === 'GET' && url.pathname === '/api/config') {
        return json(res, 200, { plannerConfigured: Boolean(process.env.BROWSER_RECORDER_PLANNER_URL) });
      }
      if (req.method === 'GET' && url.pathname === '/api/jobs') return json(res, 200, Array.from(jobs.values()));
      const jobMatch = /^\/api\/jobs\/([^/]+)$/.exec(url.pathname);
      if (req.method === 'GET' && jobMatch) {
        const job = jobs.get(jobMatch[1]); return job ? json(res, 200, job) : json(res, 404, { error: 'Job not found' });
      }
      const mediaMatch = /^\/media\/([^/]+)\/(raw|final)\.mp4$/.exec(url.pathname);
      if (req.method === 'GET' && mediaMatch) {
        const filePath = path.join(options.outputDir, mediaMatch[1], `${mediaMatch[2]}.mp4`);
        return serveFile(req, res, filePath);
      }
      if (req.method === 'POST' && url.pathname === '/api/plan') {
        const input = await readJson(req) as { task?: string; startUrl?: string };
        if (!input.task || !input.startUrl) return json(res, 400, { error: 'task and startUrl are required' });
        const plan = await requestAiPlan({ task: input.task, startUrl: input.startUrl });
        return json(res, 200, plan);
      }
      if (req.method === 'POST' && url.pathname === '/api/run') {
        const plan = validatePlan(await readJson(req));
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const job: RecorderJob = {
          id, createdAt: new Date().toISOString(), plan, phase: 'queued', percent: 0, message: 'Queued',
        };
        jobs.set(id, job);
        json(res, 202, job);
        const jobDir = path.join(options.outputDir, id);
        void runPipeline(plan, jobDir, (progress) => Object.assign(job, progress))
          .then((result) => Object.assign(job, {
            phase: 'done', percent: 100, message: 'Recording rendered',
            rawVideoUrl: `/media/${id}/raw.mp4`, outputVideoUrl: `/media/${id}/final.mp4`,
            manifestUrl: `/api/jobs/${id}`,
          }))
          .catch((error) => Object.assign(job, {
            phase: 'failed', message: 'Pipeline failed', error: error instanceof Error ? error.message : String(error),
          }));
        return;
      }
      json(res, 404, { error: 'Not found' });
    } catch (error) {
      json(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });
}
