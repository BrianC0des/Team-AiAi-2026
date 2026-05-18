const BACKEND_URL = 'http://localhost:3000';

async function checkHealth() {
  const statusEl = document.getElementById('status-text');

  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();

    console.log('[Health Check] Response:', data);

    statusEl.textContent = `✓ ${data.status.toUpperCase()} — ${data.message}`;
    statusEl.className = 'status ok';
  } catch (err) {
    console.error('[Health Check] Failed to reach backend:', err);
    statusEl.textContent = '✗ Unreachable';
    statusEl.className = 'status error';
  }
}

// Run on page load
checkHealth();
