const API_BASE = '/api';
const UPLOAD_TIMEOUT_MS = 25_000;

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    return data.message || data.error || res.statusText;
  } catch {
    return res.statusText || 'Request failed';
  }
}

export async function uploadDrawing(file, projectId = 'default') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/upload/drawing`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const message = await parseErrorMessage(res);
      return {
        success: false,
        fileName: file.name,
        serverReachable: true,
        message: message || 'Upload failed',
      };
    }

    const data = await res.json();
    return { ...data, success: data.success !== false, serverReachable: true };
  } catch (err) {
    clearTimeout(timer);
    const message =
      err?.name === 'AbortError'
        ? 'Server upload timed out. Check that the backend is running on port 8080.'
        : 'Could not reach the upload server. Start the backend and MongoDB, then try again.';
    return {
      success: false,
      fileName: file.name,
      serverReachable: false,
      message,
    };
  }
}

export async function fetchProjectSummary() {
  try {
    const res = await fetch(`${API_BASE}/projects/summary`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchBoqItems(projectId = 'default') {
  try {
    const res = await fetch(`${API_BASE}/boq?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function syncBoqToServer({ items, quantities, projectId = 'default', fileName }) {
  if (!items?.length) return null;
  try {
    const res = await fetch(`${API_BASE}/boq/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, items, quantities, fileName }),
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return null;
  }
}

export async function askAssistant(question) {
  try {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return null;
  }
}
