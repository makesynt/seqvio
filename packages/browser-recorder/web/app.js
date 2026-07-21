const state = { job: null, previewMode: 'final', poll: null };
const $ = (selector) => document.querySelector(selector);
const editor = $('#plan-editor');
const log = $('#event-log');

function appendLog(message) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  log.textContent = `${log.textContent}\n[${time}] ${message}`.trim();
  log.scrollTop = log.scrollHeight;
}

function parsePlan() {
  const plan = JSON.parse(editor.value);
  if (!plan.actions || !Array.isArray(plan.actions)) throw new Error('actions 必须是数组');
  return plan;
}

function validateEditor() {
  try {
    const plan = parsePlan();
    $('#plan-validity').textContent = '格式有效';
    $('#plan-validity').className = 'badge valid';
    $('#action-count').textContent = `${plan.actions.length} 个动作`;
    $('#start-url').value = plan.startUrl || $('#start-url').value;
    return true;
  } catch (error) {
    $('#plan-validity').textContent = '格式错误';
    $('#plan-validity').className = 'badge invalid';
    $('#action-count').textContent = '0 个动作';
    return false;
  }
}

function setPlan(plan) {
  editor.value = JSON.stringify(plan, null, 2);
  $('#start-url').value = plan.startUrl || '';
  validateEditor();
}

function setPipeline(phase) {
  const order = ['recording', 'encoding', 'composing', 'rendering'];
  const activeIndex = order.indexOf(phase);
  document.querySelectorAll('.pipeline div').forEach((element, index) => {
    element.className = index < activeIndex || phase === 'done' ? 'done' : index === activeIndex ? 'active' : '';
  });
}

function updatePreview() {
  if (!state.job) return;
  const url = state.previewMode === 'raw' ? state.job.rawVideoUrl : state.job.outputVideoUrl;
  if (!url) return;
  const video = $('#preview');
  if (video.dataset.src !== url) {
    video.dataset.src = url;
    video.src = `${url}?t=${Date.now()}`;
    $('#empty-preview').classList.add('hidden');
  }
}

function updateJob(job) {
  const previousMessage = state.job?.message;
  state.job = job;
  $('#progress-value').textContent = `${job.percent || 0}%`;
  $('#progress-bar').style.width = `${job.percent || 0}%`;
  $('#run-title').textContent = job.message || job.phase;
  setPipeline(job.phase);
  if (job.message && job.message !== previousMessage) appendLog(job.message);
  if (job.error) appendLog(`ERROR: ${job.error}`);
  updatePreview();
}

async function pollJob(id) {
  const response = await fetch(`/api/jobs/${id}`);
  const job = await response.json();
  updateJob(job);
  if (job.phase === 'done' || job.phase === 'failed') {
    clearInterval(state.poll);
    state.poll = null;
    $('#run').disabled = false;
  }
}

$('#load-demo').addEventListener('click', async () => {
  const response = await fetch('/api/sample-plan');
  setPlan(await response.json());
  $('#task').value = '创建一个产品演示录制任务并展示生成流程';
  appendLog('示例计划已载入');
});

$('#format-plan').addEventListener('click', () => {
  try { setPlan(parsePlan()); } catch (error) { appendLog(error.message); }
});

editor.addEventListener('input', validateEditor);

$('#ai-plan').addEventListener('click', async () => {
  const button = $('#ai-plan');
  button.disabled = true;
  $('#plan-message').textContent = '正在检查页面并生成计划';
  try {
    const response = await fetch('/api/plan', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: $('#task').value, startUrl: $('#start-url').value }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'AI 规划失败');
    setPlan(body);
    appendLog('AI 动作计划已生成');
  } catch (error) {
    appendLog(error.message);
  } finally {
    button.disabled = false;
    $('#plan-message').textContent = '动作计划可直接编辑';
  }
});

$('#run').addEventListener('click', async () => {
  if (!validateEditor()) return appendLog('请先修正计划 JSON');
  const button = $('#run');
  button.disabled = true;
  try {
    const response = await fetch('/api/run', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: editor.value,
    });
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || '无法启动任务');
    updateJob(job);
    appendLog(`任务 ${job.id} 已启动`);
    state.poll = setInterval(() => pollJob(job.id).catch((error) => appendLog(error.message)), 1000);
  } catch (error) {
    appendLog(error.message);
    button.disabled = false;
  }
});

document.querySelectorAll('[data-preview]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-preview]').forEach((item) => item.classList.toggle('active', item === button));
    state.previewMode = button.dataset.preview;
    $('#preview').removeAttribute('data-src');
    updatePreview();
  });
});

fetch('/api/config').then((response) => response.json()).then((config) => {
  if (config.plannerConfigured) {
    $('#planner-status').classList.add('online');
    $('#planner-status').lastChild.textContent = 'Planner 已连接';
    $('#ai-plan').disabled = false;
  }
});

fetch('/api/sample-plan').then((response) => response.json()).then(setPlan);
