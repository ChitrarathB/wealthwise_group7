// Financial Advisor Dashboard JavaScript

// Demo data based on the existing demo-frontend
const DEMO_CLIENT_DATA = {
    'sarah-chen': {
        id: 'sarah-chen',
        name: 'Sarah Chen Family',
        avatar: '👩‍👧‍👦',
        status: 'complete',
        profile: {
            householdSize: 3,
            monthlyIncome: 8500,
            housingType: '4-room HDB',
            dependents: 1,
            monthlyExpenses: 5200,
            currentSavings: 45000,
            cpfContribution: 20,
            monthlyMortgage: 1800,
            riskTolerance: 'Moderate',
            investmentHorizon: 15,
            monthlyInvestment: 1200,
            preferredInstruments: ['Stocks', 'Bonds', 'Unit Trusts'],
            investmentGoal: 'Retirement and Education'
        },
        metrics: {
            netWorth: 247500,
            monthlySurplus: 3300,
            savingsRate: 38.8,
            insuranceCoverage: 850000
        },
        sentiment: 'positive',
        engagement: 'high',
        keyInterest: 'Education Planning',
        lastSession: '2024-01-15',
        recommendations: [
            {
                id: 'life-insurance',
                type: 'insurance',
                title: 'LifeLock Term Shield - Life Insurance Gap',
                priority: 'high',
                confidence: 95,
                current: 850000,
                recommended: 1200000,
                gap: 350000,
                provider: 'ABC Insurance',
                reasoning: [
                    'Fixed premium and death benefit for a specific period',
                    'Current coverage insufficient for mortgage and child\'s education',
                    'Based on 10x annual income rule and family obligations',
                    'Consider term life insurance for cost-effectiveness'
                ]
            },
            {
                id: 'education-savings',
                type: 'savings',
                title: 'Future Scholars Plan - Education Savings',
                priority: 'medium',
                confidence: 88,
                goal: 150000,
                monthlyRequired: 650,
                currentAllocation: 400,
                provider: 'ABC Insurance',
                reasoning: [
                    'A savings plan to accumulate funds for a child\'s education',
                    'University costs projected at $150K in 16 years',
                    'Current savings rate insufficient by $250/month',
                    'Consider education endowment or investment-linked policies'
                ]
            },
            {
                id: 'portfolio-diversification',
                type: 'investment',
                title: 'Growth Horizon ILP - Portfolio Diversification',
                priority: 'low',
                confidence: 72,
                currentAllocation: '70% Stocks, 30% Bonds',
                recommended: 'Add REITs and International exposure',
                provider: 'ABC Insurance',
                reasoning: [
                    'A single-premium combination of life insurance and investment',
                    'Portfolio concentrated in Singapore equities',
                    'Consider 10-15% REIT allocation for income',
                    'Add international diversification for risk reduction'
                ]
            }
        ]
    }
};

// Global state
let currentClient = 'sarah-chen';
let currentTab = 'clients';
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadClientData();
});

function initializeDashboard() {
    console.log('🎭 Initializing Advisor Dashboard...');
    
    // Set initial tab
    showTab('clients');
    
    // Load demo data
    loadClientData();
    
    console.log('✅ Advisor Dashboard initialized');
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            showTab(tab);
        });
    });

    // Recommendation filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterRecommendations(this.dataset.filter);
        });
    });
}

function showTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    currentTab = tabName;

    // Load tab-specific content
    switch(tabName) {
        case 'session':
            loadSessionView();
            break;
        case 'analytics':
            loadAnalyticsView();
            break;
        case 'recommendations':
            loadRecommendationsView();
            break;
    }
}

function loadClientData() {
    const client = DEMO_CLIENT_DATA[currentClient];
    if (!client) return;

    console.log('📊 Loading client data for:', client.name);
    
    // Update client cards (already populated in HTML)
    // This would typically fetch from API
}

function selectClient(clientId) {
    currentClient = clientId;
    const client = DEMO_CLIENT_DATA[clientId];
    
    if (!client) {
        console.error('Client not found:', clientId);
        return;
    }

    console.log('👤 Selected client:', client.name);
    
    // Show session tab when client is selected
    showTab('session');
    
    // Update all views with client data
    loadSessionView();
    loadAnalyticsView();
    loadRecommendationsView();
}

function loadSessionView() {
    const client = DEMO_CLIENT_DATA[currentClient];
    if (!client) return;

    console.log('🎙️ Loading session view for:', client.name);

    // Update session header
    const sessionHeader = document.querySelector('#session-tab .tab-header h2');
    if (sessionHeader) {
        sessionHeader.textContent = `Live Session: ${client.name}`;
    }

    // Update profile fields
    updateProfileFields(client.profile);
    
    // Update conversation (demo messages)
    updateConversationFeed();
    
    // Update session insights
    updateSessionInsights(client);
}

function updateProfileFields(profile) {
    const fields = {
        'Household Size': `${profile.householdSize} members`,
        'Monthly Income': `$${profile.monthlyIncome.toLocaleString()}`,
        'Housing Type': profile.housingType,
        'Monthly Expenses': `$${profile.monthlyExpenses.toLocaleString()}`,
        'Current Savings': `$${profile.currentSavings.toLocaleString()}`,
        'Risk Tolerance': profile.riskTolerance
    };

    // Update field values in the DOM
    Object.entries(fields).forEach(([label, value]) => {
        const fieldElement = Array.from(document.querySelectorAll('.field-item')).find(
            item => item.querySelector('.field-label')?.textContent.includes(label.split(':')[0])
        );
        if (fieldElement) {
            const valueElement = fieldElement.querySelector('.field-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    });
}

function updateConversationFeed() {
    // Demo conversation messages (already in HTML)
    // In real implementation, this would be populated from session data
    console.log('💬 Conversation feed updated');
}

function updateSessionInsights(client) {
    // Update sentiment, engagement, and key interest
    const sentimentElement = document.querySelector('.insight-value.positive');
    const engagementElement = document.querySelector('.insight-value.high');
    const interestElement = document.querySelector('.insight-value:not(.positive):not(.high)');

    if (sentimentElement) sentimentElement.textContent = client.sentiment.charAt(0).toUpperCase() + client.sentiment.slice(1);
    if (engagementElement) engagementElement.textContent = client.engagement.charAt(0).toUpperCase() + client.engagement.slice(1);
    if (interestElement) interestElement.textContent = client.keyInterest;
}

function loadAnalyticsView() {
    const client = DEMO_CLIENT_DATA[currentClient];
    if (!client) return;

    console.log('📊 Loading analytics view for:', client.name);

    // Update analytics header
    const analyticsHeader = document.querySelector('#analytics-tab .tab-header h2');
    if (analyticsHeader) {
        analyticsHeader.textContent = `Client Analytics: ${client.name}`;
    }

    // Update metrics
    updateMetrics(client.metrics);
    
    // Load charts
    loadAnalyticsCharts(client);
}

function updateMetrics(metrics) {
    const metricValues = document.querySelectorAll('.metric-value');
    const values = [
        `$${metrics.netWorth.toLocaleString()}`,
        `$${metrics.monthlySurplus.toLocaleString()}`,
        `${metrics.savingsRate}%`,
        `$${metrics.insuranceCoverage.toLocaleString()}`
    ];

    metricValues.forEach((element, index) => {
        if (values[index]) {
            element.textContent = values[index];
        }
    });
}

function loadAnalyticsCharts(client) {
    // Generate 30-year projections using SAME logic as demo-frontend
    const projections = generateProjections(client);
    
    console.log('📊 Rendering advisor charts with projections:', {
        years: projections.years.length,
        netWorthRange: [projections.netWorth[0], projections.netWorth[projections.netWorth.length - 1]],
        projectedRetirement: projections.projectedRetirementFund
    });
    
    // 1. Net Worth Growth Chart (matching demo-frontend)
    renderAdvisorChart('advisorNetWorthChart', {
        type: 'line',
        data: {
            labels: projections.years,
            datasets: [{
                label: 'Net Worth Growth',
                data: projections.netWorth,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '30-Year Net Worth Projection',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            }
        }
    });

    // 2. Income vs Expenses Chart (matching demo-frontend)
    renderAdvisorChart('advisorCashFlowChart', {
        type: 'line',
        data: {
            labels: projections.years,
            datasets: [
                {
                    label: 'Annual Income',
                    data: projections.income,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Expenses',
                    data: projections.expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Income vs Expenses Over Time',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Add additional advisor-specific charts if canvas elements exist
    const savingsCanvas = document.getElementById('advisorSavingsChart');
    if (savingsCanvas) {
        // 3. Savings Accumulation Chart
        renderAdvisorChart('advisorSavingsChart', {
            type: 'bar',
            data: {
                labels: projections.years.filter((_, i) => i % 5 === 0),
                datasets: [{
                    label: 'Accumulated Savings',
                    data: projections.savings.filter((_, i) => i % 5 === 0),
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Savings Accumulation (5-Year Intervals)',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }

    const insuranceCanvas = document.getElementById('advisorInsuranceChart');
    if (insuranceCanvas) {
        // 4. Insurance Needs Chart
        renderAdvisorChart('advisorInsuranceChart', {
            type: 'area',
            data: {
                labels: projections.years,
                datasets: [{
                    label: 'Life Insurance Need',
                    data: projections.insuranceNeeds,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Life Insurance Coverage Needs',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    }
}

function generateProjections(client) {
    // EXACT COPY from demo-frontend generateComprehensiveProjections
    const years = [];
    const netWorth = [];
    const income = [];
    const expenses = [];
    const savings = [];
    const insuranceNeeds = [];
    
    const currentNetWorth = 247500; // DEMO_DERIVED_DETAILS.total_networth
    const monthlyInvestment = 1500;
    const investmentReturn = 0.065;
    const inflationRate = 0.025;
    
    let currentWorth = currentNetWorth;
    let currentIncome = 8500;
    let currentExpenses = 5200;
    let currentSavings = 25000;
    
    for (let year = 0; year <= 30; year++) {
        years.push(2024 + year);
        
        if (year === 0) {
            netWorth.push(currentWorth);
            income.push(currentIncome * 12);
            expenses.push(currentExpenses * 12);
            savings.push(currentSavings);
            insuranceNeeds.push(currentIncome * 12 * 10); // 10x annual income
        } else {
            // Income grows with inflation + merit increases
            currentIncome *= (1 + inflationRate + 0.015);
            // Expenses grow with inflation
            currentExpenses *= (1 + inflationRate);
            
            // Annual investment and savings
            const annualInvestment = monthlyInvestment * 12;
            const annualSavings = (currentIncome - currentExpenses) * 12;
            currentSavings += annualSavings;
            
            // Investment growth
            const investmentGrowth = currentWorth * investmentReturn;
            currentWorth += annualInvestment + investmentGrowth;
            
            netWorth.push(Math.round(currentWorth));
            income.push(Math.round(currentIncome * 12));
            expenses.push(Math.round(currentExpenses * 12));
            savings.push(Math.round(currentSavings));
            insuranceNeeds.push(Math.round(currentIncome * 12 * 10));
        }
    }
    
    return { years, netWorth, income, expenses, savings, insuranceNeeds };
}

function renderAdvisorChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    // Create new chart
    charts[canvasId] = new Chart(canvas, config);
}

function loadRecommendationsView() {
    const client = DEMO_CLIENT_DATA[currentClient];
    if (!client) return;

    console.log('💡 Loading recommendations view for:', client.name);

    // Recommendations are already populated in HTML
    // In real implementation, this would filter and display based on client data
}

function filterRecommendations(filter) {
    const cards = document.querySelectorAll('.recommendation-card');
    
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else {
            // In real implementation, this would check the recommendation type
            card.style.display = 'block';
        }
    });
}

// Session control functions
function startNewSession() {
    console.log('🎙️ Starting new session...');
    showTab('session');
    
    // In real implementation, this would:
    // 1. Create new session
    // 2. Initialize voice recording
    // 3. Start real-time profile building
}

function pauseSession() {
    console.log('⏸️ Pausing session...');
    // Pause voice recording and processing
}

function endSession() {
    console.log('⏹️ Ending session...');
    // End session, save data, generate summary
    showTab('clients');
}

function changeAnalyticsView(view) {
    console.log('📊 Changing analytics view to:', view);
    
    // In real implementation, this would:
    // 1. Update charts based on selected view
    // 2. Show different time horizons or analysis types
    
    const client = DEMO_CLIENT_DATA[currentClient];
    if (client) {
        loadAnalyticsCharts(client);
    }
}

// Recommendation actions
function presentToClient(recommendationId) {
    console.log('📋 Presenting recommendation to client:', recommendationId);
    
    // In real implementation, this would:
    // 1. Open presentation mode
    // 2. Display recommendation details to client
    // 3. Track client response
}

function viewProducts(recommendationId) {
    console.log('🔍 Viewing products for recommendation:', recommendationId);
    
    // In real implementation, this would:
    // 1. Open product catalog
    // 2. Filter by recommendation criteria
    // 3. Show comparative analysis
}

// Export functions for global access
window.selectClient = selectClient;
window.startNewSession = startNewSession;
window.pauseSession = pauseSession;
window.endSession = endSession;
window.changeAnalyticsView = changeAnalyticsView;
window.presentToClient = presentToClient;
window.viewProducts = viewProducts;
