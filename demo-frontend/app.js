// WealthWise Demo - Frontend Only Version
// Realistic Singapore Family Financial Data

// Customer and Personal Details (Based on ER Diagram)
const DEMO_CUSTOMER = {
    customer_id: "WW_2024_001",
    products_bought: ["Financial Planning", "Investment Advisory", "Insurance Review"],
    personal_details: {
        name: "Sarah Chen",
        age: 34,
        marital_status: "Married"
    },
    dependents: [
        {
            name: "Emma Chen",
            relationship: "Daughter",
            age: 8
        },
        {
            name: "Lucas Chen", 
            relationship: "Son",
            age: 5
        }
    ],
    hopes_and_dreams: {
        primary_goal: "Children's Education & Comfortable Retirement",
        retirement: "Age 62 with $1.2M portfolio",
        savings: "Emergency fund + Education fund + Property upgrade"
    }
};

// Financial Details (Aggregator from ER Diagram)
const DEMO_FINANCIAL_DETAILS = {
    // Income streams
    income: [
        {
            income_type: "Primary Salary",
            amount: 6500,
            frequency: "Monthly"
        },
        {
            income_type: "Spouse Salary", 
            amount: 2000,
            frequency: "Monthly"
        }
    ],
    
    // Expense categories
    expenses: [
        {
            expense_type: "Housing (HDB Loan)",
            amount: 1800,
            frequency: "Monthly"
        },
        {
            expense_type: "Food & Groceries",
            amount: 800,
            frequency: "Monthly"
        },
        {
            expense_type: "Transport",
            amount: 400,
            frequency: "Monthly"
        },
        {
            expense_type: "Children (School, Enrichment)",
            amount: 600,
            frequency: "Monthly"
        },
        {
            expense_type: "Insurance Premiums",
            amount: 350,
            frequency: "Monthly"
        },
        {
            expense_type: "Utilities & Phone",
            amount: 250,
            frequency: "Monthly"
        }
    ],
    
    // Assets
    assets: [
        {
            asset_type: "HDB 4-Room Flat",
            current_value: 450000,
            roi: 3.5
        },
        {
            asset_type: "CPF Ordinary Account",
            current_value: 95000,
            roi: 2.5
        },
        {
            asset_type: "CPF Special Account",
            current_value: 45000,
            roi: 4.0
        },
        {
            asset_type: "Bank Savings",
            current_value: 25000,
            roi: 0.5
        },
        {
            asset_type: "Investment Portfolio (STI ETF)",
            current_value: 35000,
            roi: 6.5
        },
        {
            asset_type: "Endowment Policy",
            current_value: 15000,
            roi: 3.0
        }
    ],
    
    // Liabilities
    liabilities: [
        {
            liability_type: "HDB Loan",
            current_value: 320000
        },
        {
            liability_type: "Credit Card",
            current_value: 2500
        }
    ]
};

// Derived Financial Details (Calculated)
const DEMO_DERIVED_DETAILS = {
    total_networth: calculateNetWorth(),
    net_cashflow: calculateNetCashflow()
};

function calculateNetWorth() {
    const totalAssets = DEMO_FINANCIAL_DETAILS.assets.reduce((sum, asset) => sum + asset.current_value, 0);
    const totalLiabilities = DEMO_FINANCIAL_DETAILS.liabilities.reduce((sum, liability) => sum + liability.current_value, 0);
    return totalAssets - totalLiabilities;
}

function calculateNetCashflow() {
    const totalIncome = DEMO_FINANCIAL_DETAILS.income.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = DEMO_FINANCIAL_DETAILS.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totalIncome - totalExpenses;
}

// Demo conversation messages
const DEMO_MESSAGES = [
    {
        role: "assistant",
        content: "Hi Sarah! I'm your WealthWise financial assistant. I'll help you build a comprehensive financial profile. Let's start with some basic information. What's your name and age?",
        timestamp: "2024-01-15T09:00:00Z"
    },
    {
        role: "user", 
        content: "Hi! I'm Sarah Chen, I'm 34 years old.",
        timestamp: "2024-01-15T09:00:30Z"
    },
    {
        role: "assistant",
        content: "Nice to meet you, Sarah! Are you married or single, and how many people are in your household?",
        timestamp: "2024-01-15T09:00:45Z"
    },
    {
        role: "user",
        content: "I'm married and we have 4 people in our household - me, my husband, and our two children.",
        timestamp: "2024-01-15T09:01:15Z"
    },
    {
        role: "assistant",
        content: "Wonderful! Tell me about your children - their ages and any special considerations for their future?",
        timestamp: "2024-01-15T09:01:30Z"
    },
    {
        role: "user",
        content: "We have Emma who's 8 and Lucas who's 5. We want to make sure we can afford their university education.",
        timestamp: "2024-01-15T09:02:00Z"
    },
    {
        role: "assistant",
        content: "That's great planning! What type of housing do you currently live in?",
        timestamp: "2024-01-15T09:02:15Z"
    },
    {
        role: "user",
        content: "We live in a 4-room HDB flat in Tampines.",
        timestamp: "2024-01-15T09:02:45Z"
    },
    {
        role: "assistant",
        content: "Perfect! Now let's talk about income. What's your household's total monthly gross income?",
        timestamp: "2024-01-15T09:03:00Z"
    },
    {
        role: "user",
        content: "I earn $6,500 per month and my husband earns $2,000 part-time, so total is $8,500.",
        timestamp: "2024-01-15T09:03:30Z"
    },
    {
        role: "assistant",
        content: "Excellent income! What are your approximate monthly living expenses?",
        timestamp: "2024-01-15T09:03:45Z"
    },
    {
        role: "user",
        content: "About $5,200 per month including our HDB loan, food, transport, children's expenses, and insurance.",
        timestamp: "2024-01-15T09:04:15Z"
    },
    {
        role: "assistant",
        content: "Good cash flow! How much do you currently have in total savings and investments?",
        timestamp: "2024-01-15T09:04:30Z"
    },
    {
        role: "user",
        content: "We have about $85,000 in CPF, $25,000 in bank savings, $35,000 in STI ETF, and $15,000 in an endowment policy.",
        timestamp: "2024-01-15T09:05:00Z"
    },
    {
        role: "assistant",
        content: "Impressive savings! Do you have any outstanding loans or debts?",
        timestamp: "2024-01-15T09:05:15Z"
    },
    {
        role: "user",
        content: "Yes, we still owe $320,000 on our HDB loan and have about $2,500 on credit cards.",
        timestamp: "2024-01-15T09:05:45Z"
    },
    {
        role: "assistant",
        content: "What's your risk tolerance for investments - conservative, moderate, or aggressive?",
        timestamp: "2024-01-15T09:06:00Z"
    },
    {
        role: "user",
        content: "We're moderate risk takers. We want growth but not too volatile.",
        timestamp: "2024-01-15T09:06:30Z"
    },
    {
        role: "assistant",
        content: "What's your investment time horizon? When do you plan to retire?",
        timestamp: "2024-01-15T09:06:45Z"
    },
    {
        role: "user",
        content: "We're planning to retire at 62, so about 28 years from now.",
        timestamp: "2024-01-15T09:07:15Z"
    },
    {
        role: "assistant",
        content: "How much can you invest monthly beyond your current savings?",
        timestamp: "2024-01-15T09:07:30Z"
    },
    {
        role: "user",
        content: "We can probably invest an additional $1,500 per month.",
        timestamp: "2024-01-15T09:08:00Z"
    },
    {
        role: "assistant",
        content: "What are your main financial goals?",
        timestamp: "2024-01-15T09:08:15Z"
    },
    {
        role: "user",
        content: "Children's university education, comfortable retirement with $1.2M, and maybe upgrading to a condo eventually.",
        timestamp: "2024-01-15T09:08:45Z"
    },
    {
        role: "assistant",
        content: "Perfect! I've gathered all your information. Your financial profile shows a strong foundation with good income, positive cash flow, and clear goals. Let me analyze your situation and provide recommendations.",
        timestamp: "2024-01-15T09:09:00Z"
    }
];

// Chart variables
let analysisChart = null;
let scenarioChart = null;

// Initialize the demo when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Initializing WealthWise Demo...');
    initDemo();
    wireTabControls();
    
    // Add a test function to window for debugging
    window.testTabSwitch = function(tabName) {
        console.log(`🧪 Testing tab switch to: ${tabName}`);
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) {
            button.click();
        } else {
            console.error(`❌ Tab button not found: ${tabName}`);
        }
    };
    
    console.log('🧪 Test function added: window.testTabSwitch("analysis")');
});

function initDemo() {
    // Load demo messages
    loadDemoMessages();
    
    // Load all tabs with demo data
    loadDemoAnalysis();
    loadDemoScenarios(); 
    loadDemoPlans();
    
    // Verify all content containers exist
    verifyTabContainers();
    
    console.log('✅ Demo initialized successfully');
}

// Build payload compatible with Python categorizer API
function buildCategorizerPayload() {
    const customer = DEMO_CUSTOMER;
    const fin = DEMO_FINANCIAL_DETAILS;
    const derived = {
        Total_Networth: DEMO_DERIVED_DETAILS.total_networth,
        Net_Cashflow: DEMO_DERIVED_DETAILS.net_cashflow
    };

    // Map incomes to expected shape
    const incomeArr = fin.income.map(i => ({
        Income_Type: i.income_type === 'Primary Salary' ? 'Active' : i.income_type,
        Amount: i.amount
    }));

    // Map assets
    const assetsArr = fin.assets.map(a => ({
        'Asset Type': a.asset_type || 'Other',
        'Current Value': a.current_value || 0,
        'Return on Investment': a.roi != null ? a.roi / 100 : (a.roi || 0)
    }));

    // Map liabilities
    const liabilitiesArr = fin.liabilities.map(l => ({
        'Liability Type': l.liability_type || 'Other',
        'Current Value': l.current_value || 0
    }));

    // Map dependents
    const dependentsArr = (customer.dependents || []).map(d => ({
        Relationship: d.relationship || 'Other'
    }));

    const payload = [{
        Customer_ID: customer.customer_id || 'N/A',
        'Personal Details': {
            Age: customer.personal_details.age || 0,
            'Marital Status': customer.personal_details.marital_status || 'Unknown',
            Gender: customer.personal_details.gender || 'Unknown'
        },
        'Financial Details': {
            Income: incomeArr,
            Assets: assetsArr,
            Liabilities: liabilitiesArr,
            Derived: {
                Total_Networth: derived.Total_Networth,
                Net_Cashflow: derived.Net_Cashflow
            }
        },
        Dependents: dependentsArr
    }];

    return payload;
}

// Send payload to the Python categorizer API and render results
async function sendToCategorizer() {
    const btn = document.getElementById('send_to_categorizer');
    const resultDiv = document.getElementById('categorizer_result');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    resultDiv.style.display = 'none';
    resultDiv.textContent = '';
    try {
        const payload = buildCategorizerPayload();
        const resp = await fetch('http://localhost:9000/api/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
        const data = await resp.json();
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<strong>Error:</strong> ' + String(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send to Categorizer';
    }
}

// Wire Send button
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send_to_categorizer');
    if (sendBtn) sendBtn.addEventListener('click', sendToCategorizer);
});

function verifyTabContainers() {
    const containers = [
        'profile-content',
        'analysis-content', 
        'scenarios-content',
        'plans-content'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            console.log(`✅ Container found: ${containerId}`);
            if (container.innerHTML.trim() === '') {
                console.warn(`⚠️ Container is empty: ${containerId}`);
            } else {
                console.log(`📊 Container has content: ${containerId} (${container.innerHTML.length} chars)`);
            }
        } else {
            console.error(`❌ Container missing: ${containerId}`);
        }
    });
}

function wireTabControls() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('🎯 Setting up tab controls...', { buttons: tabButtons.length, contents: tabContents.length });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            console.log(`🎯 Switching to tab: ${targetTab}`);
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log(`✅ Activated tab content: ${targetTab}-content`);
            } else {
                console.error(`❌ Tab content not found: ${targetTab}-content`);
            }
            
            // Trigger content loading for specific tabs
            loadTabSpecificContent(targetTab);
        });
    });
}

function loadTabSpecificContent(tabName) {
    console.log(`📊 Loading specific content for: ${tabName}`);
    
    switch(tabName) {
        case 'analysis':
            // Ensure analysis content is visible
            const analysisContainer = document.getElementById('analysis-content');
            if (analysisContainer && analysisContainer.innerHTML.trim() === '') {
                console.warn('⚠️ Analysis content is empty, reloading...');
                loadDemoAnalysis();
            }
            console.log('📊 Analysis tab - charts should be visible');
            break;
        case 'scenarios':
            // Ensure scenarios content is visible
            const scenariosContainer = document.getElementById('scenarios-content');
            if (scenariosContainer && scenariosContainer.innerHTML.trim() === '') {
                console.warn('⚠️ Scenarios content is empty, reloading...');
                loadDemoScenarios();
            }
            console.log('🎭 Scenarios tab - content should be visible');
            break;
        case 'plans':
            // Ensure plans content is visible
            const plansContainer = document.getElementById('plans_grid');
            if (plansContainer && plansContainer.innerHTML.trim() === '') {
                console.warn('⚠️ Plans content is empty, reloading...');
                loadDemoPlans();
            }
            console.log('💡 Plans tab - content should be visible');
            break;
        case 'profile':
        default:
            console.log('👤 Profile tab - messages should be visible');
            break;
    }
}

function loadDemoMessages() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    DEMO_MESSAGES.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        
        const avatar = message.role === 'user' ? 'S' : 'W';
        const time = new Date(message.timestamp).toLocaleTimeString('en-SG', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${message.content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadDemoAnalysis() {
    // Generate comprehensive financial projections
    const projectionData = generateComprehensiveProjections();
    
    // Render multiple analysis charts
    renderAnalysisCharts(projectionData);
    
    // Generate insights
    generateAnalysisInsights(projectionData);
}

function generateComprehensiveProjections() {
    const years = [];
    const netWorth = [];
    const income = [];
    const expenses = [];
    const savings = [];
    const insuranceNeeds = [];
    
    const currentNetWorth = DEMO_DERIVED_DETAILS.total_networth;
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

function renderAnalysisCharts(data) {
    // Render Net Worth Chart
    renderChart('netWorthChart', 'Net Worth Projection', data.years, [{
        label: 'Net Worth (SGD)',
        data: data.netWorth,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true
    }]);
    
    // Render Income vs Expenses Chart
    renderChart('incomeExpenseChart', 'Annual Income vs Expenses', data.years, [
        {
            label: 'Annual Income',
            data: data.income,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false
        },
        {
            label: 'Annual Expenses',
            data: data.expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: false
        }
    ]);
    
    // Render Savings Growth Chart
    renderChart('savingsChart', 'Savings Accumulation', data.years, [{
        label: 'Total Savings (SGD)',
        data: data.savings,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true
    }]);
    
    // Render Insurance Needs Chart
    renderChart('insuranceChart', 'Life Insurance Requirements', data.years, [{
        label: 'Required Coverage (SGD)',
        data: data.insuranceNeeds,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true
    }]);
}

function renderChart(canvasId, title, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.warn(`Canvas ${canvasId} not found`);
        return;
    }
    
    // Destroy existing chart if it exists
    if (window[canvasId + 'Instance'] && typeof window[canvasId + 'Instance'].destroy === 'function') {
        window[canvasId + 'Instance'].destroy();
    }
    
    window[canvasId + 'Instance'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map(dataset => ({
                ...dataset,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 6
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#374151'
                },
                legend: {
                    display: datasets.length > 1,
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
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function generateAnalysisInsights(data) {
    const insightsContainer = document.getElementById('analysis_insights');
    if (!insightsContainer) return;
    
    const finalNetWorth = data.netWorth[data.netWorth.length - 1];
    const retirementAge = 62;
    const currentAge = 34;
    const yearsToRetirement = retirementAge - currentAge;
    const retirementNetWorth = data.netWorth[yearsToRetirement];
    
    // Calculate life insurance recommendation
    const annualIncome = 8500 * 12;
    const recommendedCover = annualIncome * 10; // 10x annual income
    
    const insights = [
        {
            title: "Retirement Readiness",
            value: `$${(retirementNetWorth / 1000).toFixed(0)}K`,
            description: `Projected net worth at age ${retirementAge}. You're on track to exceed your $1.2M goal!`
        },
        {
            title: "Monthly Surplus",
            value: `$${DEMO_DERIVED_DETAILS.net_cashflow.toLocaleString()}`,
            description: "Strong positive cash flow enables aggressive wealth building"
        },
        {
            title: "Life Insurance Gap",
            value: `$${(recommendedCover / 1000).toFixed(0)}K`,
            description: "Recommended coverage for primary earner (10x annual income)"
        },
        {
            title: "Education Fund Target",
            value: "$200K",
            description: "Estimated cost for both children's university education (local + overseas option)"
        }
    ];
    
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-value">${insight.value}</div>
            <div class="insight-description">${insight.description}</div>
        </div>
    `).join('');
}

function loadDemoScenarios() {
    const scenarios = generateDemoScenarios();
    renderScenariosUI({ scenarios });
}

function generateDemoScenarios() {
    const baseProjection = generateComprehensiveProjections();
    
    return [
        {
            name: 'Current Path',
            type: 'neutral',
            description: 'Maintaining current financial trajectory with steady income growth and disciplined investing',
            assumptions: [
                '3.5% annual income growth',
                '2.5% inflation rate', 
                '$1,500 monthly investments',
                '6.5% investment returns'
            ],
            data: {
                netWorth: baseProjection.netWorth,
                income: baseProjection.income,
                expenses: baseProjection.expenses,
                savings: baseProjection.savings,
                insuranceNeeds: baseProjection.insuranceNeeds
            },
            impact: {
                income: 0,
                expenses: 0,
                investments: 0,
                netWorth: 0
            }
        },
        {
            name: 'Career Advancement',
            type: 'positive',
            description: 'Promotion and salary increase, enabling higher investment contributions',
            scenarioAge: 40,
            assumptions: [
                '25% immediate salary increase',
                '5% annual growth thereafter',
                '$2,500 monthly investments',
                'Same investment returns'
            ],
            data: generateScenarioComprehensiveProjection(1.25, 1.0, 2500),
            impact: {
                income: +25,
                expenses: 0,
                investments: +67,
                netWorth: +35
            }
        },
        {
            name: 'Job Loss',
            type: 'negative', 
            description: 'Temporary unemployment requiring emergency fund usage and reduced investments',
            scenarioAge: 45,
            assumptions: [
                '6 months unemployment',
                '50% income for 18 months',
                'Emergency fund depletion',
                'Minimal investments for 2 years'
            ],
            data: generateScenarioComprehensiveProjection(0.75, 1.0, 500),
            impact: {
                income: -25,
                expenses: 0,
                investments: -67,
                netWorth: -20
            }
        },
        {
            name: 'Medical Emergency',
            type: 'negative',
            description: 'Major medical expense and increased ongoing healthcare costs',
            scenarioAge: 55,
            assumptions: [
                '$80K immediate medical cost',
                '20% higher monthly expenses',
                'Reduced investment capacity',
                'Insurance covers 70%'
            ],
            data: generateScenarioComprehensiveProjection(1.0, 1.2, 800),
            impact: {
                income: 0,
                expenses: +20,
                investments: -47,
                netWorth: -15
            }
        },
        {
            name: 'Economic Downturn',
            type: 'critical',
            description: 'Recession impact with salary cuts, job insecurity, and market volatility',
            scenarioAge: 50,
            assumptions: [
                '20% salary reduction',
                'Market returns drop to 3%',
                'Conservative investments only',
                'Extended recovery period'
            ],
            data: generateScenarioComprehensiveProjection(0.8, 1.0, 800, 0.03),
            impact: {
                income: -20,
                expenses: 0,
                investments: -47,
                netWorth: -30
            }
        }
    ];
}

function generateScenarioComprehensiveProjection(incomeMultiplier, expenseMultiplier, monthlyInvestment, returnRate = 0.065) {
    const years = [];
    const netWorth = [];
    const income = [];
    const expenses = [];
    const savings = [];
    const insuranceNeeds = [];
    
    const currentNetWorth = DEMO_DERIVED_DETAILS.total_networth;
    const inflationRate = 0.025;
    
    let currentWorth = currentNetWorth;
    let currentIncome = 8500 * incomeMultiplier;
    let currentExpenses = 5200 * expenseMultiplier;
    let currentSavings = 25000;
    
    for (let year = 0; year <= 30; year++) {
        years.push(2024 + year);
        
        if (year === 0) {
            netWorth.push(currentWorth);
            income.push(currentIncome * 12);
            expenses.push(currentExpenses * 12);
            savings.push(currentSavings);
            insuranceNeeds.push(currentIncome * 12 * 10);
        } else {
            currentIncome *= (1 + inflationRate + 0.015);
            currentExpenses *= (1 + inflationRate);
            
            const annualInvestment = monthlyInvestment * 12;
            const annualSavings = (currentIncome - currentExpenses) * 12;
            currentSavings += annualSavings;
            
            const investmentGrowth = currentWorth * returnRate;
            currentWorth += annualInvestment + investmentGrowth;
            
            netWorth.push(Math.round(currentWorth));
            income.push(Math.round(currentIncome * 12));
            expenses.push(Math.round(currentExpenses * 12));
            savings.push(Math.round(currentSavings));
            insuranceNeeds.push(Math.round(currentIncome * 12 * 10));
        }
    }
    
    return { netWorth, income, expenses, savings, insuranceNeeds };
}

function renderScenariosUI(data) {
    const container = document.getElementById('scenarios-content');
    if (!container) return;
    
    const scenarios = data.scenarios;
    const baseline = scenarios[0]; // Current Path as baseline
    
    container.innerHTML = `
        <div class="scenarios-header">
            <h2>Financial Scenarios Analysis</h2>
            <p>Compare different life scenarios and their impact on your financial future</p>
        </div>
        
        <div class="scenario-selector">
            <label for="scenarioSelect">Select Scenario to Analyze:</label>
            <select id="scenarioSelect">
                ${scenarios.map((scenario, index) => `
                    <option value="${index}">${scenario.name}</option>
                `).join('')}
            </select>
        </div>
        
        <div class="scenario-details" id="scenarioDetails">
            <!-- Will be populated by updateScenarioDetails -->
        </div>
        
        <!-- Age-based Scenario Timeline Chart -->
        <div class="scenario-timeline-section" style="display: none;">
            <h3>Life Scenario Timeline</h3>
            <p class="timeline-description">This chart shows when different life scenarios typically occur and their impact on your financial trajectory over your lifetime</p>
            <div class="scenario-timeline-card">
                <canvas id="scenarioTimelineChart"></canvas>
            </div>
        </div>
        
        <div class="scenarios-comparison">
            <h3>Financial Impact Comparison</h3>
            <div class="scenario-charts-grid">
                <div class="scenario-chart-card">
                    <canvas id="scenarioNetWorthChart"></canvas>
                </div>
                <div class="scenario-chart-card">
                    <canvas id="scenarioIncomeChart"></canvas>
                </div>
                <div class="scenario-chart-card">
                    <canvas id="scenarioExpenseChart"></canvas>
                </div>
                <div class="scenario-chart-card">
                    <canvas id="scenarioSavingsChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Initialize with first scenario
    updateScenarioDetails(scenarios[0]);
    renderScenarioCharts(scenarios[0], baseline);
    
    // Render the age-based timeline chart for the first scenario
    // renderScenarioTimelineChart(scenarios[0]); // Hidden from UI
    
    // Add event listener for scenario selection
    document.getElementById('scenarioSelect').addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        const selectedScenario = scenarios[selectedIndex];
        updateScenarioDetails(selectedScenario);
        renderScenarioCharts(selectedScenario, baseline);
        
        // Update the timeline chart for the selected scenario
        // renderScenarioTimelineChart(selectedScenario); // Hidden from UI
    });
}

function updateScenarioDetails(scenario) {
    const detailsContainer = document.getElementById('scenarioDetails');
    if (!detailsContainer) return;
    
    detailsContainer.innerHTML = `
        <div class="scenario-detail-card ${scenario.type}">
            <div class="scenario-badge ${scenario.type}">${scenario.name}</div>
            <div class="scenario-description">${scenario.description}</div>
            <div class="scenario-assumptions">
                <h4>Key Assumptions</h4>
                <ul>
                    ${scenario.assumptions.map(assumption => `<li>${assumption}</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="scenario-detail-card neutral">
            <h3>Financial Impact</h3>
            <div class="impact-grid">
                <div class="impact-item">
                    <span class="impact-label">Income Change:</span>
                    <span class="impact-value ${scenario.impact.income >= 0 ? 'positive' : 'negative'}">
                        ${scenario.impact.income >= 0 ? '+' : ''}${scenario.impact.income}%
                    </span>
                </div>
                <div class="impact-item">
                    <span class="impact-label">Expense Change:</span>
                    <span class="impact-value ${scenario.impact.expenses <= 0 ? 'positive' : 'negative'}">
                        ${scenario.impact.expenses >= 0 ? '+' : ''}${scenario.impact.expenses}%
                    </span>
                </div>
                <div class="impact-item">
                    <span class="impact-label">Investment Change:</span>
                    <span class="impact-value ${scenario.impact.investments >= 0 ? 'positive' : 'negative'}">
                        ${scenario.impact.investments >= 0 ? '+' : ''}${scenario.impact.investments}%
                    </span>
                </div>
                <div class="impact-item">
                    <span class="impact-label">Net Worth Impact:</span>
                    <span class="impact-value ${scenario.impact.netWorth >= 0 ? 'positive' : 'negative'}">
                        ${scenario.impact.netWorth >= 0 ? '+' : ''}${scenario.impact.netWorth}%
                    </span>
                </div>
            </div>
        </div>
    `;
}

function renderScenarioCharts(scenario, baseline) {
    const years = Array.from({length: 31}, (_, i) => 2024 + i);
    
    const getScenarioColor = (type) => {
        switch(type) {
            case 'positive': return '#10b981';
            case 'negative': return '#ef4444';
            case 'critical': return '#dc2626';
            default: return '#667eea';
        }
    };
    
    const scenarioColor = getScenarioColor(scenario.type);
    const baselineColor = '#6b7280';
    
    // Net Worth Comparison
    renderScenarioChart('scenarioNetWorthChart', 'Net Worth Comparison', years, [
        {
            label: 'Current Path',
            data: baseline.data.netWorth,
            borderColor: baselineColor,
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderDash: [5, 5]
        },
        {
            label: scenario.name,
            data: scenario.data.netWorth,
            borderColor: scenarioColor,
            backgroundColor: scenarioColor + '20'
        }
    ]);
    
    // Income Comparison
    renderScenarioChart('scenarioIncomeChart', 'Annual Income Comparison', years, [
        {
            label: 'Current Path',
            data: baseline.data.income,
            borderColor: baselineColor,
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderDash: [5, 5]
        },
        {
            label: scenario.name,
            data: scenario.data.income,
            borderColor: scenarioColor,
            backgroundColor: scenarioColor + '20'
        }
    ]);
    
    // Expenses Comparison
    renderScenarioChart('scenarioExpenseChart', 'Annual Expenses Comparison', years, [
        {
            label: 'Current Path',
            data: baseline.data.expenses,
            borderColor: baselineColor,
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderDash: [5, 5]
        },
        {
            label: scenario.name,
            data: scenario.data.expenses,
            borderColor: scenarioColor,
            backgroundColor: scenarioColor + '20'
        }
    ]);
    
    // Savings Comparison
    renderScenarioChart('scenarioSavingsChart', 'Savings Accumulation Comparison', years, [
        {
            label: 'Current Path',
            data: baseline.data.savings,
            borderColor: baselineColor,
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderDash: [5, 5]
        },
        {
            label: scenario.name,
            data: scenario.data.savings,
            borderColor: scenarioColor,
            backgroundColor: scenarioColor + '20'
        }
    ]);
}

function renderScenarioChart(canvasId, title, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.warn(`Canvas ${canvasId} not found`);
        return;
    }
    
    // Destroy existing chart if it exists
    if (window[canvasId + 'Instance'] && typeof window[canvasId + 'Instance'].destroy === 'function') {
        window[canvasId + 'Instance'].destroy();
    }
    
    window[canvasId + 'Instance'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map(dataset => ({
                ...dataset,
                borderWidth: dataset.borderDash ? 2 : 3,
                tension: 0.4,
                pointRadius: 1,
                pointHoverRadius: 4,
                fill: false
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function loadDemoPlans() {
    const plansContainer = document.getElementById('plans_grid');
    if (!plansContainer) return;
    
    // ABC Insurance Product Portfolio
    const abcInsuranceData = {
        "company_name": "ABC Insurance",
        "product_portfolio": {
            "Life & Health Protection": {
                "Term Life": [
                    {
                        "product_name": "LifeLock Term Shield",
                        "product_description": "Fixed premium and death benefit for a specific period.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Term Life"
                        }
                    },
                    {
                        "product_name": "Mortgage Safeguard",
                        "product_description": "Premium stays the same, death benefit decreases to cover a loan.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Term Life"
                        }
                    },
                    {
                        "product_name": "Inflation Guard Term",
                        "product_description": "Premium and death benefit increase to keep pace with inflation.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Term Life"
                        }
                    }
                ],
                "Whole Life": [
                    {
                        "product_name": "Generational Legacy",
                        "product_description": "Guaranteed death benefit and cash value growth.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Whole Life"
                        }
                    },
                    {
                        "product_name": "Flexi-Life Universal",
                        "product_description": "Flexible premiums and death benefits with cash value component.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Whole Life"
                        }
                    },
                    {
                        "product_name": "MarketWise Whole Life",
                        "product_description": "Death benefit and cash value can fluctuate based on market performance.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Whole Life"
                        }
                    }
                ],
                "Critical Illness": [
                    {
                        "product_name": "Vitality Critical Cover",
                        "product_description": "Lump-sum payout upon diagnosis of a covered critical illness.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Critical Illness"
                        }
                    }
                ],
                "Disability": [
                    {
                        "product_name": "Income Stabilizer",
                        "product_description": "Replaces a portion of income for a limited time.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Disability"
                        }
                    },
                    {
                        "product_name": "Perma-Guard Disability",
                        "product_description": "Replaces a portion of income for an extended period, often until retirement.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Disability"
                        }
                    }
                ],
                "Medical & Hospitalization": [
                    {
                        "product_name": "MediShield Hospital Plan",
                        "product_description": "Covers hospital stays and medical expenses.",
                        "tags": {
                            "category": "Life & Health Protection",
                            "type": "Medical & Hospitalization"
                        }
                    }
                ]
            },
            "Wealth & Retirement": {
                "Endowment": [
                    {
                        "product_name": "Future Wealth Builder",
                        "product_description": "A savings-oriented plan that pays a lump sum at the end of the term.",
                        "tags": {
                            "category": "Wealth & Retirement",
                            "type": "Endowment"
                        }
                    }
                ],
                "Annuity": [
                    {
                        "product_name": "Retirement Income Flow",
                        "product_description": "Provides a steady stream of income during retirement.",
                        "tags": {
                            "category": "Wealth & Retirement",
                            "type": "Annuity"
                        }
                    },
                    {
                        "product_name": "Future Forward Annuity",
                        "product_description": "Income payments are deferred to a future date, allowing money to grow.",
                        "tags": {
                            "category": "Wealth & Retirement",
                            "type": "Annuity"
                        }
                    }
                ],
                "Investment-Linked": [
                    {
                        "product_name": "Growth Horizon ILP",
                        "product_description": "A single-premium combination of life insurance and investment.",
                        "tags": {
                            "category": "Wealth & Retirement",
                            "type": "Investment-Linked"
                        }
                    },
                    {
                        "product_name": "Premium Plus ILP",
                        "product_description": "A regular-premium combination of life insurance and investment.",
                        "tags": {
                            "category": "Wealth & Retirement",
                            "type": "Investment-Linked"
                        }
                    }
                ]
            },
            "Specialized & Goal-Based": {
                "Children's Education": [
                    {
                        "product_name": "Future Scholars Plan",
                        "product_description": "A savings plan to accumulate funds for a child's education.",
                        "tags": {
                            "category": "Specialized & Goal-Based",
                            "type": "Children's Education"
                        }
                    }
                ],
                "Legacy": [
                    {
                        "product_name": "Generational Handover",
                        "product_description": "Plan to preserve and transfer wealth to the next generation.",
                        "tags": {
                            "category": "Specialized & Goal-Based",
                            "type": "Legacy"
                        }
                    }
                ]
            }
        }
    };

    // Transform ABC Insurance data into recommended plans for Sarah Chen Family
    const recommendedPlans = [
        // Life Insurance - addressing the $350K gap identified in analysis
        {
            type: 'insurance',
            title: abcInsuranceData.product_portfolio["Life & Health Protection"]["Term Life"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '🛡️',
            features: [
                { label: 'Coverage Amount', value: '$1,200K' },
                { label: 'Annual Premium', value: '$1,140' },
                { label: 'Term', value: '30 years' },
                { label: 'Premium Type', value: 'Fixed' }
            ],
            recommendation: {
                title: 'Highly Recommended',
                text: abcInsuranceData.product_portfolio["Life & Health Protection"]["Term Life"][0].product_description + ' Addresses the $350K insurance gap identified in your analysis.'
            }
        },
        // Critical Illness Coverage
        {
            type: 'insurance',
            title: abcInsuranceData.product_portfolio["Life & Health Protection"]["Critical Illness"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '🏥',
            features: [
                { label: 'Coverage Amount', value: '$300K' },
                { label: 'Annual Premium', value: '$1,440' },
                { label: 'Conditions Covered', value: '120+' },
                { label: 'Multiple Claims', value: 'Yes' }
            ],
            recommendation: {
                title: 'Essential Protection',
                text: abcInsuranceData.product_portfolio["Life & Health Protection"]["Critical Illness"][0].product_description + ' Protects against major illness financial impact.'
            }
        },
        // Medical & Hospitalization
        {
            type: 'insurance',
            title: abcInsuranceData.product_portfolio["Life & Health Protection"]["Medical & Hospitalization"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '🏥',
            features: [
                { label: 'Coverage', value: 'Private Hospital' },
                { label: 'Annual Limit', value: '$2M' },
                { label: 'Family Premium', value: '$2,160' },
                { label: 'Deductible', value: '$3K' }
            ],
            recommendation: {
                title: 'Family Coverage',
                text: abcInsuranceData.product_portfolio["Life & Health Protection"]["Medical & Hospitalization"][0].product_description + ' Comprehensive family medical protection.'
            }
        },
        // Education Savings - addressing the $250/month shortfall
        {
            type: 'investment',
            title: abcInsuranceData.product_portfolio["Specialized & Goal-Based"]["Children's Education"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '🎓',
            features: [
                { label: 'Target Amount', value: '$150K' },
                { label: 'Monthly Contribution', value: '$650' },
                { label: 'Time Horizon', value: '16 years' },
                { label: 'Guaranteed Returns', value: 'Yes' }
            ],
            recommendation: {
                title: 'Education Priority',
                text: abcInsuranceData.product_portfolio["Specialized & Goal-Based"]["Children's Education"][0].product_description + ' Addresses the $250/month education funding gap.'
            }
        },
        // Investment-Linked Policy for diversification
        {
            type: 'investment',
            title: abcInsuranceData.product_portfolio["Wealth & Retirement"]["Investment-Linked"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '📈',
            features: [
                { label: 'Insurance + Investment', value: 'Combined' },
                { label: 'Expected Return', value: '6-8% p.a.' },
                { label: 'Min Investment', value: '$1,000' },
                { label: 'Premium Flexibility', value: 'High' }
            ],
            recommendation: {
                title: 'Growth Potential',
                text: abcInsuranceData.product_portfolio["Wealth & Retirement"]["Investment-Linked"][0].product_description + ' Combines protection with investment growth.'
            }
        },
        // Retirement Planning
        {
            type: 'investment',
            title: abcInsuranceData.product_portfolio["Wealth & Retirement"]["Annuity"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '🏖️',
            features: [
                { label: 'Monthly Payout', value: '$2,500' },
                { label: 'Monthly Contribution', value: '$800' },
                { label: 'Payout Period', value: 'Lifetime' },
                { label: 'Guaranteed Income', value: 'Yes' }
            ],
            recommendation: {
                title: 'Retirement Security',
                text: abcInsuranceData.product_portfolio["Wealth & Retirement"]["Annuity"][0].product_description + ' Ensures steady retirement income.'
            }
        },
        // Disability Income Protection
        {
            type: 'insurance',
            title: abcInsuranceData.product_portfolio["Life & Health Protection"]["Disability"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '💼',
            features: [
                { label: 'Monthly Benefit', value: '$4,000' },
                { label: 'Benefit Period', value: 'Limited Time' },
                { label: 'Annual Premium', value: '$960' },
                { label: 'Waiting Period', value: '90 days' }
            ],
            recommendation: {
                title: 'Income Protection',
                text: abcInsuranceData.product_portfolio["Life & Health Protection"]["Disability"][0].product_description + ' Critical for primary breadwinner protection.'
            }
        },
        // Whole Life for long-term wealth building
        {
            type: 'investment',
            title: abcInsuranceData.product_portfolio["Life & Health Protection"]["Whole Life"][0].product_name,
            provider: abcInsuranceData.company_name,
            icon: '💎',
            features: [
                { label: 'Death Benefit', value: 'Guaranteed' },
                { label: 'Cash Value Growth', value: 'Guaranteed' },
                { label: 'Premium', value: 'Fixed' },
                { label: 'Policy Loans', value: 'Available' }
            ],
            recommendation: {
                title: 'Legacy Building',
                text: abcInsuranceData.product_portfolio["Life & Health Protection"]["Whole Life"][0].product_description + ' Long-term wealth preservation and transfer.'
            }
        }
    ];
    
    plansContainer.innerHTML = recommendedPlans.map(plan => `
        <div class="plan-card">
            <div class="plan-header">
                <div class="plan-icon ${plan.type}">
                    ${plan.icon}
                </div>
                <div>
                    <div class="plan-title">${plan.title}</div>
                    <div class="plan-provider">${plan.provider}</div>
                </div>
            </div>
            
            <div class="plan-details">
                ${plan.features.map(feature => `
                    <div class="plan-feature">
                        <span class="plan-feature-label">${feature.label}:</span>
                        <span class="plan-feature-value">${feature.value}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="plan-recommendation">
                <div class="plan-recommendation-title">${plan.recommendation.title}</div>
                <div class="plan-recommendation-text">${plan.recommendation.text}</div>
            </div>
        </div>
    `).join('');
}

// Add CSS for impact grid
const additionalCSS = `
.impact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
}

.impact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.impact-label {
    font-size: 0.9rem;
    color: #6b7280;
}

.impact-value {
    font-weight: 600;
    font-size: 1rem;
}

.impact-value.positive {
    color: #10b981;
}

.impact-value.negative {
    color: #ef4444;
}

.scenario-timeline-section {
    margin: 2rem 0;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.scenario-timeline-section h3 {
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.timeline-description {
    color: #666;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.scenario-timeline-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    height: 500px;
    position: relative;
}

.scenario-timeline-card canvas {
    width: 100% !important;
    height: 100% !important;
}
`;

// Render Age-based Scenario Timeline Chart for a specific scenario
function renderScenarioTimelineChart(selectedScenario) {
    const canvas = document.getElementById('scenarioTimelineChart');
    if (!canvas) return;

    // Sarah Chen is currently 34 years old
    const currentAge = 34;
    const maxAge = 100;
    const ages = [];
    
    // Create age array from current age to 100
    for (let age = currentAge; age <= maxAge; age++) {
        ages.push(age);
    }
    
    // Get scenario-specific multipliers - MUST match generateScenarioComprehensiveProjection parameters
    let incomeMultiplier = 1.0;
    let expenseMultiplier = 1.0;
    let monthlyInvestment = 1500; // Base monthly investment
    let returnRate = 0.065; // Base return rate
    let scenarioAge = null;
    
    if (selectedScenario.name !== 'Current Path') {
        scenarioAge = selectedScenario.scenarioAge;
        
        // Apply scenario-specific impacts - EXACT match with scenario data
        switch(selectedScenario.name) {
            case 'Career Advancement':
                incomeMultiplier = 1.25; // 25% immediate salary increase
                expenseMultiplier = 1.0;
                monthlyInvestment = 2500; // $2,500 monthly investments
                returnRate = 0.065; // Same investment returns
                break;
            case 'Job Loss':
                incomeMultiplier = 0.75; // 50% income for 18 months (averaged to 75%)
                expenseMultiplier = 1.0;
                monthlyInvestment = 500; // Minimal investments for 2 years
                returnRate = 0.065;
                break;
            case 'Medical Emergency':
                incomeMultiplier = 1.0; // No income change
                expenseMultiplier = 1.2; // 20% higher monthly expenses
                monthlyInvestment = 800; // Reduced investment capacity
                returnRate = 0.065;
                break;
            case 'Economic Downturn':
                incomeMultiplier = 0.8; // 20% salary reduction
                expenseMultiplier = 1.0;
                monthlyInvestment = 800; // Conservative investments only
                returnRate = 0.03; // Market returns drop to 3%
                break;
        }
    }
    
    // Create realistic, scenario-specific static graphs
    const datasets = [];
    let activeIncome, passiveIncome, savingsData, expensesData;
    
    if (selectedScenario.name === 'Current Path') {
        // CURRENT PATH - Normal steady growth
        activeIncome = ages.map(age => {
            if (age <= 65) {
                const yearsFromNow = age - currentAge;
                return 102000 * Math.pow(1.035, yearsFromNow); // 3.5% annual growth
            }
            return 0;
        });
        
        passiveIncome = ages.map(age => {
            if (age > 65) {
                const yearsInRetirement = age - 65;
                return 60000 * Math.pow(1.02, yearsInRetirement);
            }
            return age >= 40 ? 5000 * Math.pow(1.06, age - 40) : 2000;
        });
        
        savingsData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            return 39600 * Math.pow(1.065, yearsFromNow); // Steady savings growth
        });
        
        expensesData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            return 62400 * Math.pow(1.025, yearsFromNow); // Inflation only
        });
        
    } else if (selectedScenario.name === 'Career Advancement') {
        // CAREER ADVANCEMENT - Income boost at age 40, higher savings
        activeIncome = ages.map(age => {
            if (age <= 65) {
                const yearsFromNow = age - currentAge;
                let income = 102000 * Math.pow(1.035, yearsFromNow);
                if (age >= 40) {
                    income *= 1.25; // 25% boost from promotion
                }
                return income;
            }
            return 0;
        });
        
        passiveIncome = ages.map(age => {
            if (age > 65) {
                const yearsInRetirement = age - 65;
                return 75000 * Math.pow(1.02, yearsInRetirement); // Higher retirement income
            }
            return age >= 40 ? 8000 * Math.pow(1.07, age - 40) : 2000; // Better investments
        });
        
        savingsData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let savings = 39600 * Math.pow(1.065, yearsFromNow);
            if (age >= 40) {
                savings *= 1.6; // Much higher savings after promotion
            }
            return savings;
        });
        
        expensesData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let expenses = 62400 * Math.pow(1.025, yearsFromNow);
            if (age >= 40) {
                expenses *= 1.1; // Slightly higher lifestyle
            }
            return expenses;
        });
        
    } else if (selectedScenario.name === 'Job Loss') {
        // JOB LOSS - Income drops, savings depleted, expenses continue
        activeIncome = ages.map(age => {
            if (age <= 65) {
                const yearsFromNow = age - currentAge;
                let income = 102000 * Math.pow(1.035, yearsFromNow);
                if (age >= 45 && age <= 47) {
                    income *= 0.3; // Unemployment benefits only
                } else if (age > 47 && age <= 50) {
                    income *= 0.7; // Lower paying job initially
                }
                return income;
            }
            return 0;
        });
        
        passiveIncome = ages.map(age => {
            if (age > 65) {
                const yearsInRetirement = age - 65;
                return 45000 * Math.pow(1.02, yearsInRetirement); // Reduced retirement income
            }
            return age >= 45 ? Math.max(1000, 5000 * Math.pow(0.95, age - 45)) : 2000; // Declining investments
        });
        
        savingsData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let savings = 39600 * Math.pow(1.065, yearsFromNow);
            if (age >= 45 && age <= 48) {
                // Savings rapidly depleted during unemployment
                savings *= Math.pow(0.7, age - 44); // 30% depletion each year
            } else if (age > 48) {
                savings *= 0.3; // Severely reduced savings capacity
            }
            return Math.max(5000, savings); // Minimum emergency fund
        });
        
        expensesData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let expenses = 62400 * Math.pow(1.025, yearsFromNow);
            if (age >= 45 && age <= 47) {
                expenses *= 0.8; // Cut expenses during unemployment
            }
            return expenses;
        });
        
    } else if (selectedScenario.name === 'Medical Emergency') {
        // MEDICAL EMERGENCY - Immediate cost, ongoing higher expenses, reduced savings
        activeIncome = ages.map(age => {
            if (age <= 65) {
                const yearsFromNow = age - currentAge;
                let income = 102000 * Math.pow(1.035, yearsFromNow);
                if (age >= 55 && age <= 57) {
                    income *= 0.8; // Reduced work capacity initially
                }
                return income;
            }
            return 0;
        });
        
        passiveIncome = ages.map(age => {
            if (age > 65) {
                const yearsInRetirement = age - 65;
                return 50000 * Math.pow(1.02, yearsInRetirement); // Reduced due to medical costs
            }
            return age >= 55 ? 3000 * Math.pow(1.04, age - 55) : 2000; // Conservative investments
        });
        
        savingsData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let savings = 39600 * Math.pow(1.065, yearsFromNow);
            if (age === 55) {
                savings -= 80000 * 0.3; // Immediate medical cost (30% after insurance)
            }
            if (age >= 55) {
                savings *= 0.6; // Reduced savings capacity due to ongoing medical costs
            }
            return Math.max(10000, savings);
        });
        
        expensesData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let expenses = 62400 * Math.pow(1.025, yearsFromNow);
            if (age >= 55) {
                expenses *= 1.3; // 30% higher ongoing medical expenses
            }
            return expenses;
        });
        
    } else if (selectedScenario.name === 'Economic Downturn') {
        // ECONOMIC DOWNTURN - Salary cuts, market crash, conservative investments
        activeIncome = ages.map(age => {
            if (age <= 65) {
                const yearsFromNow = age - currentAge;
                let income = 102000 * Math.pow(1.035, yearsFromNow);
                if (age >= 50 && age <= 55) {
                    income *= 0.8; // 20% salary cut during recession
                } else if (age > 55 && age <= 60) {
                    income *= 0.9; // Slow recovery
                }
                return income;
            }
            return 0;
        });
        
        passiveIncome = ages.map(age => {
            if (age > 65) {
                const yearsInRetirement = age - 65;
                return 40000 * Math.pow(1.02, yearsInRetirement); // Significantly reduced
            }
            if (age >= 50 && age <= 53) {
                return Math.max(500, 5000 * Math.pow(0.8, age - 49)); // Market crash impact
            }
            return age >= 53 ? 2000 * Math.pow(1.03, age - 53) : 2000; // Slow recovery
        });
        
        savingsData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let savings = 39600 * Math.pow(1.065, yearsFromNow);
            if (age >= 50 && age <= 55) {
                savings *= 0.4; // Severely reduced during recession
            } else if (age > 55) {
                savings *= 0.7; // Conservative approach post-recession
            }
            return savings;
        });
        
        expensesData = ages.map(age => {
            const yearsFromNow = age - currentAge;
            let expenses = 62400 * Math.pow(1.025, yearsFromNow);
            if (age >= 50 && age <= 55) {
                expenses *= 0.85; // Cut expenses during tough times
            }
            return expenses;
        });
    }
    
    // Add datasets with realistic data
    datasets.push({
        label: 'Active Income',
        data: activeIncome,
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 0,
        stack: 'income'
    });
    
    datasets.push({
        label: 'Passive Income',
        data: passiveIncome,
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
        borderWidth: 0,
        stack: 'income'
    });
    
    datasets.push({
        label: 'Savings',
        data: savingsData,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 0,
        stack: 'savings'
    });
    
    datasets.push({
        label: 'Expenses',
        data: expensesData,
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 0,
        stack: 'expenses'
    });

    // Add scenario marker and impact visualization if not Current Path
    if (selectedScenario.name !== 'Current Path' && scenarioAge) {
        // Main event marker
        const markerData = ages.map(age => {
            if (age === scenarioAge) {
                const ageIndex = age - currentAge;
                const totalAtAge = activeIncome[ageIndex] + passiveIncome[ageIndex] + savingsData[ageIndex] + investmentGrowthData[ageIndex];
                return totalAtAge * 0.8; // Position marker at 80% of stack height
            }
            return null;
        });
        
        datasets.push({
            label: `${selectedScenario.name} Event (Age ${scenarioAge})`,
            data: markerData,
            type: 'scatter',
            backgroundColor: selectedScenario.type === 'positive' ? '#10b981' : 
                           selectedScenario.type === 'negative' ? '#f59e0b' : 
                           selectedScenario.type === 'critical' ? '#ef4444' : '#6b7280',
            borderColor: '#ffffff',
            borderWidth: 4,
            pointRadius: 12,
            pointHoverRadius: 15,
            showLine: false,
            stack: 'markers'
        });
        
        // Add before/after comparison line to show trajectory change
        const trajectoryChange = ages.map((age, index) => {
            if (age === scenarioAge - 1 || age === scenarioAge + 1) {
                // Show points just before and after the event
                const totalAtAge = activeIncome[index] + passiveIncome[index] + savingsData[index] + investmentGrowthData[index];
                return totalAtAge * 0.9;
            }
            return null;
        });
        
        datasets.push({
            label: `Trajectory Change`,
            data: trajectoryChange,
            type: 'line',
            backgroundColor: 'transparent',
            borderColor: selectedScenario.type === 'positive' ? '#10b981' : 
                         selectedScenario.type === 'negative' ? '#f59e0b' : 
                         selectedScenario.type === 'critical' ? '#ef4444' : '#6b7280',
            borderWidth: 3,
            borderDash: [10, 5],
            fill: false,
            tension: 0,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: selectedScenario.type === 'positive' ? '#10b981' : 
                                 selectedScenario.type === 'negative' ? '#f59e0b' : 
                                 selectedScenario.type === 'critical' ? '#ef4444' : '#6b7280',
            stack: 'impact'
        });
    }

    const config = {
        type: 'bar',
        data: {
            labels: ages,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: selectedScenario.name === 'Current Path' 
                        ? 'Current Path: Financial Journey by Age'
                        : `${selectedScenario.name} at Age ${scenarioAge}: Impact on Financial Journey`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value, index) {
                            const age = ages[index];
                            // Show every 5 years, key ages, and scenario age
                            if (age % 5 === 0 || age === 65 || age === currentAge || age === scenarioAge) {
                                return age;
                            }
                            return '';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (SGD)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    stacked: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                bar: {
                    borderRadius: 2
                }
            }
        }
    };

    // Destroy existing chart if it exists and has destroy method
    if (window.scenarioTimelineChart && typeof window.scenarioTimelineChart.destroy === 'function') {
        window.scenarioTimelineChart.destroy();
    }

    // Create new chart
    window.scenarioTimelineChart = new Chart(canvas, config);
}

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
