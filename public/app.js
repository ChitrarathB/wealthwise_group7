// Register Chart.js plugins
// Note: The annotation plugin will be auto-registered when loaded via CDN

let sessionId = null;
let mediaRecorder = null;
let recordedChunks = [];
let totalSteps = 13;

// Global variables for transcript synchronization and profile extraction
let conversationTranscript = [];
let currentAudioTime = 0;
let isTranscriptLoaded = false;
let extractionCounter = 0;
let collectedMessagePairs = []; // Store all message pairs for continuous extraction
let accumulatedTranscript = ""; // Store progressive transcript for OpenAI

const el = (id) => document.getElementById(id);

function setTextIfPresent(id, value) {
        const node = document.getElementById(id);
        if (!node) return;
        const tag = node.tagName && node.tagName.toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') {
                node.value = (value === null || value === undefined) ? '' : value;
        } else {
                node.textContent = value;
        }
}

// Helper function to animate profile sections (subtle)
function animateProfileSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Remove old indicators
        const oldIndicators = section.querySelectorAll('.accent-bar, .status-badge');
        oldIndicators.forEach(el => el.remove());
        
        // Remove existing animation
        section.classList.remove('ai-section-animate');
        void section.offsetWidth;
        
        // Set position for absolute positioning
        section.style.position = 'relative';
        
        // Add subtle sliding accent bar at the top
        const accentBar = document.createElement('div');
        accentBar.className = 'accent-bar';
        section.appendChild(accentBar);
        
        // Add subtle border glow animation
        section.classList.add('ai-section-animate');
        
        // Clean up after animation
        setTimeout(() => {
                section.classList.remove('ai-section-animate');
                accentBar.remove();
        }, 1500);
}

// Helper function to animate individual input boxes
function animateInput(inputElement) {
        if (!inputElement) return;
        
        // Remove existing animation
        inputElement.classList.remove('input-animate');
        void inputElement.offsetWidth;
        
        // Add animation class
        inputElement.classList.add('input-animate');
        
        // Clean up after animation
        setTimeout(() => {
                inputElement.classList.remove('input-animate');
        }, 1000);
}

// Helper function to animate voice assistant
function animateVoiceAssistant() {
        const section = document.getElementById('voice_assistant_section');
        if (!section) return;
        
        // Remove old indicators
        const oldIndicators = section.querySelectorAll('.accent-bar, .status-badge');
        oldIndicators.forEach(el => el.remove());
        
        // Remove existing animation
        section.classList.remove('ai-section-animate');
        void section.offsetWidth;
        
        // Set position for absolute positioning
        section.style.position = 'relative';
        
        // Add sliding accent bar at the top
        const accentBar = document.createElement('div');
        accentBar.className = 'accent-bar';
        section.appendChild(accentBar);
        
        // Add border glow animation
        section.classList.add('ai-section-animate');
        
        // Clean up after animation
        setTimeout(() => {
                section.classList.remove('ai-section-animate');
                accentBar.remove();
        }, 1500);
}

// Helper function to update AI Intelligence sections with animation
function updateAISection(sectionId, content) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Update content
        if (typeof content === 'string') {
                section.innerHTML = content;
        } else {
                section.textContent = content;
        }
        
        // Trigger animations
        const parentDiv = section.closest('div[style*="background: white"]');
        if (parentDiv) {
                // Remove existing animation classes
                parentDiv.classList.remove('ai-section-animate');
                section.classList.remove('ai-value-change');
                
                // Remove old indicators
                const oldIndicators = parentDiv.querySelectorAll('.accent-bar, .status-badge');
                oldIndicators.forEach(el => el.remove());
                
                // Force reflow to restart animation
                void parentDiv.offsetWidth;
                
                // Add animation classes
                parentDiv.classList.add('ai-section-animate');
                section.classList.add('ai-value-change');
                
                // Find the header (h3) element within the parent div
                const headerElement = parentDiv.querySelector('h3');
                
                // Set position for absolute positioning
                parentDiv.style.position = 'relative';
                
                // Add sliding accent bar at the top
                const accentBar = document.createElement('div');
                accentBar.className = 'accent-bar';
                parentDiv.appendChild(accentBar);
                
                // Add status badge indicator
                const statusBadge = document.createElement('div');
                statusBadge.className = 'status-badge';
                parentDiv.appendChild(statusBadge);
                
                // Add highlight effect to header
                if (headerElement) {
                        headerElement.classList.add('header-highlight');
                        setTimeout(() => {
                                headerElement.classList.remove('header-highlight');
                        }, 1000);
                }
                
                // Remove animation classes and elements after completion
                setTimeout(() => {
                        parentDiv.classList.remove('ai-section-animate');
                        accentBar.remove();
                        statusBadge.remove();
                }, 1500);
                setTimeout(() => {
                        section.classList.remove('ai-value-change');
                }, 1500);
        }
}

// Demo function to test AI animations and populate profile sections
async function demoAIAnimation() {
        try {
                // Show loading indicator
                showProfileLoadingIndicator();
                
                // Use Sarah's sample transcript for demo
                const sampleTranscript = `ME: Hey Sarah, it's great to see you again. How have you been? Customer: It's a little better now, thankfully. ME: Alright, let's start simple — how old are you? Customer: I'm 29. ME: Are you single or married at the moment? Customer: Single. ME: Any dependents? Customer: No I don't have dependent. ME: What's your current monthly take-home roughly? Customer: About $7,500. ME: And do you usually get a raise or bonus each year? Customer: Usually around 5% increment, plus a small year-end bonus. ME: Any additional income sources? Customer: Yes, actually. I have a small studio apartment that I rent out — it brings in about $900 a month. ME: How much do you spend each month? Customer: Around $4,500, including utilities and a bit of travel. ME: Any ongoing loans? Customer: Just my car loan, about $900 a month. It'll be done when I'm 33. ME: How about savings? Customer: Around $85,000 total. ME: What age would you ideally like to retire? Customer: Probably around 60. ME: And how much monthly income would you like to maintain after retirement? Customer: About $4,000 per month. ME: At what age do you think you might get married? Customer: Hmm… probably around 32. ME: And what about starting a family? Customer: Maybe around 36. ME: We usually test a what-if for early death. What age for the simulation? Customer: Let's say 40.`; 
                //ME: Alright, let's start simple — how old are you? Customer: I'm 29. ME: Are you single or married at the moment? Customer: Single. ME: Any dependents? Customer: No I don't have dependent. ME: What's your current monthly take-home roughly? Customer: About $7,500. ME: And do you usually get a raise or bonus each year? Customer: Usually around 5% increment, plus a small year-end bonus. ME: Any additional income sources? Customer: Yes, actually. I have a small studio apartment that I rent out — it brings in about $900 a month. ME: How much do you spend each month? Customer: Around $4,500, including utilities and a bit of travel. ME: Any ongoing loans? Customer: Just my car loan, about $900 a month. It'll be done when I'm 33. ME: How about savings? Customer: Around $85,000 total. ME: What age would you ideally like to retire? Customer: Probably around 60. ME: And how much monthly income would you like to maintain after retirement? Customer: About $4,000 per month. ME: At what age do you think you might get married? Customer: Hmm… probably around 32. ME: And what about starting a family? Customer: Maybe around 36. ME: We usually test a what-if for early death. What age for the simulation? Customer: Let's say 40.
                
                // Call the backend profile extraction API
                const response = await fetch('/api/extract-detailed-profile', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                                transcript: sampleTranscript
                        })
                });
                
                if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                        // Populate the four frontend sections with extracted profile data
                        populateProfileSections(result.profile);
                        
                        // Show success animation
                        showProfilePopulationAnimation();
                        
                        // Trigger rate prediction after profile is populated
                        setTimeout(() => {
                                console.log('🎭 Demo completed, triggering rate prediction...');
                                updateRatePredictionBox();
                        }, 3000); // Delay to allow all animations to complete
                } else {
                        throw new Error('Profile extraction failed');
                }
                
        } catch (error) {
                console.error('Error in demoAIAnimation:', error);
                showProfileErrorIndicator();
        }
        
        // Continue with original AI animations
        setTimeout(() => {
                runOriginalAIAnimations();
        }, 2000);
}

// Function to populate the four profile sections
function populateProfileSections(profile) {
        console.log('🏗️ Starting populateProfileSections with profile:', profile);
        
        // 1. Personal Information Section
        const personalDetails = profile['Personal Details'] || {};
        console.log('👤 Personal Details:', personalDetails);
        populateFieldWithAnimation('input_name', personalDetails.Name || '');
        populateFieldWithAnimation('input_age', personalDetails.Age || '');
        populateFieldWithAnimation('input_marital_status', personalDetails['Marital Status'] || '');
        populateFieldWithAnimation('input_gender', personalDetails.Gender || '');
        populateFieldWithAnimation('input_dependents_count', profile.Dependents?.length || 0);
        
        // 2. Financial Summary Section
        const financial = profile['Financial Details'] || {};
        populateFieldWithAnimation('input_active_income', financial.Income?.[0] || '');
        populateFieldWithAnimation('input_active_income_growth', financial.Income_Growth_Rate_PA || '');
        populateFieldWithAnimation('input_passive_income', financial.Passive_Incomes?.[0] || '');
        populateFieldWithAnimation('input_current_bank_saving', financial.Bank_Balance_Now || '');
        populateFieldWithAnimation('input_monthly_bank_saving', financial.Monthly_Savings || '');
        populateFieldWithAnimation('input_monthly_expense', financial.Expense?.[0] || '');
        populateFieldWithAnimation('input_loans_monthly_emi', financial.Loans?.[0] || '');
        
        // Use loan end age from backend API if available, don't auto-calculate
        populateFieldWithAnimation('input_loans_end_age', financial.Loans_End_Age || '');
        
        // 3. Life Events Section - Populate with scenario data
        populateLifeEvents(profile['Scenario Inputs'] || {});
        
        // 4. Scenario Inputs Section
        const scenarios = profile['Scenario Inputs'] || {};
        const retirement = profile['Retirement Goals'] || {};
        
        // Set retirement scenario as active (prioritized) and populate
        const retirementRadio = document.querySelector('input[name="scenario_type"][value="Retirement"]');
        const currentlySelectedRadio = document.querySelector('input[name="scenario_type"]:checked');
        
        // Only change radio button selection if no death scenario is being set and retirement is not already selected
        const needsRetirementRadioChange = !scenarios.Death_Age_Scenario && 
                                         (!currentlySelectedRadio || currentlySelectedRadio.value !== 'Retirement');
        
        if (retirementRadio && needsRetirementRadioChange) {
                console.log('✅ Auto-selecting Retirement scenario radio button (no death scenario and not previously selected)');
                retirementRadio.checked = true;
                toggleScenarioFields('Retirement');
                
                // If expense data is available, trigger chart update for retirement scenario
                const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                if (monthlyExpense > 0 && retirement.Retirement_Age) {
                        console.log('📊 Retirement scenario from conversation, updating charts...');
                        setTimeout(() => {
                                switchTab('analysis');
                                setTimeout(() => renderAnalysis(), 200);
                        }, 1000);
                }
        } else {
                console.log('⏭️ Retirement scenario radio button auto-selection skipped (death scenario present or already selected)');
        }
        
        // Populate retirement scenario fields
        populateFieldWithAnimation('input_scenario_retirement_age', retirement.Retirement_Age || '');
        populateFieldWithAnimation('input_scenario_life_expectancy', retirement.Life_Expectancy || '');
        populateFieldWithAnimation('input_scenario_monthly_retirement_expenses', retirement.Retirement_Monthly_Need || '');
        
        // Also populate death scenario data and auto-select Death radio button if death age is provided
        populateFieldWithAnimation('input_death_age', scenarios.Death_Age_Scenario || '');
        
        // Auto-select Death scenario radio button if death age is provided from conversation
        if (scenarios.Death_Age_Scenario) {
                console.log('💀 Death age provided from conversation, checking if radio button selection needed');
                const deathRadio = document.querySelector('input[name="scenario_type"][value="Death"]');
                const currentlySelectedRadio = document.querySelector('input[name="scenario_type"]:checked');
                
                // Only change radio button selection if it's not already set to Death
                const needsRadioChange = !currentlySelectedRadio || currentlySelectedRadio.value !== 'Death';
                
                if (deathRadio && needsRadioChange) {
                        console.log('✅ Auto-selecting Death scenario radio button (was not previously selected)');
                        deathRadio.checked = true;
                        // Trigger the scenario type change to show/hide appropriate fields
                        const changeEvent = new Event('change', { bubbles: true });
                        deathRadio.dispatchEvent(changeEvent);
                        console.log('💀 Death scenario radio button automatically selected');
                        
                        // If expense data is available, trigger chart update for death scenario
                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                        if (monthlyExpense > 0) {
                                console.log('📊 Death scenario from conversation, updating charts...');
                                setTimeout(() => {
                                        switchTab('analysis');
                                        setTimeout(() => renderAnalysis(), 200);
                                }, 1000);
                        }
                } else if (deathRadio) {
                        console.log('⏭️ Death scenario radio button already selected, skipping auto-selection');
                }
        }
}

// Helper function to populate a field with red animation - only if new value has data
function populateFieldWithAnimation(fieldId, value) {
        console.log(`🔧 Checking field ${fieldId} with new value:`, value);
        const field = document.getElementById(fieldId);
        console.log(`🔍 Found field element:`, !!field);
        
        if (!field) {
                console.warn(`❌ Field ${fieldId} not found in DOM`);
                return;
        }
        
        // Get current value and normalize for comparison
        const currentValue = field.value;
        const normalizedCurrentValue = String(currentValue || '').trim();
        const normalizedNewValue = String(value || '').trim();
        
        console.log(`📋 Current value in ${fieldId}:`, currentValue);
        console.log(`🔍 Normalized comparison: "${normalizedCurrentValue}" vs "${normalizedNewValue}"`);
        
        // Check if the value has actually changed
        const valueHasChanged = normalizedCurrentValue !== normalizedNewValue;
        const hasNewData = value !== null && value !== undefined && value !== '' && value !== 0;
        const hasCurrentData = currentValue !== null && currentValue !== undefined && currentValue !== '' && currentValue !== '0';
        
        if (hasNewData) {
                if (valueHasChanged) {
                        console.log(`✅ Updating ${fieldId}: "${currentValue}" → "${value}" (value changed, animating)`);
                        // Set the value
                        field.value = value;
                        
                        // Trigger change event for automatic population (needed for clustering API)
                        const changeEvent = new Event('change', { bubbles: true });
                        field.dispatchEvent(changeEvent);
                        
                        // Special handling for monthly expense field - ensure LSTM rate prediction is triggered
                        if (fieldId === 'input_monthly_expense' && value) {
                                console.log('💰 Monthly expense updated from conversation, triggering rate prediction...');
                                expenseDataExplicitlySet = true; // Mark as explicitly set
                                setTimeout(() => {
                                        updateRatePredictionBox();
                                        
                                        // Switch to analysis tab and render charts
                                        console.log('📊 Switching to analysis tab to show charts from conversation');
                                        switchTab('analysis');
                                        
                                        // Small delay to ensure tab switch is complete
                                        setTimeout(() => {
                                                renderAnalysis(); // Directly render analysis with user data
                                        }, 200);
                                }, 800); // Slightly longer delay to allow change event and animation to complete
                        }
                        
                        // Special handling for death age field - trigger chart updates if other data is available
                        if (fieldId === 'input_death_age' && value) {
                                console.log('💀 Death age updated from conversation, checking for chart update...');
                                setTimeout(() => {
                                        // Check if we have enough data to render charts
                                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                        if (monthlyExpense > 0) {
                                                console.log('📊 Death age from conversation with expense data, updating charts...');
                                                switchTab('analysis');
                                                setTimeout(() => renderAnalysis(), 200);
                                        }
                                }, 500);
                        }
                        
                        // Special handling for bank savings field - trigger chart refresh if analysis is already shown
                        if (fieldId === 'input_current_bank_saving' && value) {
                                console.log('🏦 Bank savings updated from conversation, checking for chart refresh...');
                                console.log('🏦 Bank savings new value:', value);
                                setTimeout(() => {
                                        // Check if we have enough data to render charts
                                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                        console.log('🏦 Monthly expense value for chart check:', monthlyExpense);
                                        
                                        if (monthlyExpense > 0) {
                                                console.log('💹 Bank savings from conversation with expense data, switching to analysis and refreshing charts...');
                                                // Switch to analysis tab and refresh charts
                                                switchTab('analysis');
                                                setTimeout(() => {
                                                        console.log('💹 About to call renderAnalysis() for bank savings refresh');
                                                        renderAnalysis(); // Refresh charts with new bank balance
                                                }, 200);
                                        } else {
                                                console.log('⏭️ Bank savings updated but no expense data available for chart refresh');
                                        }
                                }, 300);
                        }
                        
                        // Add red animation only when value actually changes
                        field.style.transition = 'all 0.3s ease';
                        field.style.boxShadow = '0 0 8px rgba(220, 38, 38, 0.4)';
                        field.style.borderColor = 'rgba(220, 38, 38, 0.6)';
                        
                        // Remove animation after 1 second
                        setTimeout(() => {
                                field.style.boxShadow = '';
                                field.style.borderColor = '';
                        }, 1000);
                } else {
                        console.log(`🔄 No change in ${fieldId}: "${currentValue}" (same value, no animation)`);
                        // Value hasn't changed, just update silently without animation
                        field.value = value;
                        
                        // Still trigger change event for clustering API if this is retirement age field
                        if (fieldId === 'input_scenario_retirement_age' && value) {
                                console.log(`🎯 Triggering change event for retirement age (same value but ensuring clustering)`);
                                const changeEvent = new Event('change', { bubbles: true });
                                field.dispatchEvent(changeEvent);
                        }
                }
        } else if (hasCurrentData) {
                console.log(`�️ Preserving ${fieldId}: keeping "${currentValue}" (no new data, preserving existing)`);
                // Keep existing value, don't overwrite with empty data
        } else {
                console.log(`📝 Setting ${fieldId} = ${value} (no existing data, setting new value even if empty)`);
                // Neither current nor new has data, set the new value anyway
                field.value = value;
        }
}

// Function to populate life events dynamically
function populateLifeEvents(scenarios) {
        const container = document.getElementById('life_events_container');
        if (!container) return;
        
        console.log('🔍 populateLifeEvents called with scenarios:', scenarios);
        
        // Get current life events data
        const currentEvents = [];
        document.querySelectorAll('.life_event_type').forEach(select => {
                const eventId = select.dataset.eventId;
                const ageInput = document.querySelector(`.life_event_age[data-event-id="${eventId}"]`);
                if (select.value && ageInput && ageInput.value) {
                        currentEvents.push({
                                type: select.value,
                                age: parseInt(ageInput.value)
                        });
                }
        });
        
        // Create new events data from scenarios
        const newEvents = [];
        if (scenarios.Marriage_Age_Scenario) {
                newEvents.push({
                        type: 'Marriage',
                        age: parseInt(scenarios.Marriage_Age_Scenario)
                });
        }
        if (scenarios.Child_Birth_Age_Scenario) {
                newEvents.push({
                        type: 'Child Birth',
                        age: parseInt(scenarios.Child_Birth_Age_Scenario)
                });
        }
        
        // Compare current and new events
        const eventsChanged = JSON.stringify(currentEvents.sort((a, b) => a.age - b.age)) !== 
                             JSON.stringify(newEvents.sort((a, b) => a.age - b.age));
        
        console.log('🔍 Current life events:', currentEvents);
        console.log('🔍 New life events:', newEvents);
        console.log('🔍 Life events changed:', eventsChanged);
        
        if (!eventsChanged) {
                console.log('⏭️ Life events unchanged from conversation, skipping recreation');
                return;
        }
        
        console.log('✅ Life events changed from conversation, updating');
        
        // Clear existing events and recreate
        container.innerHTML = '';
        
        // Add marriage event if scenario exists
        if (scenarios.Marriage_Age_Scenario) {
                // Use the same addLifeEvent function to create proper form inputs
                addLifeEvent('Marriage', scenarios.Marriage_Age_Scenario);
                
                // Trigger prediction for Marriage when populated from conversation
                setTimeout(() => {
                        invokeMarriagePredictExpense();
                        
                        // If expense data is available, update charts
                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                        if (monthlyExpense > 0) {
                                console.log('📊 Marriage event from conversation, updating charts...');
                                setTimeout(() => {
                                        switchTab('analysis');
                                        setTimeout(() => renderAnalysis(), 200);
                                }, 1000);
                        }
                }, 500);
        }
        
        // Add child birth event if scenario exists
        if (scenarios.Child_Birth_Age_Scenario) {
                // Use the same addLifeEvent function to create proper form inputs
                addLifeEvent('Child Birth', scenarios.Child_Birth_Age_Scenario);
                
                // Trigger prediction for Child Birth when populated from conversation
                setTimeout(() => {
                        invokeChildBirthPredictExpense();
                        
                        // If expense data is available, update charts
                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                        if (monthlyExpense > 0) {
                                console.log('📊 Child Birth event from conversation, updating charts...');
                                setTimeout(() => {
                                        switchTab('analysis');
                                        setTimeout(() => renderAnalysis(), 200);
                                }, 1000);
                        }
                }, 800); // Slightly delayed to avoid overlap
        }
}

// Helper function to create life event elements
function createLifeEventElement(eventType, age) {
        const eventDiv = document.createElement('div');
        eventDiv.style.cssText = 'background: #f1f5f9; padding: 4px 6px; border-radius: 3px; border-left: 3px solid #dc2626; margin-bottom: 3px; cursor: pointer; transition: all 0.2s ease;';
        
        // Add hover effect
        eventDiv.addEventListener('mouseenter', () => {
                eventDiv.style.backgroundColor = '#e2e8f0';
                eventDiv.style.transform = 'translateX(2px)';
        });
        eventDiv.addEventListener('mouseleave', () => {
                eventDiv.style.backgroundColor = '#f1f5f9';
                eventDiv.style.transform = 'translateX(0)';
        });
        
        // Add click handler to trigger prediction
        eventDiv.addEventListener('click', () => {
                if (eventType === 'Marriage') {
                        invokeMarriagePredictExpense();
                } else if (eventType === 'Child Birth') {
                        invokeChildBirthPredictExpense();
                }
        });
        
        eventDiv.innerHTML = `
                <div style="font-size: 7px; font-weight: 600; color: #1e293b;">${eventType}</div>
                <div style="font-size: 6px; color: #64748b;">Age ${age} • Click to predict</div>
        `;
        return eventDiv;
}

// Function to show loading indicator
function showProfileLoadingIndicator() {
        const sections = ['profile_section', 'financial_summary_section', 'life_event_section', 'scenario_inputs_section'];
        sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                        // Removed opacity fade and scale effects
                        section.style.transition = 'all 0.3s ease';
                }
        });
}

// Function to show population animation
function showProfilePopulationAnimation() {
        const sections = ['profile_section', 'financial_summary_section', 'life_event_section', 'scenario_inputs_section'];
        sections.forEach((sectionId, index) => {
                setTimeout(() => {
                        const section = document.getElementById(sectionId);
                        if (section) {
                                section.style.opacity = '1';
                                section.style.transform = 'scale(1)';
                                section.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.15)';
                                
                                // Remove glow after animation
                                setTimeout(() => {
                                        section.style.boxShadow = '';
                                }, 1000);
                        }
                }, index * 200);
        });
}

// Function to show error indicator
function showProfileErrorIndicator() {
        console.error('Failed to populate profile sections');
        // Could add visual error feedback here
}

// Function to collect current profile data and format for clustering API
function formatProfileForClustering() {
    const getFieldValue = (id) => {
        const field = document.getElementById(id);
        return field ? field.value : '';
    };
    
    const name = getFieldValue('input_name') || 'Customer';
    const age = parseInt(getFieldValue('input_age')) || 29;
    const maritalStatus = getFieldValue('input_marital_status') || 'Single';
    const gender = getFieldValue('input_gender') || 'Female';
    const dependentsCount = parseInt(getFieldValue('input_dependents_count')) || 0;
    
    const activeIncome = parseFloat(getFieldValue('input_active_income')) || 0;
    const passiveIncome = parseFloat(getFieldValue('input_passive_income')) || 0;
    const currentSavings = parseFloat(getFieldValue('input_current_bank_saving')) || 0;
    const monthlyExpenses = parseFloat(getFieldValue('input_monthly_expense')) || 0;
    const monthlyEMI = parseFloat(getFieldValue('input_loans_monthly_emi')) || 0;
    
    // Calculate derived values
    const activeIncomeAnnual = activeIncome * 12;
    const passiveIncomeAnnual = passiveIncome * 12;
    const totalAnnualIncome = activeIncomeAnnual + passiveIncomeAnnual;
    const totalAnnualExpense = monthlyExpenses * 12;
    const annualEMI = monthlyEMI * 12;
    const netCashflow = totalAnnualIncome - totalAnnualExpense - annualEMI;
    
    // Estimate property value from passive income (assuming 6% return)
    const estimatedPropertyValue = passiveIncome > 0 ? (passiveIncome * 12) / 0.06 : 0;
    
    // Calculate total net worth
    const totalNetworth = currentSavings + estimatedPropertyValue - (monthlyEMI * 12 * 3); // Assuming 3 years left on loan
    
    const clusteringData = {
        "Customer_ID": name.replace(/\s+/g, '_').toUpperCase() + '_001',
        "Personal Details": {
            "Age": age,
            "Gender": gender,
            "Marital Status": maritalStatus,
            "DOB": `${2025 - age}-01-01`,
            "Education": null
        },
        "Dependents": Array.from({length: dependentsCount}, () => ({"Relationship": "Child"})),
        "Financial Details": {
            "Assets": [
                ...(estimatedPropertyValue > 0 ? [{
                    "Asset Type": "Rental Property",
                    "Current Value": Math.round(estimatedPropertyValue),
                    "Return on Investment": 0.06
                }] : []),
                ...(currentSavings > 0 ? [{
                    "Asset Type": "Bank Savings",
                    "Current Value": Math.round(currentSavings),
                    "Return on Investment": 0.025
                }] : [])
            ],
            "Liabilities": [
                ...(monthlyEMI > 0 ? [{
                    "Liability Type": "Loan",
                    "Current Value": Math.round(monthlyEMI * 12 * 3) // Assuming 3 years left
                }] : [])
            ],
            "Income": [
                ...(activeIncome > 0 ? [{
                    "Income_Type": "Active",
                    "Amount": Math.round(activeIncome),
                    "Frequency": "Monthly"
                }] : [])
            ],
            "Passive_Incomes": passiveIncome > 0 ? [Math.round(passiveIncome)] : [],
            "Expense": [
                ...(monthlyExpenses > 0 ? [{
                    "Expense_Type": "Personal",
                    "Amount": Math.round(monthlyExpenses),
                    "Frequency": "Monthly"
                }] : [])
            ],
            "Derived": {
                "Active_Income_Annual": Math.round(activeIncomeAnnual),
                "Total_Annual_Income": Math.round(totalAnnualIncome),
                "Total_Annual_Expense": Math.round(totalAnnualExpense),
                "Annual_Passive_Income": Math.round(passiveIncomeAnnual),
                "Annual_EMI": Math.round(annualEMI),
                "Net_Cashflow": Math.round(netCashflow),
                "Total_Networth": Math.round(totalNetworth)
            }
        },
        "Retirement Goals": {
            "Retirement_Age": parseInt(getFieldValue('input_scenario_retirement_age')) || null,
            "Retirement_Monthly_Need": parseFloat(getFieldValue('input_scenario_monthly_retirement_expenses')) || null,
            "Life_Expectancy": parseInt(getFieldValue('input_scenario_life_expectancy')) || 85
        },
        "Scenario Inputs": {
            "Marriage_Age_Scenario": extractLifeEventAge('Marriage') || null,
            "Child_Birth_Age_Scenario": extractLifeEventAge('Child Birth') || null,
            "Death_Age_Scenario": parseInt(getFieldValue('input_death_age')) || null
        }
    };
    
    console.log('📊 Formatted profile for clustering:', clusteringData);
    return clusteringData;
}

// Helper function to extract life event age from existing life events
function extractLifeEventAge(eventType) {
    const lifeEvents = document.querySelectorAll('.life-event');
    for (const event of lifeEvents) {
        const typeSelect = event.querySelector('.life_event_type');
        const ageInput = event.querySelector('.life_event_age');
        
        if (typeSelect && ageInput && typeSelect.value === eventType && ageInput.value) {
            return parseInt(ageInput.value);
        }
    }
    return null;
}

// Function to call clustering API
async function callClusteringAPI(profileData) {
    try {
        console.log('🔄 Calling clustering API with profile data...');
        
        const response = await fetch('http://localhost:9000/api/cluster-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Clustering API response:', result);
        
        if (result.success && result.cluster_result) {
            // Display clustering result in UI
            displayClusteringResult(result.cluster_result);
        } else {
            console.warn('⚠️ Clustering API returned no results');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error calling clustering API:', error);
        
    }
}

// Function to display clustering results in the UI
// Variable to track the previous category for change detection
let previousCategory = null;

function displayClusteringResult(clusterResult) {
    console.log('🎯 Displaying cluster result:', clusterResult);
    
    // Check if category has actually changed
    const currentCategory = clusterResult.Archetype;
    const categoryChanged = previousCategory !== currentCategory;
    
    console.log(`📋 Category comparison: "${previousCategory}" → "${currentCategory}" (Changed: ${categoryChanged})`);
    
    // Update the customer category section with clustering result
    const categorySection = document.getElementById('customer_category');
    if (categorySection) {
        const confidencePercent = Math.round(clusterResult.Confidence * 100);
        
        // Streamlined red-themed design for the category result
        categorySection.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #fef7f7, #fef2f2);
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                border: 1px solid #fecaca;
                box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
                transition: all 0.3s ease;
            ">
                <div style="
                    font-weight: 700;
                    color: #b91c1c;
                    margin-bottom: 6px;
                    font-size: 11px;
                    letter-spacing: 0.2px;
                ">${clusterResult.Archetype}</div>
                
                <div style="
                    font-size: 8px;
                    color: #dc2626;
                    margin-bottom: 4px;
                    font-weight: 500;
                ">Segment ${clusterResult.Segment_ID} • Confidence: ${confidencePercent}%</div>
                
                <div class="ai-classified-badge" style="
                    background: linear-gradient(90deg, #dc2626, #ef4444);
                    color: white;
                    font-size: 6px;
                    padding: 3px 8px;
                    border-radius: 10px;
                    display: inline-block;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                    box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3);
                    opacity: ${categoryChanged ? '0' : '1'};
                    transform: ${categoryChanged ? 'scale(0.8)' : 'scale(1)'};
                    transition: all 0.3s ease;
                    animation: ${categoryChanged ? 'aiPulse 2s ease-in-out infinite' : 'none'};
                ">AI Classified</div>
            </div>
            
            <style>
                @keyframes aiPulse {
                    0%, 100% { 
                        box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3), 0 0 0 0 rgba(220, 38, 38, 0.4);
                    }
                    50% { 
                        box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3), 0 0 0 4px rgba(220, 38, 38, 0.1);
                    }
                }
                
                .ai-classified-badge {
                    position: relative;
                    overflow: hidden;
                }
                
                .ai-classified-badge::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s ease;
                }
                
                .ai-classified-badge.show::before {
                    left: 100%;
                }
            </style>
        `;
        
        // Only animate if the category has changed
        if (categoryChanged) {
            console.log('🎬 Category changed - triggering animations');
            
            // Red-themed animation sequence for category change
            categorySection.style.opacity = '0';
            categorySection.style.transform = 'translateY(10px) scale(0.95)';
            categorySection.style.boxShadow = '0 0 0 rgba(220, 38, 38, 0)';
            
            // Phase 1: Fade in with red glow
            setTimeout(() => {
                categorySection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                categorySection.style.opacity = '1';
                categorySection.style.transform = 'translateY(0) scale(1)';
                categorySection.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(239, 68, 68, 0.2)';
            }, 100);
            
            // Phase 2: Pulse effect with red highlight
            setTimeout(() => {
                categorySection.style.transition = 'all 0.3s ease';
                categorySection.style.transform = 'scale(1.02)';
                categorySection.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.4), 0 6px 15px rgba(239, 68, 68, 0.25)';
            }, 600);
            
            // Phase 3: Animate AI badge appearance
            setTimeout(() => {
                const aiBadge = categorySection.querySelector('.ai-classified-badge');
                if (aiBadge) {
                    aiBadge.style.opacity = '1';
                    aiBadge.style.transform = 'scale(1)';
                    // Trigger shimmer effect
                    aiBadge.classList.add('show');
                }
                
                // Load and display product recommendations only when category changes
                loadProductRecommendations(clusterResult.Archetype);
            }, 800);
            
            // Phase 4: Settle to normal with subtle red glow
            setTimeout(() => {
                categorySection.style.transition = 'all 0.4s ease';
                categorySection.style.transform = 'scale(1)';
                categorySection.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.2), 0 3px 8px rgba(239, 68, 68, 0.15)';
            }, 900);
            
            // Phase 5: Final state with minimal red accent
            setTimeout(() => {
                categorySection.style.transition = 'all 0.5s ease';
                categorySection.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.1), 0 0 8px rgba(220, 38, 38, 0.1)';
            }, 1300);
        } else {
            console.log('🔄 Category unchanged - no animation');
            
            // Just ensure the display is properly visible without animation
            categorySection.style.opacity = '1';
            categorySection.style.transform = 'scale(1)';
            categorySection.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.1), 0 0 8px rgba(220, 38, 38, 0.1)';
            
            // AI badge should be visible immediately
            const aiBadge = categorySection.querySelector('.ai-classified-badge');
            if (aiBadge) {
                aiBadge.style.opacity = '1';
                aiBadge.style.transform = 'scale(1)';
            }
        }
        
        // Update the previous category for next comparison
        previousCategory = currentCategory;
    }
}

// Helper function to get colors based on segment ID
function getSegmentColor(segmentId) {
    const colorMap = {
        0: { light: '#fef2f2', medium: '#fee2e2', dark: '#dc2626', darker: '#991b1b' }, // Red - High Debt
        1: { light: '#f0fdf4', medium: '#dcfce7', dark: '#16a34a', darker: '#15803d' }, // Green - Affluent
        2: { light: '#eff6ff', medium: '#dbeafe', dark: '#2563eb', darker: '#1d4ed8' }, // Blue - Career Starter
        3: { light: '#fefce8', medium: '#fef3c7', dark: '#d97706', darker: '#92400e' }, // Orange - Mid-Career
        4: { light: '#f3e8ff', medium: '#e9d5ff', dark: '#9333ea', darker: '#7c3aed' }, // Purple - Legacy Planner
        5: { light: '#fdf2f8', medium: '#fce7f3', dark: '#ec4899', darker: '#be185d' }, // Pink - Young Family
        6: { light: '#f0fdfa', medium: '#ccfbf1', dark: '#059669', darker: '#047857' }, // Teal - Investment Earner
        7: { light: '#faf5ff', medium: '#f3e8ff', dark: '#7c3aed', darker: '#6b21a8' }  // Indigo - Pre-Retirement
    };
    return colorMap[segmentId] || colorMap[2]; // Default to Career Starter colors
}

// Helper function to toggle scenario fields (if not already implemented)
function toggleScenarioFields(scenarioType) {
        const deathFields = document.getElementById('death_scenario_fields');
        const retirementFields = document.getElementById('retirement_scenario_fields');
        
        if (scenarioType === 'Death') {
                if (deathFields) deathFields.style.display = 'flex';
                if (retirementFields) retirementFields.style.display = 'none';
        } else if (scenarioType === 'Retirement') {
                if (deathFields) deathFields.style.display = 'none';
                if (retirementFields) retirementFields.style.display = 'flex';
        }
}

// Original AI animations moved to separate function
function runOriginalAIAnimations() {
        // Customer Category - Red theme
        updateAISection('customer_category', `
                <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 10px; border-radius: 4px; text-align: center; border: 1px solid #fecaca;">
                        <div style="font-weight: 700; color: #991b1b; margin-bottom: 4px; font-size: 10px;">High-Growth Professional</div>
                        <div style="font-size: 8px; color: #b91c1c;">Strong income, building wealth rapidly</div>
                        <div style="background: #dc2626; color: white; font-size: 7px; padding: 2px 6px; border-radius: 10px; margin-top: 4px; display: inline-block; font-weight: 600;">PREMIUM TIER</div>
                </div>
        `);
        
        // Prediction (after delay) - Red theme
        setTimeout(() => {
                updateAISection('prediction', `
                        <div style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #fecaca;">
                                <div style="margin-bottom: 6px;">
                                        <div style="font-size: 8px; color: #64748b; margin-bottom: 2px;">Retirement Readiness</div>
                                        <div style="background: #fee2e2; height: 6px; border-radius: 3px; overflow: hidden;">
                                                <div style="background: linear-gradient(90deg, #dc2626, #ef4444); height: 100%; width: 78%; transition: width 0.5s ease;"></div>
                                        </div>
                                </div>
                                <div style="font-size: 8px; color: #dc2626; font-weight: 600;">78% Ready - On Track</div>
                                <div style="font-size: 7px; color: #64748b; margin-top: 4px;">Projected to meet retirement goals by age 65</div>
                        </div>
                `);
        }, 800);
        
        // Product Recommendation (after another delay) - now in left sidebar
        setTimeout(() => {
                const section = document.getElementById('product_recommendation_section');
                if (section) {
                        // Remove old indicators
                        const oldIndicators = section.querySelectorAll('.accent-bar, .status-badge');
                        oldIndicators.forEach(el => el.remove());
                        
                        // Set position for absolute positioning
                        section.style.position = 'relative';
                        
                        // Add sliding accent bar at the top
                        const accentBar = document.createElement('div');
                        accentBar.className = 'accent-bar';
                        section.appendChild(accentBar);
                        
                        // Add border glow animation
                        section.classList.add('ai-section-animate');
                        
                        // Update content - Red theme
                        const content = document.getElementById('product_recommendation');
                        if (content) {
                                content.innerHTML = `
                                        <div style="background: white; padding: 10px; border-radius: 4px; border: 2px solid #fecaca;">
                                                <div style="font-size: 9px; font-weight: 700; color: #991b1b; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                                                        <span style="background: #dc2626; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">💼</span>
                                                        Recommended Products
                                                </div>
                                                <div style="background: #fef2f2; padding: 6px 8px; border-radius: 3px; border-left: 3px solid #dc2626; margin-bottom: 4px;">
                                                        <div style="font-size: 8px; color: #7f1d1d; font-weight: 600;">High-Growth Investment Fund</div>
                                                        <div style="font-size: 7px; color: #991b1b;">Target: 8-12% annual returns</div>
                                                </div>
                                                <div style="background: #fef2f2; padding: 6px 8px; border-radius: 3px; border-left: 3px solid #ef4444; margin-bottom: 4px;">
                                                        <div style="font-size: 8px; color: #7f1d1d; font-weight: 600;">Critical Illness Coverage</div>
                                                        <div style="font-size: 7px; color: #991b1b;">Coverage: Up to $500K</div>
                                                </div>
                                                <div style="background: #fef2f2; padding: 6px 8px; border-radius: 3px; border-left: 3px solid #f87171;">
                                                        <div style="font-size: 8px; color: #7f1d1d; font-weight: 600;">Retirement Income Plan</div>
                                                        <div style="font-size: 7px; color: #991b1b;">Guaranteed monthly payouts</div>
                                                </div>
                                                <div style="font-size: 7px; color: #b91c1c; text-align: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #fee2e2;">✓ Based on your profile and goals</div>
                                        </div>
                                `;
                        }
                        
                        // Clean up after animation
                        setTimeout(() => {
                                section.classList.remove('ai-section-animate');
                                accentBar.remove();
                        }, 1500);
                }
        }, 1600);
}

function appendMessage(role, text) {
        const wrap = document.createElement('div');
        wrap.className = `msg ${role}`;
        
        // Add speaker label
        const label = document.createElement('div');
        label.className = 'speaker-label';
        label.textContent = role === 'user' ? 'You' : 'Customer';
        label.style.fontSize = '7px';
        label.style.color = '#64748b';
        label.style.marginBottom = '2px';
        label.style.fontWeight = '600';
        label.style.textTransform = 'uppercase';
        label.style.letterSpacing = '0.5px';
        wrap.appendChild(label);
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        bubble.style.fontSize = '9px';
        bubble.style.lineHeight = '1.4';
        bubble.style.padding = '6px 8px';
        wrap.appendChild(bubble);
        
        el('messages').appendChild(wrap);
        
        // Auto-scroll to bottom - use the correct scrollable container
        const messagesEl = el('messages');
        const scrollableContainer = messagesEl.parentElement;
        if (scrollableContainer && scrollableContainer.style.overflowY === 'auto') {
            scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
        } else {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        
        // Animate voice assistant when new message appears
        if (role === 'assistant') {
                animateVoiceAssistant();
        }
}

/* ------------------ Public categorizer helper ------------------ */
function buildPublicCategorizerPayload() {
        const get = (id) => document.getElementById(id)?.value;
        const nameInput = get('input_name') || '';
        const customerId = nameInput ? String(nameInput).replace(/\s+/g, '_').toUpperCase() : 'PUBLIC_001';
        const age = Number(get('input_age') || 0);
        const marital = get('input_marital_status') || 'Married';
        const gender = get('input_gender') || 'Male';
        const activeIncome = Number(get('input_active_income') || 0);
        const propValue = Number(get('input_property_value') || 0);
        const propRoi = parseFloat(get('input_property_roi') || 0);
        const mortgage = Number(get('input_mortgage_value') || 0);
        const totalNetworth = Number(get('input_total_networth') || 0);
        const netCashflow = Number(get('input_net_cashflow') || 0);
        const dependentsCount = Number(get('input_dependents_count') || 0);

        const payload = [{
                Customer_ID: customerId,
                'Personal Details': {
                        Age: age,
                        'Marital Status': marital,
                        Gender: gender
                },
                'Financial Details': {
                        Income: [{ Income_Type: 'Active', Amount: activeIncome }],
                        Assets: [{ 'Asset Type': 'Residential Property', 'Current Value': propValue, 'Return on Investment': propRoi }],
                        Liabilities: [{ 'Liability Type': 'Mortgage', 'Current Value': mortgage }],
                        Derived: { Total_Networth: totalNetworth, Net_Cashflow: netCashflow }
                },
                Dependents: Array.from({ length: Math.max(0, dependentsCount) }).map(() => ({ Relationship: 'Child' }))
        }];

        return payload;
}

async function publicSendToCategorizer() {
        const btn = document.getElementById('public_send_to_categorizer');
        const result = document.getElementById('public_categorizer_result');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        result.style.display = 'none';
        result.innerHTML = '';
        try {
                const payload = buildPublicCategorizerPayload();
                const resp = await fetch('http://localhost:9000/api/categorize', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                if (!resp.ok) throw new Error('Server ' + resp.status);
                const data = await resp.json();
                result.style.display = 'block';
                result.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        } catch (err) {
                result.style.display = 'block';
                result.innerHTML = '<strong>Error:</strong> ' + String(err);
        } finally {
                btn.disabled = false;
                btn.textContent = 'Send to Categorizer';
        }
}

function publicFillDemo() {
        // Fill fields with reasonable demo values
        document.getElementById('input_name').value = 'Sarah Chen';
        document.getElementById('input_age').value = 35;
        document.getElementById('input_marital_status').value = 'Married';
        document.getElementById('input_gender').value = 'Male';
        document.getElementById('input_active_income').value = 5000;
        document.getElementById('input_property_value').value = 300000;
        document.getElementById('input_property_roi').value = 0.05;
        document.getElementById('input_mortgage_value').value = 200000;
        document.getElementById('input_total_networth').value = 1500000;
        document.getElementById('input_net_cashflow').value = 2000;
        document.getElementById('input_dependents_count').value = 1;
}

// Global life event counter and functions (moved outside DOMContentLoaded for accessibility)
let lifeEventCounter = 0;

// Global addLifeEvent function - accessible from populateLifeEvents
function addLifeEvent(type = '', age = '') {
        const lifeEventsContainer = document.getElementById('life_events_container');
        if (!lifeEventsContainer) return;
        
        lifeEventCounter++;
        const eventId = `life_event_${lifeEventCounter}`;
        
        const eventDiv = document.createElement('div');
        eventDiv.id = eventId;
        eventDiv.className = 'life-event'; // Add class for easy selection
        eventDiv.style.cssText = 'display: flex; gap: 4px; align-items: center; background: #f8fafc; padding: 4px; border-radius: 3px; border: 1px solid #e2e8f0;';
        
        eventDiv.innerHTML = `
                <select class="life_event_type" data-event-id="${eventId}" style="flex: 1; height: 18px; font-size: 7px; padding: 1px; border: 1px solid #e2e8f0; border-radius: 3px;">
                        <option value="">Select Type</option>
                        <option value="Marriage" ${type === 'Marriage' ? 'selected' : ''}>Marriage</option>
                        <option value="Child Birth" ${type === 'Child Birth' ? 'selected' : ''}>Child Birth</option>
                </select>
                <input type="number" class="life_event_age" data-event-id="${eventId}" value="${age}" placeholder="Age" style="width: 40px; height: 18px; font-size: 7px; padding: 2px; border: 1px solid #e2e8f0; border-radius: 3px;" />
                <button class="remove_life_event" data-event-id="${eventId}" style="padding: 2px 4px; background: #ef4444; color: white; border: none; border-radius: 2px; font-size: 7px; cursor: pointer; font-weight: 500;">×</button>
        `;
        
        lifeEventsContainer.appendChild(eventDiv);
        
        // Add event listeners with change detection
        const typeSelect = eventDiv.querySelector('.life_event_type');
        const ageInput = eventDiv.querySelector('.life_event_age');
        
        // Store initial values for change detection
        let previousType = typeSelect.value;
        let previousAge = ageInput.value;
        
        typeSelect.addEventListener('change', () => {
                const currentType = typeSelect.value;
                
                console.log(`🔍 Life event type change: "${previousType}" → "${currentType}"`);
                
                // Only animate and trigger actions if value actually changed
                if (currentType !== previousType) {
                        console.log('✅ Life event type actually changed, proceeding with animation and actions');
                        animateProfileSection('life_event_section');
                        
                        // When user selects life events, call prediction API
                        if (currentType) {
                                if (currentType === 'Marriage') {
                                        // Trigger AI-assisted expense bump prediction for Marriage
                                        invokeMarriagePredictExpense();
                                } else if (currentType === 'Child Birth') {
                                        // Trigger AI-assisted expense bump prediction for Child Birth
                                        invokeChildBirthPredictExpense();
                                }
                                
                                // If age is also filled and we have expense data, update charts
                                const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                if (ageInput.value && monthlyExpense > 0) {
                                        console.log('📊 Life event type changed, triggering chart update...');
                                        
                                        setTimeout(() => {
                                                switchTab('analysis');
                                                setTimeout(() => {
                                                        renderAnalysis(); // Re-render with updated life events
                                                }, 200);
                                        }, 500);
                                }
                        }
                        
                        // Update stored value
                        previousType = currentType;
                } else {
                        console.log('⏭️ Life event type unchanged, skipping animation and actions');
                }
        });
        
        ageInput.addEventListener('change', () => {
                const currentAge = ageInput.value;
                
                console.log(`🔍 Life event age change: "${previousAge}" → "${currentAge}"`);
                
                // Only animate and trigger actions if value actually changed
                if (currentAge !== previousAge) {
                        console.log('✅ Life event age actually changed, proceeding with animation and actions');
                        animateProfileSection('life_event_section');
                        
                        // Check if we have expense data to trigger chart update
                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                        if (monthlyExpense > 0) {
                                console.log('📊 Life event age changed, triggering chart update...');
                                
                                // Switch to analysis tab and render charts with updated life events
                                setTimeout(() => {
                                        switchTab('analysis');
                                        setTimeout(() => {
                                                renderAnalysis(); // Re-render with updated life events
                                        }, 200);
                                }, 300);
                        }
                        
                        // Update stored value
                        previousAge = currentAge;
                } else {
                        console.log('⏭️ Life event age unchanged, skipping animation and actions');
                }
        });
        
        eventDiv.querySelector('.remove_life_event').addEventListener('click', function() {
                const eventToRemove = document.getElementById(this.dataset.eventId);
                if (eventToRemove) {
                        eventToRemove.remove();
                        animateProfileSection('life_event_section');
                }
        });
        
        animateProfileSection('life_event_section');
}

// Wire public buttons after DOM load
document.addEventListener('DOMContentLoaded', () => {
        // Clear any cached form values that might trigger the graph
        const expenseField = document.getElementById('input_monthly_expense');
        if (expenseField) {
                expenseField.value = '';
        }
        
        // Clear any existing rate prediction boxes that might be in the HTML
        const existingRateBox = document.getElementById('rate-prediction-box');
        if (existingRateBox) {
                existingRateBox.remove();
        }
        
        const send = document.getElementById('public_send_to_categorizer');
        if (send) send.addEventListener('click', publicSendToCategorizer);
        const demo = document.getElementById('public_fill_demo');
        if (demo) demo.addEventListener('click', publicFillDemo);
        
        // Initialize Audio Player
        initAudioPlayer();
        
        // Load conversation transcript for synchronization (with delay to ensure audio player is ready)
        setTimeout(() => {
            loadConversationTranscript();
        }, 1000);
        
        // Note: LSTM rate prediction box will only appear when expense data is provided
        // No automatic initialization to avoid showing box unnecessarily
        
        // update header display with name as user types
        const nameField = document.getElementById('input_name');
        const topName = document.getElementById('top_profile_name');
        if (nameField && topName) {
                const updateTop = () => {
                        const v = nameField.value?.trim();
                        if (v) {
                                topName.textContent = v;
                                topName.style.display = 'inline-block';
                        } else {
                                topName.textContent = 'Guest';
                                // keep the profile pill visible even when no name is entered
                                topName.style.display = 'inline-block';
                        }
                };
                nameField.addEventListener('input', updateTop);
                // initialize
                updateTop();
        }
        
        // Add animation triggers for profile section inputs - animate individual inputs
        const profileInputs = ['input_name', 'input_age', 'input_marital_status', 'input_gender', 'input_property_type', 'input_dependents_count'];
        profileInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                        input.addEventListener('change', function() {
                                animateInput(this);
                        });
                }
        });
        
        // Add animation triggers for financial summary inputs - animate individual inputs
        const financialInputs = ['input_active_income', 'input_active_income_growth', 'input_passive_income', 'input_passive_income_end_age', 'input_current_bank_saving', 'input_monthly_bank_saving', 'input_monthly_expense', 'input_loans_monthly_emi', 'input_loans_end_age'];
        financialInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                        input.addEventListener('change', function() {
                                animateInput(this);
                                
                                // Trigger rate prediction when monthly expense is updated
                                if (id === 'input_monthly_expense' && this.value) {
                                        console.log('💰 Monthly expense updated manually, triggering rate prediction...');
                                        expenseDataExplicitlySet = true; // Mark as explicitly set
                                        setTimeout(() => {
                                                updateRatePredictionBox();
                                                
                                                // Switch to analysis tab and render charts
                                                console.log('📊 Switching to analysis tab to show charts');
                                                switchTab('analysis');
                                                
                                                // Small delay to ensure tab switch is complete
                                                setTimeout(() => {
                                                        renderAnalysis(); // Directly render analysis with user data
                                                }, 200);
                                        }, 800);
                                }
                                
                                // Trigger chart refresh when bank savings is updated manually
                                if (id === 'input_current_bank_saving' && this.value) {
                                        console.log('💰 Bank savings updated manually, checking for chart refresh...');
                                        console.log('💰 Manual bank savings new value:', this.value);
                                        setTimeout(() => {
                                                // Check if we have enough data to render charts
                                                const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                                console.log('💰 Monthly expense value for manual chart check:', monthlyExpense);
                                                
                                                if (monthlyExpense > 0) {
                                                        console.log('💹 Bank savings manual update with expense data, switching to analysis and refreshing charts...');
                                                        // Switch to analysis tab and refresh charts
                                                        switchTab('analysis');
                                                        setTimeout(() => {
                                                                console.log('💹 About to call renderAnalysis() for manual bank savings refresh');
                                                                renderAnalysis(); // Refresh charts with new bank balance
                                                        }, 200);
                                                } else {
                                                        console.log('⏭️ Bank savings updated manually but no expense data available for chart refresh');
                                                }
                                        }, 300);
                                }
                        });
                }
        });
        
        // Life Events Management - connect to global function
        const addLifeEventBtn = document.getElementById('add_life_event_btn');
        
        if (addLifeEventBtn) {
                addLifeEventBtn.addEventListener('click', () => {
                        addLifeEvent();
                });
        }
        
        // Helper function to get all life events
        window.getLifeEvents = function() {
                const events = [];
                document.querySelectorAll('.life_event_type').forEach(select => {
                        const eventId = select.dataset.eventId;
                        const ageInput = document.querySelector(`.life_event_age[data-event-id="${eventId}"]`);
                        if (select.value && ageInput.value) {
                                events.push({
                                        type: select.value,
                                        age: parseInt(ageInput.value)
                                });
                        }
                });
                return events;
        };
        
        // Helper functions for scenario type radio buttons
        window.getScenarioType = function() {
                const checkedRadio = document.querySelector('input[name="scenario_type"]:checked');
                return checkedRadio ? checkedRadio.value : '';
        };
        
        window.setScenarioType = function(value) {
                const radios = document.querySelectorAll('input[name="scenario_type"]');
                radios.forEach(radio => {
                        if (radio.value === value) {
                                radio.checked = true;
                                // Trigger the change event to show/hide fields
                                radio.dispatchEvent(new Event('change'));
                        }
                });
        };
        
        // Add animation triggers for scenario inputs section with change detection
        const scenarioInputs = ['input_death_age', 'input_scenario_retirement_age', 'input_scenario_monthly_retirement_expenses', 'input_scenario_life_expectancy'];
        scenarioInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                        // Store initial value for change detection
                        let previousValue = input.value;
                        
                        input.addEventListener('change', () => {
                                const currentValue = input.value;
                                
                                console.log(`🔍 Scenario input ${id} change: "${previousValue}" → "${currentValue}"`);
                                
                        // Only animate and trigger actions if value actually changed
                        if (currentValue !== previousValue) {
                                console.log(`✅ Scenario input ${id} actually changed, proceeding with animation and actions`);
                                animateProfileSection('scenario_inputs_section');
                                
                                // Trigger clustering API when retirement age is populated
                                if (id === 'input_scenario_retirement_age' && currentValue) {
                                        console.log('🎯 Retirement age changed, triggering clustering API...');
                                        const profileData = formatProfileForClustering();
                                        callClusteringAPI(profileData);
                                        
                                        // Also trigger chart update for retirement age
                                        console.log('📊 Retirement age changed, triggering chart update...');
                                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                        if (monthlyExpense > 0) {
                                                // Switch to analysis tab and render charts with updated retirement age
                                                setTimeout(() => {
                                                        switchTab('analysis');
                                                        setTimeout(() => {
                                                                renderAnalysis(); // Re-render with updated retirement age
                                                        }, 200);
                                                }, 300);
                                        }
                                }
                                
                                // Trigger chart update when death age is changed
                                if (id === 'input_death_age' && currentValue) {
                                        console.log('💀 Death age changed, triggering chart update...');
                                        
                                        // Check if we have expense data to trigger chart update
                                        const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                        if (monthlyExpense > 0) {
                                                // Switch to analysis tab and render charts with updated death scenario
                                                setTimeout(() => {
                                                        switchTab('analysis');
                                                        setTimeout(() => {
                                                                renderAnalysis(); // Re-render with updated death age
                                                        }, 200);
                                                }, 300);
                                        }
                                }
                                
                                // Update stored value
                                previousValue = currentValue;
                        } else {
                                console.log(`⏭️ Scenario input ${id} unchanged, skipping animation and actions`);
                        }
                });
                }
        });        // Add scenario type radio button change handler for conditional fields
        const scenarioTypeRadios = document.querySelectorAll('input[name="scenario_type"]');
        scenarioTypeRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                        const deathFields = document.getElementById('death_scenario_fields');
                        const retirementFields = document.getElementById('retirement_scenario_fields');
                        
                        if (this.value === 'Death') {
                                deathFields.style.display = 'flex';
                                retirementFields.style.display = 'none';
                                
                                // Check if death age is already filled and trigger chart update
                                const deathAge = document.getElementById('input_death_age')?.value;
                                const monthlyExpense = parseFloat(document.getElementById('input_monthly_expense')?.value || 0);
                                if (deathAge && monthlyExpense > 0) {
                                        console.log('💀 Death scenario selected with existing death age, triggering chart update...');
                                        setTimeout(() => {
                                                switchTab('analysis');
                                                setTimeout(() => {
                                                        renderAnalysis(); // Re-render with death scenario
                                                }, 200);
                                        }, 300);
                                }
                        } else if (this.value === 'Retirement') {
                                deathFields.style.display = 'none';
                                retirementFields.style.display = 'flex';
                        }
                        
                        animateProfileSection('scenario_inputs_section');
                });
        });
});

// Track last predicted event and data to prevent unnecessary refreshes
let lastPredictedEvents = {}; // Changed to object to track multiple events

// Track if expense data has been explicitly provided by user or conversation
let expenseDataExplicitlySet = false;

// Hardcoded expense prediction function for life events
async function invokeLifeEventPredictExpense(eventType) {
        try {
                console.log(`🔄 Starting ${eventType} expense prediction...`);
                
                
                const hardcodedPredictions = {
                        'Marriage': 0,
                        'Child Birth': 0
                };
                
                const bump = hardcodedPredictions[eventType];
                
                // Get current profile data to check for changes
                const currentProfileData = formatProfileForClustering();
                const currentDataHash = JSON.stringify(currentProfileData);
                
                // Check if this specific event has the same data
                const lastEventData = lastPredictedEvents[eventType];
                if (lastEventData && 
                    lastEventData.data === currentDataHash && 
                    lastEventData.bump === bump) {
                        console.log(`🔄 Skipping ${eventType} prediction - no data changes detected`);
                        return;
                }
                
                
                // Collect current profile data for the prediction API
                const profileData = formatProfileForClustering();
                
                console.log(`📊 Sending ${eventType} prediction request with profile:`, profileData);
                
                const requestPayload = {
                        customer_data: profileData,
                        event_type: eventType
                };
                
                console.log(`🚀 Full API request payload:`, requestPayload);
                
                const response = await fetch('http://localhost:9000/api/predict-expense', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify(requestPayload)
                });
                
                console.log(`📡 API Response Status: ${response.status}`);
                console.log(`📡 API Response Headers:`, [...response.headers.entries()]);
                
                if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`❌ API Error Response: ${errorText}`);
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                console.log(`✅ ${eventType} prediction API response:`, result);
                
                if (result.success && result.predicted_expense_bump) {
                        const bump = result.predicted_expense_bump;
                        // Continue with bump usage...
                } else {
                        console.warn(`⚠️ API returned no expense bump prediction for ${eventType}`);
                        throw new Error(`No prediction available for ${eventType}`);
                }
                
                
                if (bump) {
                        console.log(`✅ Successfully predicted expense bump for ${eventType}:`, bump);
                        
                        // Update tracking data for this specific event
                        lastPredictedEvents[eventType] = {
                                data: currentDataHash,
                                bump: bump
                        };
                        
                        // Get modern styling - simplified red-white theme for all events
                        const colors = {
                                primary: '#dc2626',    // Red
                                secondary: '#ef4444',  // Lighter red
                                background: '#ffffff', // White
                                text: '#1f2937',      // Dark gray
                                light: '#fef2f2'      // Very light red
                        };
                        
                        // Create improved prediction box with header
                        const predictionHTML = `
                                <div id="prediction-${eventType.replace(' ', '-').toLowerCase()}" style="
                                        background: ${colors.background}; 
                                        border: 1px solid #e5e7eb; 
                                        border-left: 4px solid ${colors.primary}; 
                                        border-radius: 6px; 
                                        padding: 10px 12px; 
                                        margin-bottom: 6px;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                        transition: all 0.2s ease;
                                ">
                                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                                                <span style="background:${colors.primary};color:#fff;border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:8px;">🤖</span>
                                                <div style="font-size:9px; font-weight:600; color:${colors.text};">AI Assisted Expense Prediction</div>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                                <span style="font-size:10px; font-weight:500; color:${colors.text};">${eventType}</span>
                                                <span style="font-size:12px; font-weight:700; color:${colors.primary};">+$${bump} SGD</span>
                                        </div>
                                </div>
                        `;
                        
                        // Get or create the predictions container
                        let predictionsContainer = document.getElementById('predictions-container');
                        if (!predictionsContainer) {
                                // Create container if it doesn't exist and replace the existing prediction section
                                const predictionSection = document.getElementById('prediction');
                                if (predictionSection) {
                                        predictionSection.innerHTML = '<div id="predictions-container"></div>';
                                        predictionsContainer = document.getElementById('predictions-container');
                                }
                        }
                        
                        if (predictionsContainer) {
                                // Check if this event already has a prediction box
                                const existingPrediction = document.getElementById(`prediction-${eventType.replace(' ', '-').toLowerCase()}`);
                                if (existingPrediction) {
                                        // Update existing prediction
                                        existingPrediction.outerHTML = predictionHTML;
                                        
                                        // Re-add hover effects to the updated prediction box
                                        const updatedPredictionBox = document.getElementById(`prediction-${eventType.replace(' ', '-').toLowerCase()}`);
                                        if (updatedPredictionBox) {
                                                updatedPredictionBox.addEventListener('mouseenter', function() {
                                                        this.style.backgroundColor = colors.light;
                                                        this.style.transform = 'translateX(2px)';
                                                });
                                                updatedPredictionBox.addEventListener('mouseleave', function() {
                                                        this.style.backgroundColor = colors.background;
                                                        this.style.transform = 'translateX(0)';
                                                });
                                        }
                                } else {
                                // Add new prediction box at the top (life events should appear above LSTM box)
                                predictionsContainer.insertAdjacentHTML('afterbegin', predictionHTML);
                                
                                // Add hover effects to the new prediction box
                                const newPredictionBox = document.getElementById(`prediction-${eventType.replace(' ', '-').toLowerCase()}`);
                                if (newPredictionBox) {
                                        newPredictionBox.addEventListener('mouseenter', function() {
                                                this.style.backgroundColor = colors.light;
                                                this.style.transform = 'translateX(2px)';
                                        });
                                        newPredictionBox.addEventListener('mouseleave', function() {
                                                this.style.backgroundColor = colors.background;
                                                this.style.transform = 'translateX(0)';
                                        });
                                }
                        }                                // Trigger animation for the parent prediction section
                                const section = document.getElementById('prediction');
                                if (section) {
                                        const parentDiv = section.closest('div[style*="background: white"]');
                                        if (parentDiv) {
                                                // Simple animation without replacing content
                                                parentDiv.style.transition = 'all 0.3s ease';
                                                parentDiv.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.2), 0 3px 8px rgba(239, 68, 68, 0.15)';
                                                
                                                setTimeout(() => {
                                                        parentDiv.style.boxShadow = '';
                                                }, 1000);
                                        }
                                }
                        }
                        
                        // Removed toast message as requested
                } else {
                        console.warn(`⚠️ No prediction available for ${eventType}`);
                        // Removed toast message as requested
                }
        } catch (err) {
                console.error(`❌ Predict Expense (${eventType}) failed:`, err);
                // Removed toast message as requested - only console logging
        }
}

// Legacy function for Marriage (for backward compatibility)
async function invokeMarriagePredictExpense() {
        return invokeLifeEventPredictExpense('Marriage');
}

// New function for Child Birth
async function invokeChildBirthPredictExpense() {
        return invokeLifeEventPredictExpense('Child Birth');
}

// Helper function to clear all predictions
function clearAllPredictions() {
        const predictionsContainer = document.getElementById('predictions-container');
        if (predictionsContainer) {
                predictionsContainer.innerHTML = '';
        }
        lastPredictedEvents = {}; // Reset tracking
}

// LSTM Rate Prediction Functions
async function fetchRatePredictions() {
         
        try {
                console.log('📈 Fetching LSTM rate predictions...');
                
                const response = await fetch('http://localhost:9000/api/predict-rates', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                                months_ahead: 60 // 5 years
                        })
                });
                
                if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                        return {
                                nominal_rates: result.nominal_rates,
                                inflation_rates: result.inflation_rates
                        };
                } else {
                        throw new Error('Rate prediction failed');
                }
        } catch (error) {
                console.error('❌ Error fetching rate predictions:', error);
                return null;
        }
        
        
        
}

function createMiniGraph(nominalRates, inflationRates) {
        // Take only first 16 months for compact display
        const displayData = nominalRates.slice(0, 16);
        const inflationData = inflationRates.slice(0, 16);
        
        // Find min/max for scaling
        const allRates = [...displayData.map(d => d.rate), ...inflationData.map(d => d.rate)];
        const minRate = Math.min(...allRates);
        const maxRate = Math.max(...allRates);
        const range = maxRate - minRate;
        
        // Graph dimensions
        const width = 180;
        const height = 60;
        const padding = 8;
        const graphWidth = width - (padding * 2);
        const graphHeight = height - (padding * 2);
        
        // Scale function
        const scaleY = (value) => {
                return graphHeight - ((value - minRate) / range) * graphHeight;
        };
        
        // Create SVG paths
        let nominalPath = '';
        let inflationPath = '';
        
        displayData.forEach((point, index) => {
                const x = (index / (displayData.length - 1)) * graphWidth;
                const y = scaleY(point.rate);
                
                if (index === 0) {
                        nominalPath += `M ${x} ${y}`;
                } else {
                        nominalPath += ` L ${x} ${y}`;
                }
        });
        
        inflationData.forEach((point, index) => {
                const x = (index / (inflationData.length - 1)) * graphWidth;
                const y = scaleY(point.rate);
                
                if (index === 0) {
                        inflationPath += `M ${x} ${y}`;
                } else {
                        inflationPath += ` L ${x} ${y}`;
                }
        });
        
        return `
                <svg width="${width}" height="${height}" style="background: #f8fafc; border-radius: 4px;">
                        <g transform="translate(${padding}, ${padding})">
                                <!-- Grid lines -->
                                <line x1="0" y1="0" x2="${graphWidth}" y2="0" stroke="#e2e8f0" stroke-width="0.5"/>
                                <line x1="0" y1="${graphHeight/2}" x2="${graphWidth}" y2="${graphHeight/2}" stroke="#e2e8f0" stroke-width="0.5"/>
                                <line x1="0" y1="${graphHeight}" x2="${graphWidth}" y2="${graphHeight}" stroke="#e2e8f0" stroke-width="0.5"/>
                                
                                <!-- Nominal rate line -->
                                <path d="${nominalPath}" stroke="#dc2626" stroke-width="1.5" fill="none"/>
                                
                                <!-- Inflation rate line -->
                                <path d="${inflationPath}" stroke="#2563eb" stroke-width="1.5" fill="none"/>
                        </g>
                </svg>
        `;
}

async function updateRatePredictionBox() {
        try {
                console.log('📊 Updating rate prediction box...');
                
                // Check if expense data is available
                const expenseField = document.getElementById('input_monthly_expense');
                const rawValue = expenseField ? expenseField.value : '';
                const monthlyExpense = parseFloat(rawValue) || 0;
                
                console.log('📊 Expense field value:', rawValue, 'Parsed:', monthlyExpense, 'Flag:', expenseDataExplicitlySet);
                
                // Show LSTM box when expense data is provided (either flag is set OR valid expense value exists)
                const hasExpenseData = (expenseDataExplicitlySet && monthlyExpense > 0) || 
                                     (expenseField && rawValue !== '' && monthlyExpense > 0);
                
                console.log('📊 hasExpenseData:', hasExpenseData);
                
                // Only show LSTM box if we have expense data - no "Not enough data" version
                if (!hasExpenseData) {
                        console.log('📊 No expense data available, not showing LSTM box');
                        return; // Exit without showing anything
                }
                
                // Show full LSTM prediction with nominal and inflation rate graphs
                const ratePredictions = await fetchRatePredictions();
                
                if (!ratePredictions) {
                        console.warn('⚠️ No rate predictions available');
                        return;
                }
                
                const { nominal_rates, inflation_rates } = ratePredictions;
                
                // Calculate averages for display
                const avgNominal = (nominal_rates.slice(0, 16).reduce((sum, item) => sum + item.rate, 0) / 16).toFixed(2);
                const avgInflation = (inflation_rates.slice(0, 16).reduce((sum, item) => sum + item.rate, 0) / 16).toFixed(2);
                
                // Create mini graph
                const miniGraph = createMiniGraph(nominal_rates, inflation_rates);
                
                const rateBoxHTML = `
                                <div id="rate-prediction-box" style="
                                        background: #ffffff; 
                                        border: 1px solid #e5e7eb; 
                                        border-left: 4px solid #059669; 
                                        border-radius: 6px; 
                                        padding: 10px 12px; 
                                        margin-bottom: 6px;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                        transition: all 0.2s ease;
                                ">
                                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                                                <span style="background:#059669;color:#fff;border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:8px;">📈</span>
                                                <div style="font-size:9px; font-weight:600; color:#1f2937;">AI Assisted Inflation and Nominal rate forecast</div>
                                        </div>
                                        
                                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                                <div style="text-align:center; flex:1;">
                                                        <div style="font-size:7px; color:#6b7280;">Avg Nominal</div>
                                                        <div style="font-size:10px; font-weight:600; color:#dc2626;">${avgNominal}%</div>
                                                </div>
                                                <div style="text-align:center; flex:1;">
                                                        <div style="font-size:7px; color:#6b7280;">Avg Inflation</div>
                                                        <div style="font-size:10px; font-weight:600; color:#2563eb;">${avgInflation}%</div>
                                                </div>
                                        </div>
                                        
                                        <div style="margin-bottom:4px;">
                                                ${miniGraph}
                                        </div>
                                        
                                        <div style="display:flex; justify-content:center; gap:8px; font-size:6px; color:#6b7280;">
                                                <span style="display:flex; align-items:center; gap:2px;">
                                                        <div style="width:8px; height:2px; background:#dc2626;"></div>
                                                        Nominal
                                                </span>
                                                <span style="display:flex; align-items:center; gap:2px;">
                                                        <div style="width:8px; height:2px; background:#2563eb;"></div>
                                                        Inflation
                                                </span>
                                        </div>
                                </div>
                        `;
                
                // Get or create the predictions container
                let predictionsContainer = document.getElementById('predictions-container');
                console.log('📊 Found predictions container:', predictionsContainer);
                if (!predictionsContainer) {
                        const predictionSection = document.getElementById('prediction');
                        console.log('📊 Found prediction section:', predictionSection);
                        if (predictionSection) {
                                predictionSection.innerHTML = '<div id="predictions-container"></div>';
                                predictionsContainer = document.getElementById('predictions-container');
                                console.log('📊 Created predictions container:', predictionsContainer);
                        }
                }
                
                if (predictionsContainer) {
                        // Check if rate prediction box already exists
                        const existingRateBox = document.getElementById('rate-prediction-box');
                        if (existingRateBox) {
                                existingRateBox.outerHTML = rateBoxHTML;
                        } else {
                                predictionsContainer.insertAdjacentHTML('beforeend', rateBoxHTML);
                        }
                        
                        // Add hover effect
                        const newRateBox = document.getElementById('rate-prediction-box');
                        if (newRateBox) {
                                newRateBox.addEventListener('mouseenter', function() {
                                        this.style.backgroundColor = '#f0fdf4';
                                        this.style.transform = 'translateX(2px)';
                                });
                                newRateBox.addEventListener('mouseleave', function() {
                                        this.style.backgroundColor = '#ffffff';
                                        this.style.transform = 'translateX(0)';
                                });
                        }
                }
                
                console.log('✅ Rate prediction box updated successfully');
                
        } catch (error) {
                console.error('❌ Error updating rate prediction box:', error);
        }
}

// Enhanced function to clear all predictions including rate predictions
function clearAllPredictionsIncludingRates() {
        const predictionsContainer = document.getElementById('predictions-container');
        if (predictionsContainer) {
                predictionsContainer.innerHTML = '';
        }
        lastPredictedEvents = {}; // Reset tracking
}

function updateProfileUI(p, step, completed) {
        // Track if any values changed for animation
        let profileChanged = false;
        let financialChanged = false;
        let goalsChanged = false;
        
        // Update profile fields
        if (p?.household_size || p?.housing_type || p?.dependents) profileChanged = true;
        setTextIfPresent('household_size', p?.household_size ?? '—');
        setTextIfPresent('monthly_income_sgd', p?.monthly_income_sgd ? `$${p.monthly_income_sgd}` : '—');
        setTextIfPresent('housing_type', p?.housing_type ?? '—');
        setTextIfPresent('dependents', p?.dependents ?? '—');
        
        if (p?.monthly_expenses_sgd || p?.savings_sgd || p?.liabilities_mortgage_sgd) financialChanged = true;
        setTextIfPresent('monthly_expenses_sgd', p?.monthly_expenses_sgd ? `$${p.monthly_expenses_sgd}` : '—');
        setTextIfPresent('savings_sgd', p?.savings_sgd ? `$${p.savings_sgd}` : '—');
        setTextIfPresent('cpf_employee_percent', p?.cpf_employee_percent ? `${p.cpf_employee_percent}%` : '—');
        setTextIfPresent('liabilities_mortgage_sgd', p?.liabilities_mortgage_sgd ? `$${p.liabilities_mortgage_sgd}` : '—');
        
        if (p?.risk_tolerance || p?.invest_horizon_years || p?.investment_goal) goalsChanged = true;
        setTextIfPresent('risk_tolerance', p?.risk_tolerance ?? '—');
        setTextIfPresent('invest_horizon_years', p?.invest_horizon_years ?? '—');
        setTextIfPresent('monthly_invest_sgd', p?.monthly_invest_sgd ? `$${p.monthly_invest_sgd}` : '—');
        const instruments = Array.isArray(p?.preferred_instruments) ? p.preferred_instruments.join(', ') : (p?.preferred_instruments ?? '—');
        setTextIfPresent('preferred_instruments', instruments);
        setTextIfPresent('investment_goal', p?.investment_goal ?? '—');

        // Animate sections that changed
        if (profileChanged) animateProfileSection('profile_section');
        if (financialChanged) animateProfileSection('financial_summary_section');
        if (goalsChanged) animateProfileSection('goals_section');

        // Update status
        const statusText = completed ? '✅ Profile Complete' : `Question ${Math.min(step + 1, totalSteps)} of ${totalSteps}`;
        setTextIfPresent('status_badge', statusText);

        // Update progress bar
        const pct = completed ? 100 : Math.round(((step) / Math.max(1, totalSteps)) * 100);
        const bar = document.getElementById('progressBar');
        if (bar) bar.style.width = pct + '%';

        // Compute metrics
        const income = Number(p?.monthly_income_sgd ?? 0) || 0;
        const expenses = Number(p?.monthly_expenses_sgd ?? 0) || 0;
        const monthlyInvest = Number(p?.monthly_invest_sgd ?? 0) || 0;
        const netMonthly = income - expenses - monthlyInvest;
        setTextIfPresent('metric_net_monthly', netMonthly ? `$${netMonthly.toLocaleString()}` : '—');
        const savingsRate = income ? Math.max(0, Math.min(100, Math.round(((monthlyInvest) / income) * 100))) : null;
        setTextIfPresent('metric_savings_rate', savingsRate != null ? `${savingsRate}%` : '—');
        setTextIfPresent('metric_risk', p?.risk_tolerance ? String(p.risk_tolerance).charAt(0).toUpperCase() + String(p.risk_tolerance).slice(1) : '—');
        
        // Auto-switch to Analysis tab when profile is complete
        if (completed && currentTab === 'chat') {
                setTimeout(() => {
                        switchTab('analysis');
                        toast('✨ Profile complete! View your financial analysis.');
                }, 1000);
        }
}

async function initSession() {
        setTextIfPresent('status_badge', 'Starting...');
        setTextIfPresent('recIndicator', 'Initializing...');
        
        const res = await fetch('/api/session', { method: 'POST' });
    if (!res.ok) throw new Error('session_http_' + res.status);
    const data = await res.json();
    if (!data || !data.sessionId) throw new Error('session_invalid_response');
        
    sessionId = data.sessionId;
    if (data.totalSteps) totalSteps = data.totalSteps;
    if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
    // Skip welcome message and auto-play greeting on page load
    // if (data.assistantText) appendMessage('assistant', data.assistantText);
    // if (data.audio) { ... } // Auto-play greeting removed
        
        // Enable controls
    el('recordBtn').disabled = false;
    el('sendBtn').disabled = false;
        el('textInput').disabled = false;
        
        setTextIfPresent('status_badge', 'Question 1 of ' + totalSteps);
        // toast('🎙️ Voice assistant ready! Hold the button to speak.'); // Toast notification removed
        
        // Show demo button
        const demoBtn = el('demoBtn');
        if (demoBtn) {
                demoBtn.style.display = 'block';
                demoBtn.addEventListener('click', loadDemoProfile);
        }
}

async function loadDemoProfile() {
        if (!sessionId) {
                toast('❌ Please start a session first');
                return;
        }
        
        try {
                const demoBtn = el('demoBtn');
                if (demoBtn) {
                        demoBtn.textContent = '⏳ Loading...';
                        demoBtn.disabled = true;
                }
                
                const res = await fetch('/api/demo-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                });
                
                const data = await res.json();
                
                if (res.ok && data.ok) {
                        updateProfileUI(data.profile, 13, true);
                        appendMessage('assistant', 'Demo profile loaded! Family of 4, $12K monthly income, $85K savings. Let me analyze your financial future...');
                        toast('✅ ' + data.message);
                        
                        // Hide demo button after loading
                        if (demoBtn) {
                                demoBtn.style.display = 'none';
                        }
                        
                        // Auto-switch to analysis tab
                        setTimeout(() => {
                                switchTab('analysis');
                        }, 1500);
                } else {
                        toast('❌ Failed to load demo data');
                        if (demoBtn) {
                                demoBtn.textContent = '⚡ Load Demo Data';
                                demoBtn.disabled = false;
                        }
                }
        } catch (e) {
                console.error('Error loading demo:', e);
                toast('❌ Error loading demo data');
                const demoBtn = el('demoBtn');
                if (demoBtn) {
                        demoBtn.textContent = '⚡ Load Demo Data';
                        demoBtn.disabled = false;
                }
        }
}

function playBase64Wav(base64) {
        return new Promise((resolve, reject) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
                audio.onended = resolve;
                audio.onerror = resolve;
                audio.play().catch((err) => {
                        console.log('Audio play prevented:', err);
                        reject(err);
                });
        });
}

async function startRecording() {
        if (!navigator.mediaDevices?.getUserMedia) {
                toast('❌ Microphone access not available');
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
        el('recordBtn').textContent = '⏺ Recording...';
}

async function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        setTextIfPresent('recIndicator', 'Processing...');
        el('recordBtn').classList.remove('recording');
        el('recordBtn').textContent = '🎤 Hold to Talk';
}

async function onRecordingStop() {
    const type = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : 'audio/webm';
    const extension = type.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob(recordedChunks, { type });
        appendMessage('user', 'Speaking...');
        const placeholder = el('messages').lastChild.querySelector('.bubble');

        const fd = new FormData();
        fd.append('sessionId', sessionId);
    fd.append('audio', blob, `input.${extension}`);
        
        try {
        const res = await fetch('/api/ingest-audio', { method: 'POST', body: fd });
        const data = await res.json();
        placeholder.textContent = data.transcript || '[unrecognized]';
        if (data.assistantText) appendMessage('assistant', data.assistantText);
        if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
                
                if (data.audio) {
                        const rec = document.getElementById('recIndicator');
                        if (rec) {
                                rec.textContent = 'Speaking...';
                                rec.classList.add('speaking');
                        }
                        await playBase64Wav(data.audio);
                        if (rec) {
                                rec.textContent = 'Ready';
                                rec.classList.remove('speaking');
                        }
                }
        } catch (e) {
                console.error('Error:', e);
                toast('❌ Failed to process audio. Please try again.');
        }
        
        setTextIfPresent('recIndicator', 'Ready');
}

    async function sendText() {
        if (!sessionId) return;
        const text = el('textInput').value.trim();
        if (!text) return;
        el('textInput').value = '';
        appendMessage('user', text);
        
        try {
                const res = await fetch('/api/ingest-text', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ sessionId, text }) 
                });
        const data = await res.json();
        if (data.assistantText) appendMessage('assistant', data.assistantText);
        if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
                
                if (data.audio) {
                        const rec = document.getElementById('recIndicator');
                        if (rec) {
                                rec.textContent = 'Speaking...';
                                rec.classList.add('speaking');
                        }
                        await playBase64Wav(data.audio);
                        if (rec) {
                                rec.textContent = 'Ready';
                                rec.classList.remove('speaking');
                        }
                }
        } catch (e) {
                console.error('Error:', e);
                toast('❌ Failed to send message. Please try again.');
        }
}

function wireControls() {
        const btn = el('recordBtn');
        const send = el('sendBtn');
        const input = el('textInput');

        // Only wire if elements exist (they were removed in compact layout)
        if (btn) {
                btn.addEventListener('mousedown', startRecording);
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
                btn.addEventListener('mouseup', stopRecording);
                btn.addEventListener('mouseleave', () => { if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording(); });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });
        }

        if (send) {
                send.addEventListener('click', sendText);
        }
        
        if (input) {
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });
        }

        // Modal-based inline edits
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
                editTitle.textContent = `Edit ${field.replace(/_/g, ' ')}`;
                editInput.value = current === '—' ? '' : current.replace(/[$,]/g, '');
                const numericFields = ['household_size', 'monthly_income_sgd', 'dependents', 'monthly_expenses_sgd', 'savings_sgd', 'cpf_employee_percent', 'liabilities_mortgage_sgd', 'invest_horizon_years', 'monthly_invest_sgd'];
        editHint.textContent = numericFields.includes(field) ? 'Enter a number' : (field === 'preferred_instruments' ? 'Comma-separated (e.g., stocks, ETFs)' : '');
                modal.setAttribute('aria-hidden', 'false');
        editInput.focus();
    }

    function closeModal() {
                modal.setAttribute('aria-hidden', 'true');
        editField = null;
    }

    function coerce(field, value) {
                const numericFields = ['household_size', 'monthly_income_sgd', 'dependents', 'monthly_expenses_sgd', 'savings_sgd', 'cpf_employee_percent', 'liabilities_mortgage_sgd', 'invest_horizon_years', 'monthly_invest_sgd'];
        if (numericFields.includes(field)) {
                        const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
                        if (Number.isNaN(n)) return { ok: false };
                        return { ok: true, value: n };
        }
        if (field === 'preferred_instruments') {
                        return { ok: true, value: value.split(',').map(s => s.trim()).filter(Boolean) };
        }
                return { ok: true, value };
    }

    async function saveEdit() {
        if (!editField || !sessionId) return;
        const raw = editInput.value.trim();
        const parsed = coerce(editField, raw);
                if (!parsed.ok) { toast('❌ Please enter a valid value'); return; }
                const payload = {}; 
                payload[editField] = parsed.value;
                
                try {
                        const res = await fetch('/api/profile-update', { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'application/json' }, 
                                body: JSON.stringify({ sessionId, fields: payload }) 
                        });
        const data = await res.json();
                        if (!res.ok || !data?.ok) { toast('❌ Update failed'); return; }
        updateProfileUI(data.profile, 0, false);
                        toast('✅ Updated - Analysis refreshing...');
        closeModal();
                        
                        // Auto-refresh analysis if on analysis tab
                        if (currentTab === 'analysis') {
                                setTimeout(() => {
                                        loadAnalysis();
                                        toast('📊 Analysis updated with new values!');
                                }, 300);
                        }
                } catch (e) {
                        console.error('Error:', e);
                        toast('❌ Update failed');
                }
    }

    if (grid) {
        grid.addEventListener('click', (e) => {
            const node = e.target.closest('.profile-value.editable');
                        if (!node) return;
                        if (!sessionId) {
                                toast('⚠️ Please start a session first');
                                return;
                        }
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
        setTimeout(() => { t.remove(); }, 3000);
}

// Tab switching
let currentTab = 'chat';
let cumulativeChart = null;
let incomeChart = null;
let expensesChart = null;
let investmentChart = null;
let currentPeriod = 50;

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'analysis' && sessionId) {
        loadAnalysis();
    } else if (tabName === 'scenarios' && sessionId) {
        loadScenarios();
    } else if (tabName === 'insights') {
        loadConversationInsights();
    }
}

async function loadAnalysis() {
        const container = document.getElementById('analysis-content');
        
        // Show loading state
        container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px;">
                        <div style="width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                        <div style="color: #64748b; font-size: 16px; font-weight: 500;">Loading your financial analysis...</div>
                </div>
                <style>
                        @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                        }
                </style>
        `;
        
        try {
                const response = await fetch(`/api/analysis?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (response.ok) {
                        renderAnalysis(data);
        } else {
                        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">Unable to load analysis. Please complete your profile first.</p>';
        }
    } catch (error) {
                console.error('Error loading analysis:', error);
                container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 40px;">Error loading analysis.</p>';
        }
}

function renderAnalysis(data) {
        console.log('📊 renderAnalysis called with data:', data);
        console.log('📊 expenseDataExplicitlySet flag:', expenseDataExplicitlySet);
        
        // Get the container first
        const container = document.getElementById('analysis-content');
        console.log('📊 Found analysis-content container:', !!container);
        
        // Check if we have expense data (the key trigger)
        if (!expenseDataExplicitlySet) {
                console.log('📊 No sufficient data, showing placeholder message');
                // Show "Not enough data" message instead of dummy chart
                if (container) {
                        container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 60px 20px;"><div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">Not Enough Data</div><div style="font-size: 12px;">Update your expenses to see financial projections</div></div>';
                }
        } else {
                console.log('📊 Sufficient data available, generating real user projections');
                // Generate projections from actual user data
                const userProjections = generateUserFinancialProjections();
                console.log('📊 Generated user projections:', userProjections);
                
                if (userProjections && container) {
                        console.log('📊 Calling renderEnhancedWealthChart with projections and container');
                        
                        // Use the original bar chart design
                        renderEnhancedWealthChart(userProjections);
                } else {
                        console.log('📊 No projections or container - showing fallback message');
                        // Fallback to "Not enough data" if projection generation fails
                        if (container) {
                                container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 60px 20px;"><div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">Not Enough Data</div><div style="font-size: 12px;">Please fill in more financial details</div></div>';
                        }
                }
        }
}

// Function to extract life events from UI and calculate expense bumps
function extractLifeEventsFromUI() {
        const lifeEvents = [];
        
        // Get all life event elements from the dynamic life event section
        const lifeEventContainers = document.querySelectorAll('#life_events_container > div');
        
        lifeEventContainers.forEach(container => {
                const typeSelect = container.querySelector('.life_event_type');
                const ageInput = container.querySelector('.life_event_age');
                
                if (typeSelect && ageInput && typeSelect.value && ageInput.value) {
                        const eventType = typeSelect.value;
                        const age = parseInt(ageInput.value);
                        
                        if (age > 0) {
                                if (eventType === 'Marriage') {
                                        lifeEvents.push({
                                                type: 'Marriage',
                                                age: age,
                                                monthlyBump: 3500, // Marriage expense bump
                                                description: 'Marriage - Additional household expenses'
                                        });
                                        console.log(`📊 Life Event: Marriage at age ${age} with $3,500/month expense bump`);
                                } else if (eventType === 'Child Birth') {
                                        lifeEvents.push({
                                                type: 'Child Birth',
                                                age: age,
                                                monthlyBump: 2600, // Child birth expense bump
                                                description: 'Child Birth - Childcare and family expenses'
                                        });
                                        console.log(`📊 Life Event: Child Birth at age ${age} with $2,600/month expense bump`);
                                }
                        }
                }
        });
        
        console.log(`📊 Extracted ${lifeEvents.length} life events from UI:`, lifeEvents);
        return lifeEvents;
}

// Generate financial projections from actual user form data
function generateUserFinancialProjections() {
        try {
                console.log('📊 Extracting real user data for projections...');
                
                // Extract current form values with enhanced logging
                const getUserField = (id) => {
                        const field = document.getElementById(id);
                        const value = field ? field.value : '';
                        console.log(`📊 Field ${id}: "${value}"`);
                        return value;
                };
                
                const age = parseInt(getUserField('input_age')) || 30;
                const monthlyExpense = parseFloat(getUserField('input_monthly_expense')) || 0;
                const monthlyActiveIncome = parseFloat(getUserField('input_active_income')) || 0;
                const monthlyPassiveIncome = parseFloat(getUserField('input_passive_income')) || 0;
                const currentSavings = parseFloat(getUserField('input_current_bank_saving')) || 0;
                const monthlySavings = parseFloat(getUserField('input_monthly_bank_saving')) || 0;
                const incomeGrowthRate = (parseFloat(getUserField('input_active_income_growth')) || 3) / 100;
                const retirementAge = parseInt(getUserField('input_scenario_retirement_age')) || 65;
                const deathAge = parseInt(getUserField('input_death_age')) || null;
                const lifeExpectancy = parseInt(getUserField('input_scenario_life_expectancy')) || 85;
                
                // Extract life events for expense spikes
                const lifeEvents = extractLifeEventsFromUI();
                
                // Validate that we have minimum required data
                if (monthlyExpense <= 0) {
                        console.log('📊 No valid expense data, cannot generate projections');
                        return null;
                }
                
                console.log('📊 User data extracted:', {
                        age, 
                        monthlyExpense, 
                        monthlyActiveIncome, 
                        monthlyPassiveIncome, 
                        currentSavings,
                        monthlySavings,
                        incomeGrowthRate, 
                        retirementAge,
                        deathAge,
                        lifeExpectancy,
                        lifeEvents
                });
                
                // Create projection parameters from real user data
                const projectionParams = {
                        currentAge: age,
                        retirementAge: retirementAge,
                        deathAge: deathAge,  // Death age for stopping active income
                        lifeExpectancy: lifeExpectancy,  // Life expectancy for simulation end
                        projectionYears: Math.min(60, Math.max(50, lifeExpectancy - age)), // Project until life expectancy but cap at 60 years max, minimum 50
                        monthlyExpense0: monthlyExpense,
                        monthlyActiveIncome0: monthlyActiveIncome,
                        monthlyPassiveIncome0: monthlyPassiveIncome,
                        expenseInflationRate: 0.017,   // 1.7% annual expense inflation
                        activeIncomeGrowthRate: 0.05,  // 5% annual active income growth
                        passiveIncomeGrowthRate: 0.02, // 2% annual passive income growth
                        initialBankBalance: currentSavings,
                        monthlySavingsRate: monthlySavings,
                        lifeEvents: lifeEvents,        // Life events for expense spikes
                        interestRates: {
                                young: 0.06,    // 6% for young adults (updated)
                                middle: 0.06,   // 6% for middle age (updated)  
                                senior: 0.06    // 6% for seniors (updated)
                        }
                };
                
                console.log('📊 Generating projections with user parameters:', projectionParams);
                const rawProjections = calculateFinancialProjections(projectionParams);
                console.log('📊 Raw projections result:', rawProjections);
                
                if (!rawProjections || !rawProjections.projections) {
                        console.error('❌ calculateFinancialProjections returned invalid data:', rawProjections);
                        return null;
                }
                
                // Format the data to match what renderCharts expects
                return {
                        projections: {
                                years_50: rawProjections.projections,
                                years_40: rawProjections.projections.slice(0, 40),
                                years_30: rawProjections.projections.slice(0, 30),
                                years_20: rawProjections.projections.slice(0, 20),
                                years_10: rawProjections.projections.slice(0, 10)
                        },
                        profile: rawProjections.profile,
                        summary: rawProjections.summary
                };
                
        } catch (error) {
                console.error('❌ Error generating user projections:', error);
                return null;
        }
}

// Generate dummy data for initial chart display
function generateDummyGapAnalysis() {
        // Create realistic parameters to showcase all chart colors and stacking
        const projectionParams = {
                currentAge: 28,                    // Start even younger
                retirementAge: 60,                 // Earlier retirement to show transitions
                projectionYears: 85 - 28, // Project until age 85 from starting age 28
                monthlyExpense0: 5500,             // Moderate expenses
                monthlyActiveIncome0: 6500,        // Lower starting active income 
                monthlyPassiveIncome0: 800,        // Higher initial passive income (visible purple stacking)
                expenseInflationRate: 0.017,       // 1.7% annual expense inflation
                activeIncomeGrowthRate: 0.05,      // 5% annual active income growth
                passiveIncomeGrowthRate: 0.02,     // 2% annual passive income growth
                initialBankBalance: 80000,         // Good savings for withdrawal periods
                interestRates: {
                        young: 0.06,    // 6% for ages 20-40 (updated)
                        middle: 0.06,   // 6% for middle age (updated)
                        senior: 0.06    // 6% for ages 60+ (updated)
                }
        };
        
        console.log('🎯 Generating demo gap analysis with visible stacking and all colors');
        return calculateFinancialProjections(projectionParams);
}

// Generate financial projections from actual customer profile data
function generateCustomerGapAnalysis(customerProfile) {
    // Extract customer information from profile
    const age = parseInt(customerProfile?.['Personal Details']?.Age) || 34;
    
    // Extract income (monthly amount)
    let monthlyIncome = 8000; // Default
    if (customerProfile?.['Financial Details']?.Income?.[0]?.Amount) {
        monthlyIncome = parseFloat(customerProfile['Financial Details'].Income[0].Amount);
    }
    
    // Extract expenses (monthly amount)
    let monthlyExpense = 5000; // Default
    if (customerProfile?.['Financial Details']?.Expense?.[0]?.Amount) {
        monthlyExpense = parseFloat(customerProfile['Financial Details'].Expense[0].Amount);
    }
    
    // Extract passive income if available (monthly)
    let monthlyPassiveIncome = 0;
    if (customerProfile?.['Financial Details']?.Assets) {
        // Calculate passive income from assets (simplified calculation)
        customerProfile['Financial Details'].Assets.forEach(asset => {
            const value = asset['Current Value'] || 0;
            const returnRate = asset['Return on Investment'] || 0;
            monthlyPassiveIncome += (value * returnRate) / 12; // Convert annual to monthly
        });
    }
    
    // Estimate initial bank balance from net worth or assets
    let initialBankBalance = 50000; // Default
    if (customerProfile?.['Financial Details']?.Derived?.Total_Networth) {
        // Use 10% of net worth as liquid savings estimate
        initialBankBalance = customerProfile['Financial Details'].Derived.Total_Networth * 0.1;
    }
    
    // Create projection parameters
    const projectionParams = {
        currentAge: age,
        retirementAge: 65, // Default retirement age
        projectionYears: 85 - age, // Project until age 85
        monthlyExpense0: monthlyExpense,
        monthlyActiveIncome0: monthlyIncome,    // Use the new parameter name
        monthlyPassiveIncome0: monthlyPassiveIncome, // Use the new parameter name
        expenseInflationRate: 0.017,           // 1.7% annual expense inflation
        activeIncomeGrowthRate: 0.05,          // 5% annual active income growth
        passiveIncomeGrowthRate: 0.02,         // 2% annual passive income growth
        initialBankBalance: initialBankBalance,
        interestRates: {
            young: 0.06,    // 6% for ages 20-40 (updated)
            middle: 0.06,   // 6% for ages 40-60 (updated)
            senior: 0.06    // 6% for ages 60+ (updated)
        }
    };
    
    console.log('🎯 Generating gap analysis for customer profile:', {
        age: age,
        monthlyIncome: monthlyIncome,
        monthlyExpense: monthlyExpense,
        monthlyPassiveIncome: monthlyPassiveIncome,
        initialBankBalance: initialBankBalance
    });
    
    return calculateFinancialProjections(projectionParams);
}

// Enhanced Financial Projection Function based on provided formulas
function calculateFinancialProjections(params) {
    console.log('🧮 Calculating financial projections with params:', params);
    
    // Extract parameters with defaults
    const {
        currentAge = 34,
        retirementAge = 65,
        deathAge = null,                   // Death age for stopping active income
        lifeExpectancy = 85,               // Life expectancy age
        projectionYears = 85 - 34, // Default: project until age 85 from default age 34
        monthlyExpense0 = 5000,        // Current monthly expense
        monthlyActiveIncome0 = 8000,   // Current monthly active income  
        monthlyPassiveIncome0 = 0,     // Current monthly passive income
        expenseInflationRate = 0.017,   // 1.7% annual expense inflation
        activeIncomeGrowthRate = 0.05, // 5% annual active income growth
        passiveIncomeGrowthRate = 0.02, // 2% annual passive income growth
        initialBankBalance = 50000,    // Starting bank balance
        monthlySavingsRate = 0,        // Monthly savings amount
        lifeEvents = [],               // Life events with age and expense bump
        interestRates = {              // Age-based interest rates (updated to 6%)
            young: 0.06,    // Ages 20-40
            middle: 0.06,   // Ages 40-60  
            senior: 0.06    // Ages 60+
        }
    } = params;
    
    const projections = [];
    let bankBalance = initialBankBalance;
    
    for (let year = 0; year < projectionYears; year++) {
        const age = currentAge + year;
        
        // 3.1 Enhanced Expense Projection with Life Event Spikes
        let baseAnnualExpense = 12 * monthlyExpense0 * Math.pow(1 + expenseInflationRate, year);
        
        // Calculate life event expense bumps
        let lifeEventBump = 0;
        let activeLifeEvents = [];
        
        for (const event of lifeEvents) {
            if (age >= event.age) {
                // Calculate years since the event occurred
                const yearsSinceEvent = age - event.age;
                // Apply inflation to the event bump from the event year
                const inflatedBump = event.monthlyBump * 12 * Math.pow(1 + expenseInflationRate, yearsSinceEvent);
                lifeEventBump += inflatedBump;
                activeLifeEvents.push({
                    ...event,
                    inflatedBump: inflatedBump,
                    yearsSinceEvent: yearsSinceEvent
                });
            }
        }
        
        // Check if person is alive (for income and savings purposes) 
        const isAlive = !deathAge || age < deathAge;
        
        // Expenses continue (base expenses + life events)
        const annualExpense = baseAnnualExpense + lifeEventBump;
        
        // 3.2 Income Projection - Separate Active and Passive with different growth rates
        let annualActiveIncome = 0;
        
        const isWorkingAge = age < retirementAge;
        
        if (isAlive && isWorkingAge) {
            // Active income: 12 × Income_0 × (1 + ActiveIncomeGrowth)^(y)
            annualActiveIncome = 12 * monthlyActiveIncome0 * Math.pow(1 + activeIncomeGrowthRate, year);
        }
        // After retirement or death, active income = 0
        
        // Passive Income continues even after death (investments, pensions for beneficiaries)
        const annualPassiveIncome = 12 * monthlyPassiveIncome0 * Math.pow(1 + passiveIncomeGrowthRate, year);
        
        // 3.3 Net Cashflow per Year - No automatic savings allocation
        const totalIncome = annualActiveIncome + annualPassiveIncome;
        
        // Monthly savings contributions stop after death (person can't contribute)
        const annualSavings = isAlive ? 12 * monthlySavingsRate : 0;
        const netCashflow = totalIncome + annualSavings - annualExpense;
        
        // No automatic savings contribution - all cashflow remains available
        const savingsContribution = 0;
        
        console.log(`📊 Year ${year} (Age ${age}): ${!isAlive ? '💀 DEATH - ' : ''}Active=$${annualActiveIncome.toFixed(0)}, Passive=$${annualPassiveIncome.toFixed(0)}, Savings=$${annualSavings.toFixed(0)}, Total=$${(totalIncome + annualSavings).toFixed(0)}, Expense=$${annualExpense.toFixed(0)}, NetCashflow=$${netCashflow.toFixed(0)}`);
        
        // 3.4 Bank Balance Update - Handle deficits and 6% growth
        // Bank savings remain available for expenses after death
        
        // Track savings withdrawal for chart visualization
        let savingsWithdrawn = 0;
        
        // Handle deficit by withdrawing from bank balance
        if (netCashflow < 0) {
            // Calculate how much we can actually withdraw (limited by available balance)
            const withdrawalNeeded = Math.abs(netCashflow);
            savingsWithdrawn = Math.min(withdrawalNeeded, Math.max(0, bankBalance));
            
            // Deficit: withdraw from bank savings to cover shortfall
            bankBalance += netCashflow; // Add negative amount (subtract)
            console.log(`📊 Year ${year}: ${!isAlive ? '💀 Using bank savings after death - ' : ''}Withdrew $${Math.abs(netCashflow).toFixed(0)} from bank to cover deficit`);
        }
        
        // Savings grow by fixed 6% annually
        bankBalance = bankBalance * (1 + 0.06);
        
        // Check for shortfall (when bank becomes negative)
        const isShortfall = bankBalance < 0;
        
        // Calculate derived values for chart compatibility
        const totalExpenses = annualExpense;
        const housingExpenses = totalExpenses * 0.4;
        const dailyExpenses = totalExpenses * 0.3;
        const medicalExpenses = totalExpenses * 0.15;
        const otherExpenses = totalExpenses * 0.15;
        
        // Estimate CPF and other financial components
        const grossIncome = totalIncome;
        const cpfContribution = annualActiveIncome * 0.2; // 20% CPF on active income only
        const netCashFlow = netCashflow; // Full cashflow available (no automatic savings)
        const liquidAssets = bankBalance; // Show actual bank balance (can be negative after death)
        const cpfBalance = cpfContribution * (year + 1); // Simplified CPF accumulation
        const netWorth = liquidAssets + cpfBalance;
        
        // Investment portfolio simulation (based on full available cashflow)
        const monthlyInvestment = Math.max(0, netCashFlow / 12 * 0.3); // 30% of surplus goes to investments
        const totalInvested = monthlyInvestment * 12 * (year + 1);
        const investmentGains = totalInvested * Math.pow(1.05, year) - totalInvested; // 5% annual return
        const investmentPortfolio = totalInvested + investmentGains;

        // Store projection data with chart-compatible property names
        projections.push({
            year: year,
            age: age,
            // Core financial data
            annualActiveIncome: annualActiveIncome,
            annualPassiveIncome: annualPassiveIncome,
            totalIncome: totalIncome,
            annualExpense: annualExpense,
            baseAnnualExpense: baseAnnualExpense,
            lifeEventBump: lifeEventBump,
            activeLifeEvents: activeLifeEvents,
            annualSavings: annualSavings,
            savingsContribution: savingsContribution,
            netCashflow: netCashflow,
            bankBalance: bankBalance,
            savingsWithdrawn: savingsWithdrawn, // Track actual savings withdrawal for chart
            isShortfall: isShortfall,
            interestRate: 0.06, // Fixed 6% interest rate
            // Chart-compatible properties
            income: grossIncome,
            cpfContribution: cpfContribution,
            netCashFlow: netCashflow,
            liquidAssets: liquidAssets,
            cpfBalance: cpfBalance,
            netWorth: netWorth,
            housingExpenses: housingExpenses,
            dailyExpenses: dailyExpenses,
            medicalExpenses: medicalExpenses,
            otherExpenses: otherExpenses,
            investmentPortfolio: investmentPortfolio,
            totalInvested: totalInvested,
            investmentGains: investmentGains
        });
        
        console.log(`Year ${year} (Age ${age}): Income=$${totalIncome.toFixed(0)}, Expense=$${annualExpense.toFixed(0)}, NetCashflow=$${netCashflow.toFixed(0)}, Bank=$${bankBalance.toFixed(0)}`);
    }
    
    return {
        projections: projections,
        profile: { age: currentAge },
        summary: {
            totalYears: projectionYears,
            retirementAge: retirementAge,
            shortfallYears: projections.filter(p => p.isShortfall).length,
            firstShortfallAge: projections.find(p => p.isShortfall)?.age || null
        }
    };
}

// Enhanced Chart Rendering Function with Capped Stacked Bars
function renderEnhancedWealthChart(data) {
    console.log('📊 Rendering enhanced wealth chart with capped stacked bars');
    console.log('📊 Data received:', data);
    
    // Check if data is valid
    if (!data || !data.projections || !data.projections.years_50) {
        console.error('❌ Invalid data structure received:', data);
        return;
    }
    
    // Get the projections from the correct data structure
    const projections = data.projections.years_50; // Use the 50-year projections
    const currentAge = data.profile.age;
    
    console.log('📊 Projections array length:', projections.length);
    console.log('📊 First projection:', projections[0]);
    
    // Prepare chart data arrays
    const ages = projections.map(p => p.age);
    const expenseLineData = projections.map(p => p.annualExpense);
    
    // Calculate stacked bar data - capped at expense level
    const activeIncomeData = [];
    const passiveIncomeData = [];
    const savingsData = [];
    const shortfallData = [];
    
    projections.forEach(p => {
        const expense = p.annualExpense;
        const activeIncome = p.annualActiveIncome;
        const passiveIncome = p.annualPassiveIncome;
        const totalIncome = activeIncome + passiveIncome;
        
        console.log(`📊 Year ${p.year}: Active=$${activeIncome.toFixed(0)}, Passive=$${passiveIncome.toFixed(0)}, Expense=$${expense.toFixed(0)}, Bank=$${p.bankBalance.toFixed(0)}, SavingsWithdrawn=$${p.savingsWithdrawn.toFixed(0)}`);
        
        if (totalIncome >= expense) {
            // Surplus: show actual income amounts up to expense level
            // Cap the display at expense level for visual clarity
            const scalingFactor = Math.min(1, expense / totalIncome);
            activeIncomeData.push(activeIncome * scalingFactor);
            passiveIncomeData.push(passiveIncome * scalingFactor);
            savingsData.push(0); // No savings withdrawal needed
            shortfallData.push(0);
        } else {
            // Deficit: show how income + savings cover expenses, and any remaining shortfall
            const deficit = expense - totalIncome;
            const savingsUsed = p.savingsWithdrawn; // Use actual withdrawal amount
            const shortfall = deficit - savingsUsed;
            
            activeIncomeData.push(activeIncome);
            passiveIncomeData.push(passiveIncome);
            savingsData.push(savingsUsed);
            shortfallData.push(shortfall);
        }
    });
    
    // Create canvas container
    const container = document.getElementById('analysis-content');
    container.innerHTML = `
        <div style="height: 280px; max-height: 280px;">
            <canvas id="wealthChart"></canvas>
        </div>
    `;
    
    // Destroy existing chart
    const existingChart = Chart.getChart('wealthChart');
    if (existingChart) existingChart.destroy();
    
    // Create stacked bar chart with expense line
    const ctx = document.getElementById('wealthChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ages,
            datasets: [
                {
                    label: 'Active Income',
                    data: activeIncomeData,
                    backgroundColor: '#2563eb', // Bright blue for active income
                    borderWidth: 0,
                    barThickness: 8,
                    stack: 'income'
                },
                {
                    label: 'Passive Income',
                    data: passiveIncomeData,
                    backgroundColor: '#7c3aed', // Purple for passive income
                    borderWidth: 0,
                    barThickness: 8,
                    stack: 'income'
                },
                {
                    label: 'Savings',
                    data: savingsData,
                    backgroundColor: '#10b981', // Green for savings withdrawal
                    borderWidth: 0,
                    barThickness: 8,
                    stack: 'income'
                },
                {
                    label: 'Shortfall',
                    data: shortfallData,
                    backgroundColor: '#dc2626', // Red for shortfall
                    borderWidth: 0,
                    barThickness: 8,
                    stack: 'income'
                },
                {
                    type: 'line',
                    label: 'Annual Expenses',
                    data: expenseLineData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        usePointStyle: true,
                        pointStyle: function(context) {
                            return context.datasetIndex === 4 ? 'line' : 'rect';
                        },
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 4) {
                                // Expense line
                                const value = context.parsed.y;
                                return 'Expenses: $' + value.toLocaleString();
                            } else {
                                // Stacked bar data
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                if (value === 0) return null;
                                return label + ': $' + value.toLocaleString();
                            }
                        },
                        footer: function(items) {
                            const dataIndex = items[0].dataIndex;
                            const projection = projections[dataIndex];
                            
                            const totalIncome = projection.totalIncome;
                            const expense = projection.annualExpense;
                            const surplus = totalIncome - expense;
                            
                            return [
                                `Total Income: $${totalIncome.toLocaleString()}`,
                                `Annual Expenses: $${expense.toLocaleString()}`,
                                `Net: ${surplus >= 0 ? '+' : ''}$${surplus.toLocaleString()}`,
                                surplus >= 0 ? '✅ Surplus Year' : '⚠️ Shortfall Year'
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Age',
                        font: { size: 11, weight: 'bold' },
                        color: '#64748b'
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 20,
                        color: '#64748b',
                        font: { size: 9 }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { 
                        color: '#f1f5f9',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Annual Amount ($)',
                        font: { size: 11, weight: 'bold' },
                        color: '#64748b'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                            return '$' + value.toLocaleString();
                        },
                        color: '#64748b',
                        font: { size: 9 }
                    }
                }
            }
        }
    });
}

function renderCharts(data, years) {
        // Get data for selected period
        let projections = data.projections.years_50;
        if (years === 10) projections = data.projections.years_10;
        else if (years === 20) projections = data.projections.years_20;
        else if (years === 30) projections = data.projections.years_30;
        else if (years === 40) projections = data.projections.years_40;
        
        const labels = projections.map(p => `Year ${p.year}`);
        
        // Destroy existing charts
        if (cumulativeChart) cumulativeChart.destroy();
        if (incomeChart) incomeChart.destroy();
        if (expensesChart) expensesChart.destroy();
        if (investmentChart) investmentChart.destroy();
        
        // Common chart options
        const commonOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: {
                                position: 'top',
                                labels: {
                                        usePointStyle: true,
                                        padding: 12,
                                        font: { size: 11 }
                                }
                        },
                        tooltip: {
                                mode: 'index',
                                intersect: false,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                titleColor: '#0f172a',
                                bodyColor: '#475569',
                                borderColor: '#e2e8f0',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: true,
                                callbacks: {
                                        label: function(context) {
                                                let label = context.dataset.label || '';
                                                if (label) label += ': ';
                                                if (context.parsed.y !== null) {
                                                        label += '$' + context.parsed.y.toLocaleString();
                                                }
                                                return label;
                                        }
                                }
                        }
                },
                scales: {
                        y: {
                                beginAtZero: true,
                                grid: { color: '#f1f5f9' },
                                ticks: {
                                        callback: function(value) {
                                                if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                                                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                                                return '$' + value;
                                        },
                                        color: '#64748b',
                                        font: { size: 10 }
                                }
                        },
                        x: {
                                grid: { display: false },
                                ticks: {
                                        maxRotation: 45,
                                        minRotation: 0,
                                        color: '#64748b',
                                        font: { size: 10 }
                                }
                        }
                }
        };
        
        // 1. Cumulative Overview Chart
        const ctxCumulative = document.getElementById('cumulativeChart');
        if (ctxCumulative) {
                cumulativeChart = new Chart(ctxCumulative, {
        type: 'line',
        data: {
                                labels: labels,
            datasets: [
                {
                                                label: 'Total Net Worth',
                                                data: projections.map(p => p.netWorth),
                                                borderColor: '#3b82f6',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 3,
                                                pointRadius: 0,
                                                pointHoverRadius: 6
                                        },
                                        {
                                                label: 'CPF Balance',
                                                data: projections.map(p => p.cpfBalance),
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: false,
                    tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 6
                                        },
                                        {
                                                label: 'Liquid Assets',
                                                data: projections.map(p => p.liquidAssets),
                                                borderColor: '#8b5cf6',
                                                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    fill: false,
                    tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 6
                }
            ]
        },
        options: {
                                ...commonOptions,
            plugins: {
                                        ...commonOptions.plugins,
                title: {
                    display: true,
                                                text: `📊 Cumulative Wealth Overview - ${years} Years`,
                                                font: { size: 16, weight: 'bold' },
                                                color: '#0f172a',
                                                padding: { top: 10, bottom: 20 }
                                        },
                                        subtitle: {
                        display: true,
                                                text: 'Net Worth = CPF Balance + Liquid Assets (Investments & Savings)',
                                                font: { size: 12 },
                                                color: '#64748b',
                                                padding: { bottom: 10 }
                                        }
            }
        }
    });
}

        // 2. Income Chart
        const ctxIncome = document.getElementById('incomeChart');
        if (ctxIncome) {
                incomeChart = new Chart(ctxIncome, {
                        type: 'line',
                        data: {
                                labels: labels,
                                datasets: [
                                        {
                                                label: 'Gross Income',
                                                data: projections.map(p => p.income),
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 2.5,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: 'CPF Contribution',
                                                data: projections.map(p => p.cpfContribution),
                                                borderColor: '#f59e0b',
                                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                borderDash: [5, 5],
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: 'Net Cash Flow',
                                                data: projections.map(p => Math.max(0, p.netCashFlow)),
                                                borderColor: '#3b82f6',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        }
                                ]
                        },
                        options: {
                                ...commonOptions,
                                plugins: {
                                        ...commonOptions.plugins,
                    title: {
                        display: true,
                                                text: '💰 Income & Cash Flow',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a',
                                                padding: { bottom: 10 }
                                        },
                                        subtitle: {
                                                display: true,
                                                text: 'Growing at 3% annually (SG wage growth)',
                                                font: { size: 11 },
                                                color: '#64748b'
                                        }
            }
        }
    });
}

        // 3. Expenses Chart (Pure expenses - NO investments)
        const ctxExpenses = document.getElementById('expensesChart');
        if (ctxExpenses) {
                expensesChart = new Chart(ctxExpenses, {
                        type: 'bar',
        data: {
                                labels: labels.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0),
            datasets: [
                {
                                                label: 'Housing (40%)',
                                                data: projections.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0).map(p => p.housingExpenses),
                                                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                                borderColor: '#ef4444',
                                                borderWidth: 1
                                        },
                                        {
                                                label: 'Daily Living (30%)',
                                                data: projections.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0).map(p => p.dailyExpenses),
                                                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                                                borderColor: '#f59e0b',
                                                borderWidth: 1
                                        },
                                        {
                                                label: 'Medical (15%)',
                                                data: projections.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0).map(p => p.medicalExpenses),
                                                backgroundColor: 'rgba(236, 72, 153, 0.7)',
                                                borderColor: '#ec4899',
                                                borderWidth: 1
                                        },
                                        {
                                                label: 'Others (15%)',
                                                data: projections.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0).map(p => p.otherExpenses),
                                                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                                                borderColor: '#8b5cf6',
                                                borderWidth: 1
                }
            ]
        },
        options: {
                                ...commonOptions,
            plugins: {
                                        ...commonOptions.plugins,
                title: {
                    display: true,
                                                text: '💸 Annual Expenses Breakdown',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a',
                                                padding: { bottom: 10 }
                                        },
                                        subtitle: {
                                                display: true,
                                                text: 'Housing 2% | Daily 2.5% | Medical 4.5% | Others 2.5%',
                                                font: { size: 10 },
                                                color: '#64748b'
                }
            },
            scales: {
                                        ...commonOptions.scales,
                                        x: {
                                                stacked: true,
                                                grid: { display: false },
                                                ticks: {
                                                        color: '#64748b',
                                                        font: { size: 10 }
                                                }
                                        },
                                        y: {
                                                stacked: true,
                    beginAtZero: true,
                                                grid: { color: '#f1f5f9' },
                    ticks: {
                        callback: function(value) {
                                                                if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                                                                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                                                                return '$' + value;
                                                        },
                                                        color: '#64748b',
                                                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

        // 4. Investment Growth Chart (Shows compound returns)
        const ctxInvestment = document.getElementById('investmentChart');
        if (ctxInvestment) {
                investmentChart = new Chart(ctxInvestment, {
        type: 'line',
        data: {
                                labels: labels,
            datasets: [
                {
                                                label: 'Portfolio Value',
                                                data: projections.map(p => p.investmentPortfolio),
                                                borderColor: '#8b5cf6',
                                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: true,
                                                tension: 0.4,
                                                borderWidth: 3,
                                                pointRadius: 0,
                                                pointHoverRadius: 6
                                        },
                                        {
                                                label: 'Total Contributions',
                                                data: projections.map(p => p.totalInvested),
                                                borderColor: '#3b82f6',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                borderDash: [5, 5],
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: 'Investment Gains',
                                                data: projections.map(p => p.investmentGains),
                                                borderColor: '#10b981',
                                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                borderDash: [3, 3],
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                }
            ]
        },
        options: {
                                ...commonOptions,
            plugins: {
                                        ...commonOptions.plugins,
                title: {
                    display: true,
                                                text: '📈 Investment Portfolio Growth',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a',
                                                padding: { bottom: 10 }
                                        },
                                        subtitle: {
                                                display: true,
                                                text: 'Portfolio = Contributions + Gains | Returns: Conservative 4% | Balanced 5% | Aggressive 7%',
                                                font: { size: 10 },
                                                color: '#64748b'
                }
            }
        }
    });
}
}

let scenarioIncomeChart = null;
let scenarioExpensesChart = null;
let scenarioSavingsChart = null;
let selectedScenario = null;

async function loadScenarios() {
        const container = document.getElementById('scenarios-content');
        
        // Show loading
        container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px;">
                        <div style="width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                        <div style="color: #64748b; font-size: 16px; font-weight: 500;">Loading scenarios...</div>
        </div>
    `;
        
        try {
                const response = await fetch(`/api/scenarios?sessionId=${sessionId}`);
                const data = await response.json();
                
                if (response.ok) {
                        renderScenarios(data);
                } else {
                        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">Unable to load scenarios. Please complete your profile first.</p>';
                }
        } catch (error) {
                console.error('Error loading scenarios:', error);
                container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 40px;">Error loading scenarios.</p>';
        }
}

function renderScenarios(data) {
    const container = document.getElementById('scenarios-content');
    
    container.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 24px;">🎯</div>
                        <div style="flex: 1;">
                                <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">What-If Scenarios</div>
                                <div style="font-size: 14px; color: #b45309;">Test different life events and see how they impact your financial future</div>
        </div>
                </div>
                
                <!-- Scenario Buttons -->
                <div class="scenario-selector" style="margin-bottom: 32px;">
            ${data.scenarios.map(scenario => `
                                <button class="scenario-btn ${scenario.id === 'baseline' ? 'active' : ''}" data-scenario="${scenario.id}">
                                        <div style="font-size: 24px; margin-bottom: 4px;">${scenario.icon}</div>
                                        <div style="font-weight: 600; font-size: 14px;">${scenario.name}</div>
                </button>
            `).join('')}
        </div>
                
                <!-- Scenario Details -->
                <div id="scenario-details" style="margin-bottom: 24px;"></div>
                
                <!-- Three Key Comparison Charts -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px; margin-bottom: 24px;">
                        <!-- Income Chart -->
                        <div class="chart-container" style="height: 400px;">
                                <canvas id="scenarioIncomeChart"></canvas>
        </div>
                        <!-- Expenses Chart -->
                        <div class="chart-container" style="height: 400px;">
                                <canvas id="scenarioExpensesChart"></canvas>
                        </div>
                        <!-- Savings/Investments Chart -->
                        <div class="chart-container" style="height: 400px;">
                                <canvas id="scenarioSavingsChart"></canvas>
                        </div>
                </div>
                
                <!-- Impact Summary -->
                <div id="scenario-impact"></div>
                
                <!-- Insurance Recommendations Section -->
                <div id="insurance-section" style="margin-top: 32px;"></div>
        `;
        
        // Add scenario button listeners
        document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
                        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
                        const scenarioId = btn.dataset.scenario;
                        const scenario = data.scenarios.find(s => s.id === scenarioId);
                        selectedScenario = scenario;
                        renderScenarioComparison(scenario, data.baseline);
        });
    });
    
    // Load baseline by default
        const baselineScenario = data.scenarios.find(s => s.id === 'baseline');
        if (baselineScenario) {
                selectedScenario = baselineScenario;
                renderScenarioComparison(baselineScenario, data.baseline);
        }
}

function renderScenarioComparison(scenario, baseline) {
        // Update scenario details
        const detailsEl = document.getElementById('scenario-details');
        if (detailsEl) {
                const typeColors = {
                        positive: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
                        neutral: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
                        moderate: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
                        negative: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
                };
                const colors = typeColors[scenario.type] || typeColors.neutral;
                
                detailsEl.innerHTML = `
                        <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 20px;">
                                <div style="display: flex; align-items: start; gap: 16px; margin-bottom: 16px;">
                                        <div style="font-size: 40px;">${scenario.icon}</div>
                                        <div style="flex: 1;">
                                                <h3 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 20px;">${scenario.name}</h3>
                                                <p style="margin: 0; color: ${colors.text}; opacity: 0.9; line-height: 1.6;">${scenario.description}</p>
                                        </div>
                                </div>
    
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid ${colors.border};">
                                        ${Object.entries(scenario.changes).map(([key, value]) => `
                                                <div style="text-align: center;">
                                                        <div style="font-size: 11px; text-transform: uppercase; color: ${colors.text}; opacity: 0.7; margin-bottom: 4px;">${key}</div>
                                                        <div style="font-size: 16px; font-weight: 700; color: ${colors.text};">${value}</div>
                                                </div>
                                        `).join('')}
                                </div>
                        </div>
                `;
        }
        
        // Destroy existing charts
        if (scenarioIncomeChart) scenarioIncomeChart.destroy();
        if (scenarioExpensesChart) scenarioExpensesChart.destroy();
        if (scenarioSavingsChart) scenarioSavingsChart.destroy();
        
        const baselineData = baseline.projections.years_50;
        const scenarioData = scenario.analysis.projections.years_50;
        const labels = baselineData.map(p => `Year ${p.year}`);
        
        // Common chart options for comparison charts
        const comparisonOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: {
                                position: 'top',
                                labels: {
                                        usePointStyle: true,
                                        padding: 10,
                                        font: { size: 11 }
                                }
                        },
                        tooltip: {
                                mode: 'index',
                                intersect: false,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                titleColor: '#0f172a',
                                bodyColor: '#475569',
                                borderColor: '#e2e8f0',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: true,
                                callbacks: {
                                        label: function(context) {
                                                let label = context.dataset.label || '';
                                                if (label) label += ': ';
                                                if (context.parsed.y !== null) {
                                                        label += '$' + context.parsed.y.toLocaleString();
                                                }
                                                return label;
                                        },
                                        afterBody: function(context) {
                                                if (context.length === 2) {
                                                        const diff = context[1].parsed.y - context[0].parsed.y;
                                                        const pct = ((diff / context[0].parsed.y) * 100).toFixed(1);
                                                        return [``, `Difference: ${diff >= 0 ? '+' : ''}$${diff.toLocaleString()} (${diff >= 0 ? '+' : ''}${pct}%)`];
                                                }
                                                return '';
                                        }
                                }
                        }
                },
                scales: {
                        y: {
                                beginAtZero: true,
                                grid: { color: '#f1f5f9' },
                                ticks: {
                                        callback: function(value) {
                                                if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                                                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                                                return '$' + value;
                                        },
                                        color: '#64748b',
                                        font: { size: 10 }
                                }
                        },
                        x: {
                                grid: { display: false },
                                ticks: {
                                        maxRotation: 45,
                                        minRotation: 0,
                                        color: '#64748b',
                                        font: { size: 9 }
                                }
                        }
                }
        };
        
        // 1. Income Comparison Chart
        const ctxIncome = document.getElementById('scenarioIncomeChart');
        if (ctxIncome) {
                scenarioIncomeChart = new Chart(ctxIncome, {
        type: 'line',
        data: {
                                labels: labels,
            datasets: [
                {
                                                label: 'Baseline Income',
                                                data: baselineData.map(p => p.income),
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: `${scenario.name} Income`,
                                                data: scenarioData.map(p => p.income),
                                                borderColor: scenario.type === 'positive' ? '#10b981' : scenario.type === 'critical' ? '#ef4444' : '#f59e0b',
                                                backgroundColor: scenario.type === 'positive' ? 'rgba(16, 185, 129, 0.15)' : scenario.type === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 2.5,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                }
            ]
        },
        options: {
                                ...comparisonOptions,
            plugins: {
                                        ...comparisonOptions.plugins,
                title: {
                    display: true,
                                                text: '💰 Income Comparison',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a'
                                        }
                                }
                        }
                });
        }
        
        // 2. Expenses Comparison Chart
        const ctxExpenses = document.getElementById('scenarioExpensesChart');
        if (ctxExpenses) {
                scenarioExpensesChart = new Chart(ctxExpenses, {
                        type: 'line',
                        data: {
                                labels: labels,
                                datasets: [
                                        {
                                                label: 'Baseline Expenses',
                                                data: baselineData.map(p => p.expenses),
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: `${scenario.name} Expenses`,
                                                data: scenarioData.map(p => p.expenses),
                                                borderColor: scenario.type === 'positive' ? '#10b981' : scenario.type === 'critical' ? '#ef4444' : '#f59e0b',
                                                backgroundColor: scenario.type === 'positive' ? 'rgba(16, 185, 129, 0.15)' : scenario.type === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 2.5,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        }
                                ]
                        },
                        options: {
                                ...comparisonOptions,
                                plugins: {
                                        ...comparisonOptions.plugins,
                                        title: {
                                                display: true,
                                                text: '💸 Expenses Comparison',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a'
                                        }
                                }
                        }
                });
        }
        
        // 3. Savings/Investments Comparison Chart
        const ctxSavings = document.getElementById('scenarioSavingsChart');
        if (ctxSavings) {
                scenarioSavingsChart = new Chart(ctxSavings, {
                        type: 'line',
                        data: {
                                labels: labels,
                                datasets: [
                                        {
                                                label: 'Baseline Portfolio',
                                                data: baselineData.map(p => p.investmentPortfolio),
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                fill: false,
                                                tension: 0.4,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        },
                                        {
                                                label: `${scenario.name} Portfolio`,
                                                data: scenarioData.map(p => p.investmentPortfolio),
                                                borderColor: scenario.type === 'positive' ? '#10b981' : scenario.type === 'critical' ? '#ef4444' : '#f59e0b',
                                                backgroundColor: scenario.type === 'positive' ? 'rgba(16, 185, 129, 0.15)' : scenario.type === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 2.5,
                                                pointRadius: 0,
                                                pointHoverRadius: 5
                                        }
                                ]
                        },
                        options: {
                                ...comparisonOptions,
                                plugins: {
                                        ...comparisonOptions.plugins,
                                        title: {
                                                display: true,
                                                text: '📈 Savings/Investments Comparison',
                                                font: { size: 14, weight: 'bold' },
                                                color: '#0f172a'
                                        },
                                        subtitle: {
                                                display: true,
                                                text: 'Shows impact on investment portfolio growth',
                                                font: { size: 11 },
                                                color: '#64748b'
                                        }
            }
        }
    });
}

        // Render insurance recommendation section
        renderInsuranceSection(scenario);
        
        // Update impact summary
        const impactEl = document.getElementById('scenario-impact');
        if (impactEl) {
                const impactColor = scenario.impact_20yr >= 0 ? '#10b981' : '#ef4444';
                const impactBg = scenario.impact_20yr >= 0 ? '#d1fae5' : '#fee2e2';
                
                impactEl.innerHTML = `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                                <h4 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">Financial Impact Analysis</h4>
    
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                                        <!-- 10 Year Impact -->
                                        <div style="background: ${impactBg}; border: 1px solid ${impactColor}; border-radius: 10px; padding: 16px; text-align: center;">
                                                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">10-Year Impact</div>
                                                <div style="font-size: 28px; font-weight: 700; color: ${impactColor};">
                                                        ${scenario.impact_10yr >= 0 ? '+' : ''}$${Math.round(scenario.impact_10yr / 1000)}K
                </div>
                                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                                                        ${scenario.impact_10yr >= 0 ? 'Better' : 'Worse'} than baseline
                </div>
                                        </div>
                                        
                                        <!-- 20 Year Impact -->
                                        <div style="background: ${impactBg}; border: 1px solid ${impactColor}; border-radius: 10px; padding: 16px; text-align: center;">
                                                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">20-Year Impact</div>
                                                <div style="font-size: 28px; font-weight: 700; color: ${impactColor};">
                                                        ${scenario.impact_20yr >= 0 ? '+' : ''}$${Math.round(scenario.impact_20yr / 1000)}K
                                                </div>
                                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                                                        ${scenario.impact_20yr >= 0 ? 'Better' : 'Worse'} than baseline
                                                </div>
                                        </div>
                                        
                                        <!-- 50 Year Impact -->
                                        <div style="background: ${impactBg}; border: 1px solid ${impactColor}; border-radius: 10px; padding: 16px; text-align: center;">
                                                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">50-Year Impact</div>
                                                <div style="font-size: 28px; font-weight: 700; color: ${impactColor};">
                                                        ${scenario.impact_50yr >= 0 ? '+' : ''}$${(scenario.impact_50yr / 1000000).toFixed(1)}M
                                                </div>
                                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                                                        ${scenario.impact_50yr >= 0 ? 'Better' : 'Worse'} than baseline
                                                </div>
                                        </div>
                                </div>
                                
                                <!-- Explanation -->
                                <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 10px;">
                                        <h5 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">What This Means:</h5>
                                        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                                ${getScenarioExplanation(scenario, baseline)}
                                        </p>
            </div>
        </div>
    `;
        }
}

function renderInsuranceSection(scenario) {
        const insuranceEl = document.getElementById('insurance-section');
        if (!insuranceEl) return;
        
        insuranceEl.innerHTML = `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div>
                                        <h4 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">🛡️ Life Insurance Coverage Needed</h4>
                                        <p style="margin: 0; font-size: 14px; color: #64748b;">Based on <strong>${scenario.name}</strong> scenario</p>
                                </div>
                        </div>
                        
                        <!-- Coverage Period Selector -->
                        <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">
                                        Coverage Period (Years):
                                </label>
                                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                        <button class="coverage-year-btn" data-years="10">10 Years</button>
                                        <button class="coverage-year-btn active" data-years="20">20 Years</button>
                                        <button class="coverage-year-btn" data-years="25">25 Years</button>
                                        <button class="coverage-year-btn" data-years="30">30 Years</button>
                                        <button class="coverage-year-btn" data-years="40">40 Years</button>
                                </div>
        </div>
        
                        <!-- Calculate Button -->
                        <button id="calculateInsuranceBtn" style="
                                background: linear-gradient(135deg, #3b82f6, #60a5fa);
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 10px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                                transition: all 0.2s ease;
                                width: 100%;
                        ">
                                📊 Calculate Insurance Needs for ${scenario.name}
                        </button>
                        
                        <!-- Results Container -->
                        <div id="insurance-results" style="margin-top: 24px;"></div>
                </div>
        `;
        
        // Add coverage year button listeners
        document.querySelectorAll('.coverage-year-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                        document.querySelectorAll('.coverage-year-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                });
        });
        
        // Add calculate button listener
        document.getElementById('calculateInsuranceBtn').addEventListener('click', () => {
                const selectedYears = parseInt(document.querySelector('.coverage-year-btn.active').dataset.years);
                loadInsuranceRecommendations(scenario.id, selectedYears);
        });
}

async function loadInsuranceRecommendations(scenarioId, years) {
        const resultsEl = document.getElementById('insurance-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #64748b;">
                        <div style="width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
                        Calculating coverage needs...
                </div>
        `;
        
        try {
                const response = await fetch('/api/insurance-recommendation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId, scenario: scenarioId, years })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                        renderInsuranceRecommendations(data);
                } else {
                        resultsEl.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">Unable to load recommendations</p>';
                }
        } catch (error) {
                console.error('Error loading insurance:', error);
                resultsEl.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">Error loading recommendations</p>';
        }
}

function renderInsuranceRecommendations(data) {
        const resultsEl = document.getElementById('insurance-results');
        if (!resultsEl) return;
        
        const { coverage, products, summary } = data;
        
        resultsEl.innerHTML = `
                <!-- Coverage Summary -->
                <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h5 style="margin: 0 0 16px 0; font-size: 16px; color: #1e40af;">📋 Recommended Coverage</h5>
                        <div style="font-size: 32px; font-weight: 700; color: #1e40af; margin-bottom: 16px;">
                                $${coverage.totalCoverage.toLocaleString()}
                </div>
                        <div style="font-size: 13px; color: #1d4ed8;">For ${coverage.years} years of protection</div>
                        
                        <!-- Coverage Breakdown -->
                        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #3b82f6;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 13px;">
                                        <div>
                                                <div style="color: #64748b; margin-bottom: 4px;">Income Replacement</div>
                                                <div style="font-weight: 600; color: #1e40af;">$${coverage.breakdown.incomeReplacement.toLocaleString()}</div>
                                        </div>
                                        <div>
                                                <div style="color: #64748b; margin-bottom: 4px;">Education Fund</div>
                                                <div style="font-weight: 600; color: #1e40af;">$${coverage.breakdown.educationFund.toLocaleString()}</div>
                                        </div>
                                        <div>
                                                <div style="color: #64748b; margin-bottom: 4px;">Mortgage Debt</div>
                                                <div style="font-weight: 600; color: #1e40af;">$${coverage.breakdown.outstandingMortgage.toLocaleString()}</div>
                                        </div>
                                        <div>
                                                <div style="color: #64748b; margin-bottom: 4px;">Emergency Buffer</div>
                                                <div style="font-weight: 600; color: #1e40af;">$${coverage.breakdown.emergencyBuffer.toLocaleString()}</div>
                                        </div>
                                        ${coverage.breakdown.scenarioBuffer > 0 ? `
                                                <div>
                                                        <div style="color: #64748b; margin-bottom: 4px;">Scenario Buffer</div>
                                                        <div style="font-weight: 600; color: #1e40af;">$${coverage.breakdown.scenarioBuffer.toLocaleString()}</div>
                                                </div>
                                        ` : ''}
                                        <div>
                                                <div style="color: #64748b; margin-bottom: 4px;">Less: Current Savings</div>
                                                <div style="font-weight: 600; color: #ef4444;">-$${coverage.breakdown.currentSavings.toLocaleString()}</div>
                                        </div>
                                </div>
            </div>
        </div>
        
                <!-- Product Recommendations -->
                <div>
                        <h5 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">💼 Recommended Term Life Insurance Plans</h5>
                        <div style="display: grid; gap: 16px;">
                                ${products.map((product, index) => `
                                        <div style="
                                                background: ${index === 0 ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'white'}; 
                                                border: 2px solid ${index === 0 ? '#10b981' : '#e2e8f0'}; 
                                                border-radius: 12px; 
                                                padding: 20px;
                                                position: relative;
                                        ">
                                                ${index === 0 ? `
                                                        <div style="position: absolute; top: -10px; right: 20px; background: #10b981; color: white; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                                                                BEST VALUE
                                </div>
                                                ` : ''}
                                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                                        <div>
                                                                <h6 style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a; font-weight: 700;">${product.name}</h6>
                                                                <div style="font-size: 12px; color: #64748b; font-weight: 600;">${product.provider}</div>
                                    </div>
                                                        <div style="text-align: right;">
                                                                <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">$${product.monthly_premium}</div>
                                                                <div style="font-size: 11px; color: #64748b;">/month</div>
                                    </div>
                                    </div>
                                                
                                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.6); border-radius: 8px;">
                                                        <div>
                                                                <div style="font-size: 11px; color: #64748b;">Coverage</div>
                                                                <div style="font-size: 14px; font-weight: 600; color: #0f172a;">$${(product.recommended_coverage / 1000000).toFixed(1)}M</div>
                                    </div>
                                                        <div>
                                                                <div style="font-size: 11px; color: #64748b;">Annual Premium</div>
                                                                <div style="font-size: 14px; font-weight: 600; color: #0f172a;">$${product.annual_premium.toLocaleString()}</div>
                                </div>
                                                        <div>
                                                                <div style="font-size: 11px; color: #64748b;">Cost per $100K</div>
                                                                <div style="font-size: 14px; font-weight: 600; color: #0f172a;">$${product.cost_per_100k}</div>
                            </div>
                                                        <div>
                                                                <div style="font-size: 11px; color: #64748b;">Renewable Until</div>
                                                                <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${product.renewable ? `Age ${product.renewable_age}` : 'Non-renewable'}</div>
                                                        </div>
                                                </div>
                                                
                                                <div style="margin-bottom: 12px;">
                                                        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Features:</div>
                                                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                                                ${product.features.map(feature => `
                                                                        <span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500;">
                                                                                ✓ ${feature}
                                                                        </span>
                        `).join('')}
                    </div>
                                                </div>
                                                
                                                ${product.suitability ? `
                                                        <div style="font-size: 12px; color: #64748b; font-style: italic; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                                                                ${product.suitability}
                                                        </div>
                                                ` : ''}
                </div>
            `).join('')}
                        </div>
        </div>
    `;
}

function getScenarioExplanation(scenario, baseline) {
        const baselineNW20 = baseline.summary.projectedNetWorth_20;
        const scenarioNW20 = scenario.analysis.summary.projectedNetWorth_20;
        const diff = scenarioNW20 - baselineNW20;
        const pctChange = ((diff / baselineNW20) * 100).toFixed(1);
        
        if (scenario.id === 'baseline') {
                return `This is your current financial plan. The three charts above show how your <strong>income grows</strong> (3% annually), <strong>expenses increase</strong> (category-specific inflation), and <strong>investments compound</strong> over time with your current settings.`;
        }
        
        if (scenario.id === 'career_growth') {
                return `<strong>Income boost:</strong> With a 30% raise, you earn significantly more each year. <strong>Lifestyle inflation:</strong> Expenses rise 15% but remain controlled. <strong>Investment power:</strong> 60% higher contributions compound to ${diff >= 0 ? '+' : ''}$${Math.round(diff / 1000)}K extra wealth in 20 years. The charts clearly show how income growth drives portfolio gains.`;
        }
        
        if (scenario.id === 'job_loss') {
                return `<strong>Income stops completely</strong> during unemployment. <strong>Expenses remain constant</strong> - you still need housing, food, etc. <strong>Savings depletes rapidly</strong> as you have no investments and withdraw reserves monthly. This ${Math.abs(diff / 1000).toFixed(0)}K impact shows why a 6-12 month emergency fund is critical.`;
        }
        
        if (scenario.id === 'medical') {
                return `<strong>Income continues</strong> as you keep working. <strong>Expenses spike 50%</strong> with medical bills, ongoing treatment, and medications. <strong>Investments stop</strong> as available cash goes to healthcare. The $80K immediate expense plus higher ongoing costs result in ${Math.abs(diff / 1000).toFixed(0)}K less wealth over 20 years - highlighting the need for comprehensive health insurance.`;
        }
        
        if (scenario.id === 'new_dependent') {
                return `<strong>Income stays stable</strong> with your current job. <strong>Expenses jump 40%</strong> with childcare ($1,200-2,000/mo in Singapore), diapers, formula, and medical. <strong>Investments cut in half</strong> due to reduced discretionary income. The charts show how a new child impacts each area differently, with long-term ${Math.abs(diff / 1000).toFixed(0)}K impact on wealth accumulation.`;
        }
        
        if (scenario.id === 'aggressive_savings') {
                return `<strong>Income unchanged</strong> - same job. <strong>Expenses slashed 35%</strong> through minimalist living (smaller home, public transport, home cooking). <strong>Investments triple</strong> by redirecting expense savings. The charts demonstrate the power of frugality: ${diff >= 0 ? '+' : ''}$${Math.round(diff / 1000)}K extra in 20 years, accelerating to ${(scenario.impact_50yr / 1000000).toFixed(1)}M by year 50!`;
        }
        
        if (scenario.id === 'recession') {
                return `<strong>Income drops 20%</strong> from pay cuts. <strong>Expenses rise 15%</strong> due to inflation. <strong>Investments reduced 60%</strong> as available cash shrinks. Starting savings also drops 25% from portfolio losses. This triple-impact shows why economic downturns are severe: ${Math.abs(diff / 1000).toFixed(0)}K less wealth in 20 years from the combined effect on all three metrics.`;
        }
        
        return `This scenario shows a <strong>${pctChange}% change</strong> in projected wealth over 20 years.`;
}

// Auto-start on page load with user interaction for audio
window.addEventListener('DOMContentLoaded', async () => {
    wireControls();
    
    // Show "Not enough data" message instead of dummy chart on page load
    const container = document.getElementById('analysis-content');
    if (container) {
        container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 60px 20px;"><div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">Not Enough Data</div><div style="font-size: 12px;">Update your expenses to see financial projections</div></div>';
    }
    
    // Wire tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Wire audio upload button
    const uploadBtn = document.getElementById('uploadAudioBtn');
    const audioUpload = document.getElementById('audioUpload');
    
    // Connect upload button to file input
    if (uploadBtn && audioUpload) {
        uploadBtn.addEventListener('click', () => {
            audioUpload.click();
        });
        
        audioUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!sessionId) {
                toast('❌ Please start a session first');
                return;
            }
            
            setTextIfPresent('recIndicator', 'Processing...');
            toast('📤 Uploading audio file...');
            
            const fd = new FormData();
            fd.append('sessionId', sessionId);
            fd.append('audio', file);
            
            try {
                const res = await fetch('/api/ingest-audio', { method: 'POST', body: fd });
                const data = await res.json();
                
                appendMessage('user', data.transcript || '[Audio uploaded]');
                if (data.assistantText) appendMessage('assistant', data.assistantText);
                if (data.profile) updateProfileUI(data.profile, data.currentStep, data.completed);
                
                if (data.audio) playAudio(data.audio);
                setTextIfPresent('recIndicator', 'Ready');
                toast('✅ Audio processed successfully!');
            } catch (err) {
                console.error('Audio upload error:', err);
                toast('❌ Failed to process audio file');
                setTextIfPresent('recIndicator', 'Error');
            }
            
            // Reset file input
            e.target.value = '';
        });
    }
    
    // Start session silently without welcome messages
    initSession().catch(e => {
        console.error('Session start failed:', e);
        // toast('❌ Failed to start session. Please refresh the page.'); // Error toast removed
        setTextIfPresent('status_badge', 'Error');
        setTextIfPresent('recIndicator', 'Error');
    });
});

// Audio Player Functions
function initAudioPlayer() {
    const audio = document.getElementById('agentAudio');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    const waveAnimation = document.getElementById('waveAnimation');
    
    console.log('Initializing audio player...', { audio, playBtn, pauseBtn, stopBtn, timeDisplay, waveAnimation });
    
    if (!audio || !playBtn || !pauseBtn || !stopBtn) {
        console.error('Audio player elements not found:', { audio, playBtn, pauseBtn, stopBtn });
        return;
    }
    
    // Audio error handling
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        console.error('Audio error code:', audio.error?.code);
        console.error('Audio error message:', audio.error?.message);
    });
    
    audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
    });
    
    audio.addEventListener('canplay', () => {
        console.log('Audio can play', { duration: audio.duration });
    });
    
    // Play button
    playBtn.addEventListener('click', async () => {
        console.log('Play button clicked');
        try {
            // Force load the audio if not loaded
            if (audio.readyState < 2) {
                console.log('Loading audio...');
                audio.load();
                await new Promise((resolve) => {
                    audio.addEventListener('canplay', resolve, { once: true });
                });
            }
            
            console.log('Playing audio...', { currentTime: audio.currentTime, duration: audio.duration });
            await audio.play();
            
            if (waveAnimation) {
                waveAnimation.className = 'audio-playing';
                waveAnimation.style.display = 'flex';
            }
            
            // Auto-enable transcript synchronization when play is clicked
            if (conversationTranscript.length > 0) {
                if (!isTranscriptSyncEnabled) {
                    isTranscriptSyncEnabled = true;
                    console.log('🎯 Transcript synchronization enabled/resumed on play');
                }
                
                // If resuming from pause, don't clear messages - just continue sync
                if (audio.currentTime === 0) {
                    // Starting fresh - clear previous messages
                    displayedTranscriptIndices.clear();
                    clearChatMessages();
                    console.log('🎯 Starting fresh transcript sync');
                } else {
                    // Resuming from pause - keep existing messages
                    console.log('🎯 Resuming transcript sync from', audio.currentTime.toFixed(1), 'seconds');
                }
            }
            
            console.log('Audio playing successfully');
        } catch (error) {
            console.error('Play failed:', error);
            toast('❌ Failed to play audio. Check console for details.');
        }
    });
    
    // Pause button
    pauseBtn.addEventListener('click', () => {
        console.log('Pause button clicked');
        audio.pause();
        if (waveAnimation) {
            waveAnimation.className = 'audio-paused';
        }
        
        // Pause transcript synchronization
        if (isTranscriptSyncEnabled) {
            isTranscriptSyncEnabled = false;
            console.log('🎯 Transcript synchronization paused');
        }
    });
    
    // Stop button
    stopBtn.addEventListener('click', () => {
        console.log('Stop button clicked');
        audio.pause();
        audio.currentTime = 0;
        if (waveAnimation) {
            waveAnimation.className = 'audio-stopped';
        }
        updateTimeDisplay(0, audio.duration || 0);
        
        // Reset and disable transcript synchronization
        isTranscriptSyncEnabled = false;
        resetTranscriptSync();
        console.log('🎯 Transcript synchronization disabled on stop');
    });
    
    // Audio event listeners
    audio.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded', { duration: audio.duration });
        updateTimeDisplay(0, audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
        updateTimeDisplay(audio.currentTime, audio.duration);
    });
    
    // Handle seeking - reset sync when user manually changes position
    audio.addEventListener('seeked', () => {
        console.log('Audio seeked to:', audio.currentTime);
        if (isTranscriptSyncEnabled) {
            // Reset and recalculate which messages should be shown
            displayedTranscriptIndices.clear();
            clearChatMessages();
            
            // Show all messages that should already be displayed at current time
            conversationTranscript.forEach((segment, index) => {
                const displayTime = segment.end_time + 3.0;
                if (audio.currentTime >= displayTime) {
                    displayTranscriptSegment(segment, index);
                    displayedTranscriptIndices.add(index);
                }
            });
        }
    });
    
    audio.addEventListener('ended', () => {
        console.log('Audio ended');
        if (waveAnimation) {
            waveAnimation.className = 'audio-stopped';
        }
        updateTimeDisplay(0, audio.duration);
    });
    
    audio.addEventListener('play', () => {
        console.log('Audio play event fired');
        if (waveAnimation) {
            waveAnimation.className = 'audio-playing';
        }
    });
    
    audio.addEventListener('pause', () => {
        console.log('Audio pause event fired');
        if (waveAnimation) {
            waveAnimation.className = 'audio-paused';
        }
    });
    
    // Initialize wave animation state
    if (waveAnimation) {
        waveAnimation.className = 'audio-stopped';
    }
    
    // Force load audio metadata
    if (audio.readyState === 0) {
        console.log('Force loading audio...');
        audio.load();
    }
    
    // Helper function to update time display
    function updateTimeDisplay(current, duration) {
        if (!timeDisplay) return;
        
        const formatTime = (seconds) => {
            if (isNaN(seconds) || seconds < 0) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        const currentTime = isNaN(current) ? 0 : current;
        const totalTime = isNaN(duration) ? 0 : duration;
        
        const timeText = totalTime > 0 ? `${formatTime(currentTime)}/${formatTime(totalTime)}` : '00:00';
        timeDisplay.textContent = timeText;
        
        console.log('Time updated:', { current: currentTime, duration: totalTime, display: timeText });
        
        // Update transcript synchronization
        updateTranscriptSync(currentTime);
    }
}

// Conversation Transcript Synchronization
let isTranscriptSyncEnabled = false;
let displayedTranscriptIndices = new Set();

// Simple profile extraction - just collect one pair of messages
let lastYouMessage = '';
let lastSarahMessage = '';
let extractionCount = 0;  // Track how many extractions we've done

// Simple function to extract profile from one message pair
async function extractProfileFromMessagePair(youMessage, sarahMessage) {
    extractionCount++;
    
    // Add this pair to our collected pairs
    collectedMessagePairs.push({ you: youMessage, sarah: sarahMessage });
    
    // Build accumulated transcript from all collected pairs
    const transcriptPairs = collectedMessagePairs.map(pair => `ME: ${pair.you} Customer: ${pair.sarah}`);
    accumulatedTranscript = transcriptPairs.join(' ');
    
    try {
        console.log(`🔄 Extraction #${extractionCount} - Extracting profile from ${collectedMessagePairs.length} accumulated message pairs`);
        console.log('🔍 Latest You message:', youMessage);
        console.log('🔍 Latest Sarah message:', sarahMessage);
        console.log('📚 Accumulated transcript length:', accumulatedTranscript.length, 'characters');
        console.log('📝 Full accumulated transcript:', accumulatedTranscript);
        
        const response = await fetch('/api/extract-detailed-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcript: accumulatedTranscript
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`📊 API Response #${extractionCount}:`, result);
        
        if (result.success && result.profile) {
            console.log(`✅ Profile extraction #${extractionCount} successful from ${collectedMessagePairs.length} accumulated pairs`);
            console.log('📋 Profile data:', result.profile);
            
            // Populate the profile sections with extracted data
            populateProfileSections(result.profile);
            
            // Show success animation
            showProfilePopulationAnimation();
            
            console.log(`🎯 Profile fields updated from extraction #${extractionCount}`);
        } else {
            console.log(`⚠️ No profile data extracted from extraction #${extractionCount}`);
        }
        
    } catch (error) {
        console.error(`❌ Error in extraction #${extractionCount}:`, error);
    }
}

async function loadConversationTranscript() {
    try {
        console.log('Loading conversation transcript...');
        const response = await fetch('/conversation_transcript.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        conversationTranscript = await response.json();
        console.log('Conversation transcript loaded:', conversationTranscript.length, 'segments');
        console.log('First segment:', conversationTranscript[0]);
        console.log('✅ Auto-sync will start when audio plays');
        
    } catch (error) {
        console.error('Error loading conversation transcript:', error);
        conversationTranscript = [];
    }
}

function updateTranscriptSync(currentTimeSeconds) {
    if (!isTranscriptSyncEnabled || conversationTranscript.length === 0) {
        // Only log occasionally to avoid spam
        if (Math.floor(currentTimeSeconds) % 10 === 0) {
            console.log('Sync check: enabled=' + isTranscriptSyncEnabled + ', transcript_length=' + conversationTranscript.length);
        }
        return;
    }
    
    // Check each transcript segment
    conversationTranscript.forEach((segment, index) => {
        // Skip if already displayed
        if (displayedTranscriptIndices.has(index)) return;
        
        // Calculate when to display: end_time + 3 seconds delay
        const displayTime = segment.end_time + 3.0;
        
        // Check if we've reached the display time
        if (currentTimeSeconds >= displayTime) {
            console.log(`🎯 Triggering display for segment ${index + 1}: ${segment.speaker} at ${currentTimeSeconds.toFixed(1)}s (display_time: ${displayTime.toFixed(1)}s)`);
            displayTranscriptSegment(segment, index);
            displayedTranscriptIndices.add(index);
        }
    });
}

function displayTranscriptSegment(segment, index) {
    // Determine role based on speaker
    const role = segment.speaker === 'ME' ? 'assistant' : 'user';
    const speakerName = segment.speaker === 'ME' ? 'You' : segment.speaker;
    
    console.log(`Displaying transcript segment ${index + 1}:`, segment.content);
    
    // Create message element with proper positioning
    const wrap = document.createElement('div');
    wrap.className = `msg ${role} transcript-sync`;
    
    // Position messages: Agent (ME) on right, Sarah on left
    wrap.style.cssText = `
        margin: 8px 0;
        display: flex;
        ${role === 'assistant' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        max-width: 70%;
        ${role === 'assistant' ? 'margin-left: auto;' : 'margin-right: auto;'}
    `;
    
    // Add speaker label with red theme
    const label = document.createElement('div');
    label.className = 'speaker-label';
    label.textContent = speakerName;
    label.style.cssText = `
        font-size: 7px;
        color: #7f1d1d;
        margin-bottom: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        ${role === 'assistant' ? 'text-align: right;' : 'text-align: left;'}
    `;
    messageContainer.appendChild(label);
    
    // Add message bubble with red theme (removed timestamp)
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = segment.content;
    bubble.style.cssText = `
        font-size: 9px;
        line-height: 1.4;
        padding: 8px 12px;
        border-radius: 12px;
        position: relative;
        word-wrap: break-word;
        ${role === 'assistant' 
            ? `background: linear-gradient(135deg, #dc2626, #ef4444); 
               color: white; 
               border-bottom-right-radius: 4px;
               box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);`
            : `background: linear-gradient(135deg, #fef2f2, #fee2e2); 
               color: #7f1d1d; 
               border: 1px solid #fecaca;
               border-bottom-left-radius: 4px;
               box-shadow: 0 2px 8px rgba(254, 202, 202, 0.4);`
        }
    `;
    
    messageContainer.appendChild(bubble);
    wrap.appendChild(messageContainer);
    
    // Add with typing animation
    wrap.style.opacity = '0';
    wrap.style.transform = 'translateY(10px)';
    wrap.style.transition = 'all 0.3s ease';
    
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.appendChild(wrap);
        
        // Trigger animation
        setTimeout(() => {
            wrap.style.opacity = '1';
            wrap.style.transform = 'translateY(0)';
        }, 100);
        
        // Auto-scroll to bottom - find the actual scrollable container
        setTimeout(() => {
            // Method 1: Use the parent container (messages-container)
            const scrollableContainer = messagesContainer.parentElement;
            if (scrollableContainer) {
                // Force immediate scroll
                scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
                
                // Additional scroll after a brief delay
                setTimeout(() => {
                    scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
                }, 50);
                
                console.log('Auto-scroll applied to scrollable container:', {
                    scrollHeight: scrollableContainer.scrollHeight,
                    scrollTop: scrollableContainer.scrollTop,
                    clientHeight: scrollableContainer.clientHeight,
                    isScrolledToBottom: Math.abs(scrollableContainer.scrollHeight - scrollableContainer.clientHeight - scrollableContainer.scrollTop) < 5
                });
            }
            
            // Method 2: Also try scrollIntoView on the last message
            setTimeout(() => {
                const lastMessage = messagesContainer.lastElementChild;
                if (lastMessage) {
                    lastMessage.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
                }
            }, 100);
            
        }, 300); // Increased delay to ensure DOM is updated
        
        // Animate voice assistant when new message appears
        if (role === 'assistant') {
            animateVoiceAssistant();
        }
        
        // Simple profile extraction - collect pairs of messages continuously
        console.log('🎯 Checking segment for profile extraction:', segment.speaker, segment.content);
        
        if (segment.speaker === 'ME') {
            lastYouMessage = segment.content;
            console.log('📝 Stored You message:', lastYouMessage);
            
            // If we have a Sarah message, extract profile
            if (lastSarahMessage) {
                console.log('🎯 Found message pair, extracting profile...');
                console.log('💼 You:', lastYouMessage);
                console.log('� Sarah:', lastSarahMessage);
                extractProfileFromMessagePair(lastYouMessage, lastSarahMessage);
                
                // Clear Sarah message after extraction to get fresh pairs
                lastSarahMessage = '';
            }
        } else if (segment.speaker === 'Sarah') {
            lastSarahMessage = segment.content;
            console.log('📝 Stored Sarah message:', lastSarahMessage);
            
            // If we have a You message, extract profile
            if (lastYouMessage) {
                console.log('🎯 Found message pair, extracting profile...');
                console.log('💼 You:', lastYouMessage);
                console.log('👥 Sarah:', lastSarahMessage);
                extractProfileFromMessagePair(lastYouMessage, lastSarahMessage);
                
                // Clear You message after extraction to get fresh pairs
                lastYouMessage = '';
            }
        }
    }
}

function formatTranscriptTime(startTime, endTime) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function clearChatMessages() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        // Remove only transcript-sync messages, keep user messages
        const syncMessages = messagesContainer.querySelectorAll('.msg.transcript-sync');
        syncMessages.forEach(msg => msg.remove());
    }
}

// Reset sync when audio is restarted
function resetTranscriptSync() {
    displayedTranscriptIndices.clear();
    if (isTranscriptSyncEnabled) {
        clearChatMessages();
    }
    console.log('Transcript sync reset');
}

// Debug function to test auto-scroll
function testAutoScroll() {
    const messagesContainer = document.getElementById('messages');
    const scrollableContainer = messagesContainer?.parentElement;
    
    if (scrollableContainer) {
        console.log('Testing auto-scroll on scrollable container...', {
            scrollHeight: scrollableContainer.scrollHeight,
            scrollTop: scrollableContainer.scrollTop,
            clientHeight: scrollableContainer.clientHeight,
            canScroll: scrollableContainer.scrollHeight > scrollableContainer.clientHeight
        });
        
        // Force scroll to bottom
        scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
        
        setTimeout(() => {
            console.log('After scroll:', {
                scrollTop: scrollableContainer.scrollTop,
                isAtBottom: scrollableContainer.scrollTop >= (scrollableContainer.scrollHeight - scrollableContainer.clientHeight - 5)
            });
        }, 100);
    } else {
        console.log('Scrollable container not found');
    }
}

// Make test function available globally for console testing
window.testAutoScroll = testAutoScroll;

// Product Recommendation Functions
let productRecommendations = null;

// Load product recommendations data
async function loadProductRecommendationsData() {
    try {
        const response = await fetch('/N_recommender.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        productRecommendations = await response.json();
        console.log('✅ Product recommendations loaded:', productRecommendations);
    } catch (error) {
        console.error('❌ Error loading product recommendations:', error);
    }
}

// Find products for a specific archetype/category
function findProductsForCategory(archetype) {
    if (!productRecommendations) {
        console.warn('Product recommendations not loaded yet');
        return null;
    }
    
    // Map archetype names to category names in the JSON
    const archetypeMap = {
        'High-Debt Leverage': 'High-Debt Leverage (Maximum Risk)',
        'Affluent Professional': 'Affluent Professional',
        'Career Starter': 'Career Starter (Emerging Affluent)',
        'Mid-Career Professional': 'Mid-Career / Transitional',
        'Legacy Planner': 'Legacy Planner (Highest Wealth)',
        'Young Family': 'Young Family / Protector',
        'Investment Earner': 'Atypical / Investment Earner',
        'Pre-Retirement': 'Pre-Retirement Accumulator'
    };
    
    const categoryName = archetypeMap[archetype] || archetype;
    const cluster = productRecommendations.clusters.find(c => c.category === categoryName);
    
    if (cluster) {
        console.log(`✅ Found products for ${archetype}:`, cluster.products);
        return cluster.products;
    } else {
        console.warn(`❌ No products found for archetype: ${archetype}`);
        // Return Career Starter products as default
        const defaultCluster = productRecommendations.clusters.find(c => c.category.includes('Career Starter'));
        return defaultCluster ? defaultCluster.products : null;
    }
}

// Display product recommendations with red animations
function loadProductRecommendations(archetype) {
    console.log('🎯 Loading product recommendations for:', archetype);
    
    const products = findProductsForCategory(archetype);
    if (!products) {
        console.warn('No products found for this archetype');
        return;
    }
    
    const recommendationSection = document.getElementById('product_recommendation');
    if (!recommendationSection) {
        console.warn('Product recommendation section not found');
        return;
    }
    
    // Get customer name from the input field
    const nameField = document.getElementById('input_name');
    const customerName = nameField ? nameField.value.trim() : '';
    const displayText = customerName ? `Customers Like ${customerName}` : 'Customers Like You';
    
    // Create professional product recommendation display
    recommendationSection.innerHTML = `
        <div class="product-recommendations-container" style="
            background: linear-gradient(135deg, #fef7f7, #fef2f2);
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 12px;
            opacity: 0;
            transform: translateY(15px);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        ">
            <!-- Header with professional label -->
            <div style="
                background: linear-gradient(90deg, #dc2626, #ef4444);
                color: white;
                font-size: 8px;
                font-weight: 700;
                padding: 6px 12px;
                border-radius: 16px;
                text-align: center;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
            ">
                🏆 Top 3 Picks for ${displayText}
            </div>
            
            <!-- Products List -->
            <div class="products-list" style="space-between: 8px;">
                ${products.map((product, index) => `
                    <div class="product-item" style="
                        background: white;
                        border: 1px solid #f3f4f6;
                        border-radius: 6px;
                        padding: 8px;
                        margin-bottom: 6px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        opacity: 0;
                        transform: translateX(-10px);
                        transition: all 0.4s ease;
                        transition-delay: ${index * 0.15}s;
                    ">
                        <div style="
                            font-weight: 700;
                            color: #b91c1c;
                            font-size: 9px;
                            margin-bottom: 4px;
                            display: flex;
                            align-items: center;
                        ">
                            <span style="
                                background: linear-gradient(45deg, #dc2626, #ef4444);
                                color: white;
                                font-size: 7px;
                                padding: 2px 6px;
                                border-radius: 8px;
                                margin-right: 6px;
                                font-weight: 600;
                            ">#${index + 1}</span>
                            ${product.name}
                        </div>
                        <div style="
                            font-size: 7px;
                            color: #6b7280;
                            line-height: 1.3;
                        ">${product.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Animate the container appearance
    setTimeout(() => {
        const container = recommendationSection.querySelector('.product-recommendations-container');
        if (container) {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.15)';
            
            // Animate individual product items
            setTimeout(() => {
                const productItems = container.querySelectorAll('.product-item');
                productItems.forEach(item => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                });
            }, 300);
            
            // Add pulsing effect to the section
            setTimeout(() => {
                const section = document.getElementById('product_recommendation_section');
                if (section) {
                    section.style.transition = 'all 0.3s ease';
                    section.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.2)';
                    
                    setTimeout(() => {
                        section.style.boxShadow = '0 0 8px rgba(220, 38, 38, 0.1)';
                    }, 500);
                }
            }, 800);
        }
    }, 200);
}

// Load product recommendations data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProductRecommendationsData();
});

// Conversation Analysis/Insights functionality
async function loadConversationInsights() {
    const insightsTab = document.getElementById('insights-tab');
    
    // Show loading state
    insightsTab.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Analyzing conversation...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/analyze-conversation');
        if (!response.ok) {
            throw new Error(`Failed to analyze conversation: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('API Response:', responseData); // Debug log to see actual structure
        
        // Extract the analysis data from the response
        const analysis = responseData.analysis || responseData;
        displayConversationInsights(analysis);
        
    } catch (error) {
        console.error('Error loading conversation insights:', error);
        insightsTab.innerHTML = `
            <div class="error-state">
                <h3>Error Loading Insights</h3>
                <p>Unable to analyze conversation: ${error.message}</p>
                <button onclick="loadConversationInsights()" class="retry-btn">Retry Analysis</button>
            </div>
        `;
    }
}

function displayConversationInsights(analysis) {
    const insightsTab = document.getElementById('insights-tab');
    
    console.log('Analysis data received:', analysis); // Debug log
    
    // Handle the simplified response structure
    const safeAnalysis = {
        sentiment_analysis: analysis.sentiment_analysis || {
            overall_sentiment: 'Neutral',
            summary: 'Unable to determine sentiment from conversation'
        },
        strengths: analysis.strengths || ['Conversation completed successfully'],
        areas_for_improvement: analysis.areas_for_improvement || ['Analysis requires improvement'],
        key_insights: analysis.key_insights || 'No specific insights available',
        overall_score: analysis.overall_score || 'N/A'
    };

    insightsTab.innerHTML = `
        <div class="insights-container">
            <h2>📊 Conversation Analysis & Insights</h2>
            
            <!-- Overall Sentiment Section -->
            <div class="insight-section">
                <h3><i class="icon-sentiment"></i> 💭 Overall Sentiment & Assessment</h3>
                <div class="sentiment-card">
                    <div class="sentiment-score ${safeAnalysis.sentiment_analysis.overall_sentiment.toLowerCase()}">
                        ${safeAnalysis.sentiment_analysis.overall_sentiment}
                    </div>
                    <p class="sentiment-description">${safeAnalysis.sentiment_analysis.summary}</p>
                </div>
                <div class="overall-score">
                    <strong>Overall Agent Performance Score: ${safeAnalysis.overall_score}/10</strong>
                </div>
            </div>
            
            <!-- Strengths Section -->
            <div class="insight-section">
                <h3><i class="icon-strengths"></i> ✅ Agent Strengths</h3>
                <div class="strengths-list">
                    ${safeAnalysis.strengths.map((strength, index) => `
                        <div class="strength-item">
                            <div class="strength-header">Strength ${index + 1}</div>
                            <div class="strength-content">${strength}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Areas for Improvement -->
            <div class="insight-section">
                <h3><i class="icon-improvements"></i> 🔄 Areas for Agent Improvement</h3>
                <div class="improvements-list">
                    ${safeAnalysis.areas_for_improvement.map((improvement, index) => `
                        <div class="improvement-item">
                            <div class="improvement-header">Improvement Area ${index + 1}</div>
                            <div class="improvement-content">${improvement}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Key Insights -->
            <div class="insight-section">
                <h3><i class="icon-insights"></i> � Key Insights</h3>
                <div class="insights-content">
                    <p>${safeAnalysis.key_insights}</p>
                </div>
            </div>
            
        </div>
    `;
}
