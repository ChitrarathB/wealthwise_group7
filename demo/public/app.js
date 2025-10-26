let sessionId = null;
let mediaRecorder = null;
let recordedChunks = [];
let totalSteps = 3;

const el = (id) => document.getElementById(id);

function setTextIfPresent(id, value) {
	const node = document.getElementById(id);
	if (node) node.textContent = value;
}

function appendMessage(role, text) {
	const wrap = document.createElement('div');
	wrap.className = `msg ${role}`;
	const bubble = document.createElement('div');
	bubble.className = 'bubble';
	bubble.textContent = text;
	wrap.appendChild(bubble);
	el('messages').appendChild(wrap);
	el('messages').scrollTop = el('messages').scrollHeight;
}

function updateProfileUI(p, step, completed) {
	setTextIfPresent('household_size', p?.household_size ?? '—');
	setTextIfPresent('monthly_income_sgd', p?.monthly_income_sgd ?? '—');
	setTextIfPresent('housing_type', p?.housing_type ?? '—');
	setTextIfPresent('dependents', p?.dependents ?? '—');
	setTextIfPresent('monthly_expenses_sgd', p?.monthly_expenses_sgd ?? '—');
	setTextIfPresent('savings_sgd', p?.savings_sgd ?? '—');
	setTextIfPresent('cpf_employee_percent', p?.cpf_employee_percent ?? '—');
	setTextIfPresent('liabilities_mortgage_sgd', p?.liabilities_mortgage_sgd ?? '—');
	setTextIfPresent('risk_tolerance', p?.risk_tolerance ?? '—');
	setTextIfPresent('invest_horizon_years', p?.invest_horizon_years ?? '—');
	setTextIfPresent('monthly_invest_sgd', p?.monthly_invest_sgd ?? '—');
	const instruments = Array.isArray(p?.preferred_instruments) ? p.preferred_instruments.join(', ') : (p?.preferred_instruments ?? '—');
	setTextIfPresent('preferred_instruments', instruments);
	setTextIfPresent('investment_goal', p?.investment_goal ?? '—');
	const s = completed ? 'Profile Complete' : `Step ${Math.min(step + 1, totalSteps)} of ${totalSteps}`;
	setTextIfPresent('status_badge', s);
	const pct = completed ? 100 : Math.round(((step) / Math.max(1,totalSteps)) * 100);
	const bar = document.getElementById('progressBar');
	if (bar) bar.style.width = pct + '%';

	// compute metrics
	const income = Number(p?.monthly_income_sgd ?? 0) || 0;
	const expenses = Number(p?.monthly_expenses_sgd ?? 0) || 0;
	const monthlyInvest = Number(p?.monthly_invest_sgd ?? 0) || 0;
	const netMonthly = income - expenses - monthlyInvest;
	setTextIfPresent('metric_net_monthly', netMonthly ? `S$${netMonthly.toLocaleString()}` : '—');
	const savingsRate = income ? Math.max(0, Math.min(100, Math.round(((monthlyInvest) / income) * 100))) : null;
	setTextIfPresent('metric_savings_rate', savingsRate != null ? `${savingsRate}%` : '—');
	setTextIfPresent('metric_risk', p?.risk_tolerance ? String(p.risk_tolerance).toUpperCase() : '—');
}

async function initSession() {
    const url = '/api/session';
    let res;
    try {
        res = await fetch(url, { method: 'POST' });
    } catch (_) {
        // fallback to absolute URL
        res = await fetch(window.location.origin + '/api/session', { method: 'POST' });
    }
    if (!res.ok) throw new Error('session_http_' + res.status);
    const data = await res.json();
    if (!data || !data.sessionId) throw new Error('session_invalid_response');
    sessionId = data.sessionId;
    if (data.totalSteps) totalSteps = data.totalSteps;
    if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
    if (data.assistantText) appendMessage('assistant', data.assistantText);
    if (data.audio) {
        const rec = document.getElementById('recIndicator');
        if (rec) rec.textContent = 'Speaking...';
        await playBase64Wav(data.audio);
        if (rec) rec.textContent = 'Idle';
    }
    el('recordBtn').disabled = false;
    el('sendBtn').disabled = false;
}

function playBase64Wav(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const blob = new Blob([bytes], { type: 'audio/wav' });
	const url = URL.createObjectURL(blob);
	const audio = new Audio(url);
	return audio.play().catch(() => {
		toast('Audio blocked. Please click anywhere to enable sound.');
	});
}

async function startRecording() {
	if (!navigator.mediaDevices?.getUserMedia) {
		alert('getUserMedia not supported.');
		return;
	}
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
    ];
    let selectedType = '';
    for (const t of preferredTypes) {
        if (MediaRecorder.isTypeSupported(t)) { selectedType = t; break; }
    }
    mediaRecorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType } : undefined);
	mediaRecorder.ondataavailable = (e) => {
		if (e.data && e.data.size > 0) recordedChunks.push(e.data);
	};
	mediaRecorder.onstop = onRecordingStop;
	mediaRecorder.start();
	setTextIfPresent('recIndicator', 'Recording...');
	el('recordBtn').classList.add('recording');
}

async function stopRecording() {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
	}
	setTextIfPresent('recIndicator', 'Processing...');
	el('recordBtn').classList.remove('recording');
}

async function onRecordingStop() {
    const type = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : 'audio/webm';
    const extension = type.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob(recordedChunks, { type });
	appendMessage('user', '...');
	const placeholder = el('messages').lastChild.querySelector('.bubble');

	const fd = new FormData();
	fd.append('sessionId', sessionId);
    fd.append('audio', blob, `input.${extension}`);
	const res = await fetch('/api/ingest-audio', { method: 'POST', body: fd });
	const data = await res.json();
	placeholder.textContent = data.transcript || '[unrecognized]';
	if (data.assistantText) appendMessage('assistant', data.assistantText);
	if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
	if (data.audio) playBase64Wav(data.audio);
	setTextIfPresent('recIndicator', 'Idle');
}

function wireControls() {
	const btn = el('recordBtn');
    const start = el('startBtn');
    const send = el('sendBtn');
    const input = el('textInput');
    start.addEventListener('click', async () => {
        start.disabled = true;
        start.textContent = 'Starting...';
        try {
            await initSession();
            start.textContent = '✓ Session Active';
            toast('Session started');
        } catch (e1) {
            console.error('start attempt 1 failed', e1);
            try {
                await initSession();
                start.textContent = '✓ Session Active';
                toast('Session started');
            } catch (e2) {
                console.error('start attempt 2 failed', e2);
                toast('Failed to start. Please try again.');
                start.disabled = false;
                start.textContent = '🎙️ Start Session';
            }
        }
    });
	btn.addEventListener('mousedown', startRecording);
	btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
	btn.addEventListener('mouseup', stopRecording);
	btn.addEventListener('mouseleave', () => { if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording(); });
	btn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });

    async function sendText() {
        if (!sessionId) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        appendMessage('user', text);
        const res = await fetch('/api/ingest-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, text }) });
        const data = await res.json();
        if (data.assistantText) appendMessage('assistant', data.assistantText);
        if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
        if (data.audio) playBase64Wav(data.audio);
    }
    send.addEventListener('click', sendText);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });

    // modal-based inline edits
    const grid = document.getElementById('profileGrid');
    const modal = document.getElementById('editModal');
    const editInput = document.getElementById('editInput');
    const editTitle = document.getElementById('editTitle');
    const editHint = document.getElementById('editHint');
    const editSave = document.getElementById('editSave');
    const editCancel = document.getElementById('editCancel');
    const editClose = document.getElementById('editClose');
    let editField = null;

    function openModal(field, current) {
        editField = field;
        editTitle.textContent = `Edit ${field}`;
        editInput.value = current === '—' ? '' : current;
        const numericFields = ['household_size','monthly_income_sgd','dependents','monthly_expenses_sgd','savings_sgd','cpf_employee_percent','liabilities_mortgage_sgd','invest_horizon_years','monthly_invest_sgd'];
        editHint.textContent = numericFields.includes(field) ? 'Enter a number' : (field === 'preferred_instruments' ? 'Comma-separated (e.g., stocks, ETFs)' : '');
        modal.setAttribute('aria-hidden','false');
        editInput.focus();
    }
    function closeModal() {
        modal.setAttribute('aria-hidden','true');
        editField = null;
    }
    function coerce(field, value) {
        const numericFields = ['household_size','monthly_income_sgd','dependents','monthly_expenses_sgd','savings_sgd','cpf_employee_percent','liabilities_mortgage_sgd','invest_horizon_years','monthly_invest_sgd'];
        if (numericFields.includes(field)) {
            const n = Number(String(value).replace(/[^0-9.\-]/g,''));
            if (Number.isNaN(n)) return { ok:false };
            return { ok:true, value:n };
        }
        if (field === 'preferred_instruments') {
            return { ok:true, value: value.split(',').map(s => s.trim()).filter(Boolean) };
        }
        return { ok:true, value };
    }
    async function saveEdit() {
        if (!editField || !sessionId) return;
        const raw = editInput.value.trim();
        const parsed = coerce(editField, raw);
        if (!parsed.ok) { toast('Please enter a valid value'); return; }
        const payload = {}; payload[editField] = parsed.value;
        const res = await fetch('/api/profile-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, fields: payload }) });
        const data = await res.json();
        if (!res.ok || !data?.ok) { toast('Update failed'); return; }
        updateProfileUI(data.profile, 0, false);
        toast('Updated');
        closeModal();
    }

    if (grid) {
        grid.addEventListener('click', (e) => {
            const node = e.target.closest('.profile-value.editable');
            if (!node || !sessionId) return;
            const field = node.getAttribute('data-field');
            const current = String(node.textContent || '').trim();
            openModal(field, current);
        });
    }
    editSave.addEventListener('click', saveEdit);
    editCancel.addEventListener('click', closeModal);
    editClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });
}

function toast(msg) {
    const c = document.getElementById('toasts');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.remove(); }, 2500);
}

// Tab functionality
let currentTab = 'profile';
let analysisChart = null;
let scenarioChart = null;

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'analysis' && sessionId) {
        loadAnalysis();
    } else if (tabName === 'scenarios' && sessionId) {
        loadScenarios();
    } else if (tabName === 'plans' && sessionId) {
        loadPlans();
    }
}

async function loadAnalysis() {
    try {
        const response = await fetch(`/api/analysis?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (response.ok) {
            renderAnalysisCharts(data);
            updateAnalysisSummary(data);
        } else {
            document.getElementById('analysis-content').innerHTML = '<p>Unable to load analysis. Please complete your profile first.</p>';
        }
    } catch (error) {
        console.error('Error loading analysis:', error);
        document.getElementById('analysis-content').innerHTML = '<p>Error loading analysis.</p>';
    }
}

async function loadScenarios() {
    try {
        const response = await fetch(`/api/scenarios?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (response.ok) {
            renderScenariosUI(data);
        } else {
            document.getElementById('scenarios-content').innerHTML = '<p>Unable to load scenarios. Please complete your profile first.</p>';
        }
    } catch (error) {
        console.error('Error loading scenarios:', error);
        document.getElementById('scenarios-content').innerHTML = '<p>Error loading scenarios.</p>';
    }
}

async function loadPlans() {
    try {
        const response = await fetch(`/api/plans?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (response.ok) {
            renderPlansUI(data);
        } else {
            document.getElementById('plans-content').innerHTML = '<p>Unable to load plans. Please complete your profile first.</p>';
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        document.getElementById('plans-content').innerHTML = '<p>Error loading plans.</p>';
    }
}

function renderAnalysisCharts(data) {
    const ctx = document.getElementById('analysisChart');
    if (!ctx) return;
    
    if (analysisChart) {
        analysisChart.destroy();
    }
    
    const years = data.projections.map(p => p.year);
    const netWorth = data.projections.map(p => p.netWorth);
    const income = data.projections.map(p => p.income);
    const expenses = data.projections.map(p => p.expenses);
    
    analysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Net Worth',
                    data: netWorth,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Annual Income',
                    data: income,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Expenses',
                    data: expenses,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Financial Projections Over Time'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function updateAnalysisSummary(data) {
    const summaryEl = document.getElementById('analysis-summary');
    if (!summaryEl) return;
    
    const final = data.projections[data.projections.length - 1];
    const lifeCover = data.recommendations?.lifeCover || 0;
    
    summaryEl.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <h4>50-Year Net Worth</h4>
                <p class="summary-value">$${(final.netWorth / 1000000).toFixed(1)}M</p>
            </div>
            <div class="summary-card">
                <h4>Recommended Life Cover</h4>
                <p class="summary-value">$${(lifeCover / 1000000).toFixed(1)}M</p>
            </div>
            <div class="summary-card">
                <h4>Emergency Fund Target</h4>
                <p class="summary-value">$${((data.recommendations?.emergencyFund || 0) / 1000).toFixed(0)}K</p>
            </div>
            <div class="summary-card">
                <h4>Monthly Savings Rate</h4>
                <p class="summary-value">${data.recommendations?.savingsRate || 0}%</p>
            </div>
        </div>
        <div class="recommendations">
            <h4>Key Recommendations</h4>
            <ul>
                ${data.recommendations?.points?.map(point => `<li>${point}</li>`).join('') || '<li>Complete your profile for personalized recommendations</li>'}
            </ul>
        </div>
    `;
}

function renderScenariosUI(data) {
    const container = document.getElementById('scenarios-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="scenarios-header">
            <h3>Financial Stress Testing</h3>
            <p>See how different life events could impact your financial future</p>
        </div>
        <div class="scenario-selector">
            ${data.scenarios.map(scenario => `
                <button class="scenario-btn" data-scenario="${scenario.key}">
                    ${scenario.name}
                </button>
            `).join('')}
        </div>
        <div class="scenario-chart-container">
            <canvas id="scenarioChart"></canvas>
        </div>
        <div id="scenario-details" class="scenario-details"></div>
    `;
    
    // Add event listeners for scenario buttons
    container.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scenarioKey = btn.dataset.scenario;
            const scenario = data.scenarios.find(s => s.key === scenarioKey);
            renderScenarioChart(scenario, data.scenarios[0]); // Compare with baseline
            updateScenarioDetails(scenario);
            
            // Update active button
            container.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Load baseline by default
    if (data.scenarios.length > 0) {
        const baselineBtn = container.querySelector('.scenario-btn');
        if (baselineBtn) baselineBtn.click();
    }
}

function renderScenarioChart(scenario, baseline) {
    const ctx = document.getElementById('scenarioChart');
    if (!ctx) return;
    
    if (scenarioChart) {
        scenarioChart.destroy();
    }
    
    const years = scenario.series.map(s => s.year);
    const scenarioNetWorth = scenario.series.map(s => s.netWorth);
    const baselineNetWorth = baseline.series.map(s => s.netWorth);
    
    scenarioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Baseline',
                    data: baselineNetWorth,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: scenario.name,
                    data: scenarioNetWorth,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Impact of ${scenario.name}`
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function updateScenarioDetails(scenario) {
    const detailsEl = document.getElementById('scenario-details');
    if (!detailsEl) return;
    
    const final = scenario.series[scenario.series.length - 1];
    const impact = scenario.key === 'baseline' ? 0 : final.netWorth - scenario.series[0].netWorth;
    
    detailsEl.innerHTML = `
        <div class="scenario-summary">
            <h4>${scenario.name} Impact</h4>
            <div class="impact-metrics">
                <div class="metric">
                    <span class="metric-label">Final Net Worth:</span>
                    <span class="metric-value">$${(final.netWorth / 1000).toFixed(0)}K</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Impact:</span>
                    <span class="metric-value ${impact < 0 ? 'negative' : 'positive'}">
                        ${impact < 0 ? '-' : '+'}$${Math.abs(impact / 1000).toFixed(0)}K
                    </span>
                </div>
            </div>
        </div>
    `;
}

function renderPlansUI(data) {
    const container = document.getElementById('plans-content');
    if (!container) return;
    
    const { recommendations, summary } = data;
    
    container.innerHTML = `
        <div class="plans-header">
            <h3>Recommended Financial Products</h3>
            <p>Personalized recommendations based on your profile</p>
        </div>
        
        <div class="plans-summary">
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>Total Monthly Premium</h4>
                    <p class="summary-value">$${summary.total_monthly_premium}</p>
                </div>
                <div class="summary-card">
                    <h4>Recommended Life Cover</h4>
                    <p class="summary-value">$${(summary.recommended_life_cover / 1000).toFixed(0)}K</p>
                </div>
                <div class="summary-card">
                    <h4>Emergency Fund Target</h4>
                    <p class="summary-value">$${(summary.emergency_fund_target / 1000).toFixed(0)}K</p>
                </div>
            </div>
        </div>
        
        <div class="plans-categories">
            ${Object.entries(recommendations).map(([category, plans]) => `
                <div class="plan-category">
                    <h4>${category.replace('_', ' ').toUpperCase()}</h4>
                    <div class="plans-grid">
                        ${plans.map(plan => `
                            <div class="plan-card ${plan.priority === 'High' ? 'high-priority' : ''}">
                                <div class="plan-header">
                                    <h5>${plan.name}</h5>
                                    <span class="plan-provider">${plan.provider}</span>
                                    ${plan.priority === 'High' ? '<span class="priority-badge">Recommended</span>' : ''}
                                </div>
                                <div class="plan-details">
                                    <div class="plan-coverage">
                                        <strong>Coverage:</strong> ${plan.coverage || plan.contribution || plan.minimum}
                                    </div>
                                    <div class="plan-premium">
                                        <strong>Cost:</strong> ${plan.premium || plan.returns || plan.expected_return}
                                    </div>
                                    <div class="plan-features">
                                        <strong>Features:</strong>
                                        <ul>
                                            ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="plan-suitability">
                                        <em>${plan.suitability}</em>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', async () => {
    wireControls();
    
    // Wire tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
});


