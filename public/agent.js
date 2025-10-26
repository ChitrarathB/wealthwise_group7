let sessionId = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let timerInterval = null;

const el = (id) => document.getElementById(id);

function toast(msg) {
	const c = document.getElementById('toasts');
	if (!c) return;
	const t = document.createElement('div');
	t.className = 'toast';
	t.textContent = msg;
	c.appendChild(t);
	setTimeout(() => { t.remove(); }, 3000);
}

async function startRecording() {
	if (!navigator.mediaDevices?.getUserMedia) {
		toast('❌ Microphone access not available');
		return;
	}
	
	try {
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
			if (MediaRecorder.isTypeSupported(t)) { 
				selectedType = t; 
				break; 
			}
		}
		
		mediaRecorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType } : undefined);
		
		mediaRecorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) recordedChunks.push(e.data);
		};
		
		mediaRecorder.onstop = onRecordingStop;
		mediaRecorder.start();
		
		// UI updates
		el('recordBtn').classList.add('recording');
		el('recordBtn').textContent = '⏹️';
		el('recordStatus').textContent = 'Recording Conversation...';
		el('recordStatus').style.color = '#ef4444';
		
		// Start timer
		recordingStartTime = Date.now();
		timerInterval = setInterval(updateTimer, 1000);
		
		toast('🎙️ Recording started');
	} catch (error) {
		console.error('Error starting recording:', error);
		toast('❌ Failed to access microphone');
	}
}

function stopRecording() {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
		mediaRecorder.stream.getTracks().forEach(track => track.stop());
	}
	
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
	
	el('recordBtn').classList.remove('recording');
	el('recordBtn').textContent = '🎙️';
	el('recordStatus').textContent = 'Processing...';
	el('recordStatus').style.color = '#3b82f6';
}

function updateTimer() {
	if (!recordingStartTime) return;
	const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
	const minutes = Math.floor(elapsed / 60);
	const seconds = elapsed % 60;
	el('recordTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function onRecordingStop() {
	const type = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : 'audio/webm';
	const extension = type.includes('ogg') ? 'ogg' : 'webm';
	const blob = new Blob(recordedChunks, { type });
	
	el('recordStatus').textContent = 'Transcribing conversation...';
	toast('🔄 Processing audio...');
	
	// Create session if needed
	if (!sessionId) {
		const res = await fetch('/api/session', { method: 'POST' });
		const data = await res.json();
		sessionId = data.sessionId;
	}
	
	// Send audio for transcription and extraction
	const fd = new FormData();
	fd.append('sessionId', sessionId);
	fd.append('audio', blob, `conversation.${extension}`);
	
	try {
		const res = await fetch('/api/agent-conversation', { method: 'POST', body: fd });
		const data = await res.json();
		
		if (res.ok && data.success) {
			// Show transcript
			el('transcriptSection').style.display = 'block';
			el('transcript').textContent = data.transcript || 'No transcript available';
			
			// Show extracted profile
			if (data.profile) {
				el('profileSection').style.display = 'block';
				renderExtractedProfile(data.profile);
			}
			
			el('recordStatus').textContent = 'Completed!';
			el('recordStatus').style.color = '#10b981';
			el('recordBtn').disabled = true;
			el('recordBtn').style.opacity = '0.5';
			
			toast('✅ Profile created from conversation');
		} else {
			toast('❌ Failed to process conversation');
			el('recordStatus').textContent = 'Error - Try Again';
			el('recordStatus').style.color = '#ef4444';
		}
	} catch (error) {
		console.error('Error:', error);
		toast('❌ Error processing conversation');
		el('recordStatus').textContent = 'Error - Try Again';
		el('recordStatus').style.color = '#ef4444';
	}
}

function renderExtractedProfile(profile) {
	const container = el('profileData');
	
	const fields = [
		{ key: 'household_size', label: 'Household Size', icon: '👥' },
		{ key: 'monthly_income_sgd', label: 'Monthly Income', icon: '💼', prefix: '$' },
		{ key: 'housing_type', label: 'Housing Type', icon: '🏠' },
		{ key: 'dependents', label: 'Dependents', icon: '👶' },
		{ key: 'monthly_expenses_sgd', label: 'Monthly Expenses', icon: '🧾', prefix: '$' },
		{ key: 'savings_sgd', label: 'Savings', icon: '💰', prefix: '$' },
		{ key: 'cpf_employee_percent', label: 'CPF %', icon: '🪙', suffix: '%' },
		{ key: 'liabilities_mortgage_sgd', label: 'Mortgage', icon: '🏦', prefix: '$' },
		{ key: 'risk_tolerance', label: 'Risk Tolerance', icon: '⚖️' },
		{ key: 'invest_horizon_years', label: 'Investment Horizon', icon: '📅', suffix: ' years' },
		{ key: 'monthly_invest_sgd', label: 'Monthly Investment', icon: '📈', prefix: '$' },
		{ key: 'preferred_instruments', label: 'Instruments', icon: '🧩' },
		{ key: 'investment_goal', label: 'Investment Goal', icon: '🎯' }
	];
	
	container.innerHTML = fields.map(field => {
		const value = profile[field.key];
		if (value === undefined || value === null) return '';
		
		let displayValue = value;
		if (Array.isArray(value)) {
			displayValue = value.join(', ');
		}
		if (field.prefix) displayValue = field.prefix + displayValue;
		if (field.suffix) displayValue = displayValue + field.suffix;
		
		return `
			<div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
				<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
					<span style="font-size: 20px;">${field.icon}</span>
					<div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">${field.label}</div>
				</div>
				<div style="font-size: 18px; font-weight: 700; color: #0f172a;">${displayValue}</div>
			</div>
		`;
	}).filter(Boolean).join('');
}

async function testWithDemoConversation() {
	el('recordStatus').textContent = 'Processing demo conversation...';
	el('recordStatus').style.color = '#8b5cf6';
	el('testDemoBtn').disabled = true;
	el('testDemoBtn').textContent = '⏳ Processing...';
	
	toast('🧪 Testing with sample conversation...');
	
	// Create session if needed
	if (!sessionId) {
		const res = await fetch('/api/session', { method: 'POST' });
		const data = await res.json();
		sessionId = data.sessionId;
	}
	
	try {
		const res = await fetch('/api/agent-test-demo', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId })
		});
		
		const data = await res.json();
		
		if (res.ok && data.success) {
			// Show transcript
			el('transcriptSection').style.display = 'block';
			el('transcript').textContent = data.transcript || 'No transcript available';
			
			// Show extracted profile
			if (data.profile) {
				el('profileSection').style.display = 'block';
				el('fieldCount').textContent = data.extractedFields;
				renderExtractedProfile(data.profile);
			}
			
			el('recordStatus').textContent = 'Demo Completed!';
			el('recordStatus').style.color = '#10b981';
			el('recordBtn').disabled = true;
			el('recordBtn').style.opacity = '0.5';
			
			toast(`✅ Extracted ${data.extractedFields} profile fields from demo conversation`);
		} else {
			toast('❌ Failed to process demo conversation');
			el('recordStatus').textContent = 'Error';
			el('recordStatus').style.color = '#ef4444';
			el('testDemoBtn').disabled = false;
			el('testDemoBtn').textContent = '🧪 Test with Sample Conversation';
		}
	} catch (error) {
		console.error('Error:', error);
		toast('❌ Error processing demo');
		el('recordStatus').textContent = 'Error';
		el('recordStatus').style.color = '#ef4444';
		el('testDemoBtn').disabled = false;
		el('testDemoBtn').textContent = '🧪 Test with Sample Conversation';
	}
}

function showAnalysisSection() {
	// Hide recording section, show analysis
	el('recordingSection').style.display = 'none';
	el('analysisSection').classList.add('show');
	
	// Load analysis and scenarios
	loadAgentAnalysis();
	
	toast('📊 Loading client analysis...');
}

function resetToNewClient() {
	// Reload page to start fresh
	window.location.reload();
}

let currentTab = 'agent-analysis';
let agentAnalysisCharts = [];
let agentScenarioCharts = [];

function switchAgentTab(tabName) {
	currentTab = tabName;
	
	// Update tab buttons
	document.querySelectorAll('.tab-btn').forEach(btn => {
		btn.classList.remove('active');
	});
	document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
	
	// Update tab content
	document.querySelectorAll('.tab-content').forEach(content => {
		content.style.display = 'none';
	});
	document.getElementById(`${tabName}-tab`).style.display = 'block';
	
	// Load data if needed
	if (tabName === 'agent-scenarios' && sessionId) {
		loadAgentScenarios();
	}
}

async function loadAgentAnalysis() {
	const container = el('agent-analysis-content');
	container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">Loading analysis...</div>';
	
	try {
		const response = await fetch(`/api/analysis?sessionId=${sessionId}`);
		const data = await response.json();
		
		if (response.ok) {
			container.innerHTML = `
				<div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
					<div style="font-size: 24px; margin-bottom: 8px;">📊</div>
					<div style="font-weight: 600; color: #92400e; font-size: 16px;">Client Analysis Ready</div>
					<div style="font-size: 13px; color: #b45309; margin-top: 4px;">Present these insights to your client</div>
				</div>
				
				<div class="summary-grid" style="margin-bottom: 32px;">
					<div class="summary-card">
						<h4>10-Year Projection</h4>
						<p class="summary-value">$${Math.round(data.summary.projectedNetWorth_10 / 1000)}K</p>
					</div>
					<div class="summary-card">
						<h4>20-Year Projection</h4>
						<p class="summary-value">$${Math.round(data.summary.projectedNetWorth_20 / 1000)}K</p>
					</div>
					<div class="summary-card">
						<h4>50-Year Projection</h4>
						<p class="summary-value">$${(data.summary.projectedNetWorth_50 / 1000000).toFixed(1)}M</p>
					</div>
					<div class="summary-card">
						<h4>Savings Rate</h4>
						<p class="summary-value">${data.summary.savingsRate}%</p>
					</div>
				</div>
				
				<!-- Main Chart -->
				<div class="chart-container" style="height: 400px; margin-bottom: 24px;">
					<canvas id="agentMainChart"></canvas>
				</div>
				
				<!-- Three Detail Charts -->
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 24px;">
					<div class="chart-container" style="height: 300px;">
						<canvas id="agentIncomeChart"></canvas>
					</div>
					<div class="chart-container" style="height: 300px;">
						<canvas id="agentExpensesChart"></canvas>
					</div>
					<div class="chart-container" style="height: 300px;">
						<canvas id="agentInvestmentChart"></canvas>
					</div>
				</div>
				
				<div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
					<h4 style="margin: 0 0 16px 0;">Key Recommendations for Client:</h4>
					<ul style="margin: 0; padding-left: 24px; color: #475569; line-height: 1.8;">
						${data.recommendations.points.map(point => `<li style="margin-bottom: 12px;">${point}</li>`).join('')}
					</ul>
				</div>
				
				<div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px;">
					<p style="margin: 0; color: #64748b; font-size: 14px;">
						💡 Switch to <strong>Scenarios</strong> tab to explore different life events and insurance needs
					</p>
				</div>
			`;
			
			// Render charts
			renderAgentCharts(data);
		}
	} catch (error) {
		console.error('Error:', error);
		container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading analysis</div>';
	}
}

function renderAgentCharts(data) {
	// Destroy existing charts
	agentAnalysisCharts.forEach(chart => chart.destroy());
	agentAnalysisCharts = [];
	
	const projections = data.projections.years_50;
	const labels = projections.map(p => `Year ${p.year}`);
	
	// 1. Main Cumulative Chart
	const ctxMain = document.getElementById('agentMainChart');
	if (ctxMain) {
		const mainChart = new Chart(ctxMain, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Net Worth',
						data: projections.map(p => p.netWorth),
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						fill: true,
						tension: 0.4,
						borderWidth: 3,
						pointRadius: 0
					},
					{
						label: 'CPF Balance',
						data: projections.map(p => p.cpfBalance),
						borderColor: '#10b981',
						fill: false,
						tension: 0.4,
						borderWidth: 2,
						pointRadius: 0
					},
					{
						label: 'Liquid Assets',
						data: projections.map(p => p.liquidAssets),
						borderColor: '#8b5cf6',
						fill: false,
						tension: 0.4,
						borderWidth: 2,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Client Wealth Projection - 50 Years',
						font: { size: 16, weight: 'bold' },
						color: '#0f172a'
					},
					legend: { position: 'top' },
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: (context) => {
								let label = context.dataset.label || '';
								if (label) label += ': ';
								label += '$' + context.parsed.y.toLocaleString();
								return label;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => {
								if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
								if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
								return '$' + value;
							}
						}
					}
				}
			}
		});
		agentAnalysisCharts.push(mainChart);
	}
	
	// 2. Income Chart
	const ctxIncome = document.getElementById('agentIncomeChart');
	if (ctxIncome) {
		const incomeChart = new Chart(ctxIncome, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Gross Income',
					data: projections.map(p => p.income),
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.2)',
					fill: true,
					tension: 0.4,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: 'Income Growth', font: { size: 14, weight: 'bold' } },
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
						}
					}
				}
			}
		});
		agentAnalysisCharts.push(incomeChart);
	}
	
	// 3. Expenses Chart  
	const ctxExpenses = document.getElementById('agentExpensesChart');
	if (ctxExpenses) {
		const expensesChart = new Chart(ctxExpenses, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Total Expenses',
					data: projections.map(p => p.expenses),
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.15)',
					fill: true,
					tension: 0.4,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: 'Expense Growth', font: { size: 14, weight: 'bold' } },
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
						}
					}
				}
			}
		});
		agentAnalysisCharts.push(expensesChart);
	}
	
	// 4. Investment Chart
	const ctxInvestment = document.getElementById('agentInvestmentChart');
	if (ctxInvestment) {
		const investmentChart = new Chart(ctxInvestment, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Portfolio Value',
					data: projections.map(p => p.investmentPortfolio),
					borderColor: '#8b5cf6',
					backgroundColor: 'rgba(139, 92, 246, 0.2)',
					fill: true,
					tension: 0.4,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: 'Investment Portfolio', font: { size: 14, weight: 'bold' } },
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => {
								if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
								return '$' + (value / 1000).toFixed(0) + 'K';
							}
						}
					}
				}
			}
		});
		agentAnalysisCharts.push(investmentChart);
	}
}

let scenariosData = null;

async function loadAgentScenarios() {
	const container = el('agent-scenarios-content');
	container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">Loading scenarios...</div>';
	
	try {
		const response = await fetch(`/api/scenarios?sessionId=${sessionId}`);
		const data = await response.json();
		scenariosData = data; // Store for chart rendering
		
		if (response.ok) {
			container.innerHTML = `
				<div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
					<div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
					<div style="font-weight: 600; color: #92400e; font-size: 16px;">Scenario Planning</div>
					<div style="font-size: 13px; color: #b45309; margin-top: 4px;">Show clients different life event impacts</div>
				</div>
				
				<div class="scenario-selector" style="margin-bottom: 24px;">
					${data.scenarios.map(s => `
						<button class="scenario-btn ${s.id === 'baseline' ? 'active' : ''}" data-scenario="${s.id}">
							<div style="font-size: 24px; margin-bottom: 4px;">${s.icon}</div>
							<div style="font-weight: 600; font-size: 14px;">${s.name}</div>
						</button>
					`).join('')}
				</div>
				
				<div id="agent-scenario-detail"></div>
			`;
			
			// Add listeners
			document.querySelectorAll('.scenario-btn').forEach(btn => {
				btn.addEventListener('click', () => {
					document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
					btn.classList.add('active');
					const scenario = data.scenarios.find(s => s.id === btn.dataset.scenario);
					renderAgentScenarioDetail(scenario, data.baseline);
				});
			});
			
			// Show baseline initially
			const baseline = data.scenarios.find(s => s.id === 'baseline');
			if (baseline) renderAgentScenarioDetail(baseline, data.baseline);
		}
	} catch (error) {
		console.error('Error:', error);
		container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading scenarios</div>';
	}
}

function renderAgentScenarioDetail(scenario, baseline) {
	const container = el('agent-scenario-detail');
	
	const typeColors = {
		positive: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
		neutral: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
		moderate: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
		negative: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
		critical: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' }
	};
	const colors = typeColors[scenario.type] || typeColors.neutral;
	
	container.innerHTML = `
		<div style="background: ${colors.bg}; border: 2px solid ${colors.border}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
			<div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
				<div style="font-size: 48px;">${scenario.icon}</div>
				<div style="flex: 1;">
					<h3 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 22px;">${scenario.name}</h3>
					<p style="margin: 0; color: ${colors.text}; opacity: 0.9; line-height: 1.6;">${scenario.description}</p>
				</div>
			</div>
			
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid ${colors.border};">
				${Object.entries(scenario.changes).map(([key, value]) => `
					<div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.4); border-radius: 8px;">
						<div style="font-size: 11px; text-transform: uppercase; color: ${colors.text}; opacity: 0.7; margin-bottom: 6px; font-weight: 600;">${key}</div>
						<div style="font-size: 16px; font-weight: 700; color: ${colors.text};">${value}</div>
					</div>
				`).join('')}
			</div>
		</div>
		
		<!-- Three Comparison Charts -->
		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 24px;">
			<div class="chart-container" style="height: 300px;">
				<canvas id="agentScenarioIncomeChart"></canvas>
			</div>
			<div class="chart-container" style="height: 300px;">
				<canvas id="agentScenarioExpensesChart"></canvas>
			</div>
			<div class="chart-container" style="height: 300px;">
				<canvas id="agentScenarioSavingsChart"></canvas>
			</div>
		</div>
		
		<div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
			<h4 style="margin: 0 0 16px 0; font-size: 18px;">Financial Impact</h4>
			<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
				<div style="background: ${scenario.impact_10yr >= 0 ? '#d1fae5' : '#fee2e2'}; border: 1px solid ${scenario.impact_10yr >= 0 ? '#10b981' : '#ef4444'}; border-radius: 10px; padding: 20px; text-align: center;">
					<div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 8px;">10-YEAR IMPACT</div>
					<div style="font-size: 32px; font-weight: 700; color: ${scenario.impact_10yr >= 0 ? '#10b981' : '#ef4444'};">
						${scenario.impact_10yr >= 0 ? '+' : ''}$${Math.round(Math.abs(scenario.impact_10yr) / 1000)}K
					</div>
				</div>
				<div style="background: ${scenario.impact_20yr >= 0 ? '#d1fae5' : '#fee2e2'}; border: 1px solid ${scenario.impact_20yr >= 0 ? '#10b981' : '#ef4444'}; border-radius: 10px; padding: 20px; text-align: center;">
					<div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 8px;">20-YEAR IMPACT</div>
					<div style="font-size: 32px; font-weight: 700; color: ${scenario.impact_20yr >= 0 ? '#10b981' : '#ef4444'};">
						${scenario.impact_20yr >= 0 ? '+' : ''}$${Math.round(Math.abs(scenario.impact_20yr) / 1000)}K
					</div>
				</div>
				<div style="background: ${scenario.impact_50yr >= 0 ? '#d1fae5' : '#fee2e2'}; border: 1px solid ${scenario.impact_50yr >= 0 ? '#10b981' : '#ef4444'}; border-radius: 10px; padding: 20px; text-align: center;">
					<div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 8px;">50-YEAR IMPACT</div>
					<div style="font-size: 32px; font-weight: 700; color: ${scenario.impact_50yr >= 0 ? '#10b981' : '#ef4444'};">
						${scenario.impact_50yr >= 0 ? '+' : ''}$${(Math.abs(scenario.impact_50yr) / 1000000).toFixed(1)}M
					</div>
				</div>
			</div>
			
			<div style="margin-top: 24px; padding: 20px; background: #f8fafc; border-radius: 10px;">
				<h5 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">💡 What to Tell Your Client:</h5>
				<p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.8;">
					${getScenarioExplanation(scenario)}
				</p>
			</div>
		</div>
	`;
	
	// Render scenario comparison charts
	renderAgentScenarioCharts(scenario, baseline);
}

function renderAgentScenarioCharts(scenario, baseline) {
	// Destroy existing scenario charts
	agentScenarioCharts.forEach(chart => chart.destroy());
	agentScenarioCharts = [];
	
	const baselineData = baseline.projections.years_50;
	const scenarioData = scenario.analysis.projections.years_50;
	const labels = baselineData.map(p => `Year ${p.year}`);
	
	const scenarioColor = scenario.type === 'positive' ? '#10b981' : scenario.type === 'critical' ? '#ef4444' : '#f59e0b';
	
	// 1. Income Comparison
	const ctxIncome = document.getElementById('agentScenarioIncomeChart');
	if (ctxIncome) {
		const chart = new Chart(ctxIncome, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Baseline',
						data: baselineData.map(p => p.income),
						borderColor: '#6366f1',
						borderWidth: 2,
						fill: false,
						tension: 0.4,
						pointRadius: 0
					},
					{
						label: scenario.name,
						data: scenarioData.map(p => p.income),
						borderColor: scenarioColor,
						backgroundColor: scenarioColor + '20',
						borderWidth: 2.5,
						fill: true,
						tension: 0.4,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: '💰 Income', font: { size: 14, weight: 'bold' } }
				},
				scales: {
					y: {
						ticks: { callback: (v) => '$' + (v / 1000).toFixed(0) + 'K' }
					}
				}
			}
		});
		agentScenarioCharts.push(chart);
	}
	
	// 2. Expenses Comparison
	const ctxExpenses = document.getElementById('agentScenarioExpensesChart');
	if (ctxExpenses) {
		const chart = new Chart(ctxExpenses, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Baseline',
						data: baselineData.map(p => p.expenses),
						borderColor: '#6366f1',
						borderWidth: 2,
						fill: false,
						tension: 0.4,
						pointRadius: 0
					},
					{
						label: scenario.name,
						data: scenarioData.map(p => p.expenses),
						borderColor: scenarioColor,
						backgroundColor: scenarioColor + '20',
						borderWidth: 2.5,
						fill: true,
						tension: 0.4,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: '💸 Expenses', font: { size: 14, weight: 'bold' } }
				},
				scales: {
					y: {
						ticks: { callback: (v) => '$' + (v / 1000).toFixed(0) + 'K' }
					}
				}
			}
		});
		agentScenarioCharts.push(chart);
	}
	
	// 3. Savings/Investment Comparison
	const ctxSavings = document.getElementById('agentScenarioSavingsChart');
	if (ctxSavings) {
		const chart = new Chart(ctxSavings, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Baseline',
						data: baselineData.map(p => p.investmentPortfolio),
						borderColor: '#6366f1',
						borderWidth: 2,
						fill: false,
						tension: 0.4,
						pointRadius: 0
					},
					{
						label: scenario.name,
						data: scenarioData.map(p => p.investmentPortfolio),
						borderColor: scenarioColor,
						backgroundColor: scenarioColor + '20',
						borderWidth: 2.5,
						fill: true,
						tension: 0.4,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: { display: true, text: '📈 Investments', font: { size: 14, weight: 'bold' } }
				},
				scales: {
					y: {
						ticks: {
							callback: (v) => {
								if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
								return '$' + (v / 1000).toFixed(0) + 'K';
							}
						}
					}
				}
			}
		});
		agentScenarioCharts.push(chart);
	}
}

function getScenarioExplanation(scenario) {
	if (scenario.id === 'baseline') {
		return "This represents their current financial trajectory. With their existing income, expenses, and investment levels, they can expect steady growth over time.";
	}
	if (scenario.id === 'career_growth') {
		return "If they receive a 30% promotion/raise, their wealth could grow significantly faster. Even with 15% lifestyle inflation, the increased investment capacity compounds over time.";
	}
	if (scenario.id === 'job_loss') {
		return "Complete job loss is severe - with zero income but same expenses, their savings depletes rapidly. This highlights why maintaining a 6-12 month emergency fund is critical.";
	}
	if (scenario.id === 'medical') {
		return "A major medical emergency with $80K upfront costs and 50% higher ongoing expenses significantly impacts wealth. Comprehensive health insurance is essential to protect their financial future.";
	}
	if (scenario.id === 'new_dependent') {
		return "A new child increases expenses by 40% (childcare, food, education) and reduces investment capacity. Planning ahead for this expense is important for maintaining financial stability.";
	}
	if (scenario.id === 'aggressive_savings') {
		return "By cutting expenses 35% and tripling investments, they could dramatically accelerate wealth building. This 'FIRE' approach requires discipline but can lead to early retirement.";
	}
	if (scenario.id === 'recession') {
		return "Economic downturns create a triple impact: lower income (20% pay cut), higher expenses (15% inflation), and portfolio losses (25%). Diversification and emergency reserves are key protections.";
	}
	return "This scenario shows how life changes can significantly impact their financial trajectory.";
}

// Wire controls
window.addEventListener('DOMContentLoaded', () => {
	const btn = el('recordBtn');
	const testBtn = el('testDemoBtn');
	const viewAnalysisBtn = el('viewAnalysisBtn');
	const newClientBtn = el('newClientBtn');
	
	btn.addEventListener('click', () => {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			stopRecording();
		} else {
			startRecording();
		}
	});
	
	if (testBtn) {
		testBtn.addEventListener('click', testWithDemoConversation);
	}
	
	if (viewAnalysisBtn) {
		viewAnalysisBtn.addEventListener('click', showAnalysisSection);
	}
	
	if (newClientBtn) {
		newClientBtn.addEventListener('click', resetToNewClient);
	}
	
	// Tab switching
	document.querySelectorAll('.tab-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const tabName = btn.dataset.tab;
			switchAgentTab(tabName);
		});
	});
});

