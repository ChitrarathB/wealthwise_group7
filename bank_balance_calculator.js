// Calculate bank balance at death age 40 with specific parameters
function calculateBankBalanceAtDeath() {
    // Input parameters
    const currentAge = 34; // Default starting age
    const deathAge = 40;
    const monthlyActiveIncome0 = 7000;
    const monthlyPassiveIncome0 = 900;
    const monthlyExpense0 = 4500;
    const initialBankBalance = 85000;
    const monthlySavingsRate = 0; // No additional monthly savings
    const expenseInflationRate = 0.017; // 1.7% annual
    const activeIncomeGrowthRate = 0.05; // 5% annual
    const passiveIncomeGrowthRate = 0.02; // 2% annual
    
    let bankBalance = initialBankBalance;
    const projections = [];
    
    console.log('=== Bank Balance Calculation for Death at Age 40 ===');
    console.log(`Starting values:`);
    console.log(`- Age: ${currentAge}`);
    console.log(`- Active Income: $${monthlyActiveIncome0}/month`);
    console.log(`- Passive Income: $${monthlyPassiveIncome0}/month`);
    console.log(`- Expenses: $${monthlyExpense0}/month`);
    console.log(`- Initial Bank Balance: $${initialBankBalance}`);
    console.log(`- Death Age: ${deathAge}`);
    console.log('');
    
    for (let year = 0; year <= (deathAge - currentAge); year++) {
        const age = currentAge + year;
        
        // Calculate incomes with growth
        const isAlive = age < deathAge;
        const isWorkingAge = age < 65; // Retirement age
        
        let annualActiveIncome = 0;
        if (isAlive && isWorkingAge) {
            annualActiveIncome = 12 * monthlyActiveIncome0 * Math.pow(1 + activeIncomeGrowthRate, year);
        }
        
        // Passive income continues even after death
        const annualPassiveIncome = 12 * monthlyPassiveIncome0 * Math.pow(1 + passiveIncomeGrowthRate, year);
        
        // Calculate expenses with inflation
        const annualExpense = 12 * monthlyExpense0 * Math.pow(1 + expenseInflationRate, year);
        
        // Monthly savings contributions stop after death
        const annualSavings = isAlive ? 12 * monthlySavingsRate : 0;
        
        // Calculate net cashflow
        const totalIncome = annualActiveIncome + annualPassiveIncome;
        const netCashflow = totalIncome + annualSavings - annualExpense;
        
        // Handle bank balance changes
        if (netCashflow < 0) {
            // Deficit: withdraw from bank balance
            bankBalance += netCashflow; // Add negative amount (subtract)
        }
        
        // Bank balance grows by 6% annually
        bankBalance = bankBalance * 1.06;
        
        // Log the year details
        console.log(`Year ${year} (Age ${age}): ${!isAlive ? '💀 DEATH - ' : ''}`);
        console.log(`  Active Income: $${annualActiveIncome.toFixed(0)}`);
        console.log(`  Passive Income: $${annualPassiveIncome.toFixed(0)}`);
        console.log(`  Total Income: $${totalIncome.toFixed(0)}`);
        console.log(`  Annual Expenses: $${annualExpense.toFixed(0)}`);
        console.log(`  Net Cashflow: $${netCashflow.toFixed(0)}`);
        console.log(`  Bank Balance (end of year): $${bankBalance.toFixed(0)}`);
        console.log('');
        
        projections.push({
            age,
            year,
            isAlive,
            annualActiveIncome,
            annualPassiveIncome,
            totalIncome,
            annualExpense,
            netCashflow,
            bankBalance
        });
    }
    
    const deathYearIndex = deathAge - currentAge;
    const bankBalanceAtDeath = projections[deathYearIndex]?.bankBalance || 0;
    
    console.log('=== SUMMARY ===');
    console.log(`Bank Balance at Death (Age ${deathAge}): $${bankBalanceAtDeath.toFixed(0)}`);
    console.log('');
    
    // Show a few years after death to see the trend
    console.log('=== Years After Death (showing passive income + savings usage) ===');
    for (let additionalYear = 1; additionalYear <= 5; additionalYear++) {
        const year = deathYearIndex + additionalYear;
        const age = currentAge + year;
        
        // After death: only passive income
        const annualPassiveIncome = 12 * monthlyPassiveIncome0 * Math.pow(1 + passiveIncomeGrowthRate, year);
        const annualExpense = 12 * monthlyExpense0 * Math.pow(1 + expenseInflationRate, year);
        const netCashflow = annualPassiveIncome - annualExpense;
        
        if (netCashflow < 0) {
            bankBalance += netCashflow;
        }
        bankBalance = bankBalance * 1.06;
        
        console.log(`Year ${year} (Age ${age}): 💀 AFTER DEATH`);
        console.log(`  Passive Income: $${annualPassiveIncome.toFixed(0)}`);
        console.log(`  Annual Expenses: $${annualExpense.toFixed(0)}`);
        console.log(`  Deficit: $${Math.abs(netCashflow).toFixed(0)} (covered by savings)`);
        console.log(`  Bank Balance: $${bankBalance.toFixed(0)}`);
        console.log('');
    }
    
    return bankBalanceAtDeath;
}

// Run the calculation
calculateBankBalanceAtDeath();