const transcript = `ME: Hey Sarah, it's great to see you again. How have you been? Still managing that regional workload, or have things calmed down a bit?
Customer: It's a little better now, thankfully. Fewer flights, more time at home.
ME: That's good to hear. Balance makes all the difference. So today's chat is pretty relaxed — I just want to understand where you are financially and see how your plans might evolve in the next few years. 
We'll build a projection together — your current picture, plus a few "what-if" scenarios like marriage, kids, or unexpected events — just to visualize the impact before making any decisions. 
Customer: Sounds good, I'm curious to see how that looks actually. 
ME: Alright, let's start simple — how old are you?  
Customer: I'm 29. 
ME: Nice, good age to get serious about long-term planning. Are you single or married at the moment?
Customer: Single. 
ME: Got it. Any dependents ? 
Customer: No I don't have dependent 
ME: Noted thanks 

ME: Tell me about work — still with the consultancy firm? 
Customer: Yes, I've been promoted recently to Senior Consultant. 
ME: Congrats! That's great news. What's your current monthly take-home roughly? 
Customer: About $7,500. 
ME: Perfect. And do you usually get a raise or bonus each year? 
Customer: Usually around 5% increment, plus a small year-end bonus. 
ME: Nice, I'll use that as your growth rate — we'll assume it continues steadily till you decide to slow down. 
ME: Any additional income sources — like rental, dividends, or royalties? 
Customer: Yes, actually. I have a small studio apartment that I rent out — it brings in about $900 a month. The tenant's been consistent for a few years, and I plan to keep it that way long-term.  
ME: Nice! A stable passive stream is always helpful. So that's ongoing, not ending anytime soon? 
Customer: Exactly — it's just steady rent that I expect to continue indefinitely.  
ME: Perfect — I'll record that as a permanent passive income stream. That'll help balance your cashflow, especially after retirement when your active income stops. 
Let's talk about lifestyle — roughly how much do you spend each month? Rent, food, transport, bills, all in? 
Customer: Around $4,500, including utilities and a bit of travel.  
ME: Alright, that gives us a comfortable baseline. We'll factor in gradual inflation on top of that internally. 
ME: Any ongoing loans I should include — home, car, or others? 
Customer: Just my car loan, about $900 a month. It'll be done when I'm 33.  
ME: Great, that's simple. No personal or education loans, right? 
Customer: Nope, none.  
ME: Perfect — clean balance sheet. 
ME: How about savings — how much do you have in your bank or emergency fund currently? 
Customer: Around $85,000 total — between savings and a fixed deposit. 
ME: Nice, that's solid. I'll use that as your starting liquidity. 
ME: Let's talk about Retirement scenario, If you could pick, what age would you ideally like to retire or at least slow down? 
Customer: Probably around 60. 
ME: Good, that's achievable. And how much monthly income would you like to maintain after retirement? 
Customer: About $4,000 per month should be comfortable. 
ME: Perfect — that'll help me set your post-retirement expense goal.

ME: Now, Sarah, this next part is where the plan gets really insightful. We'll run a few what-if scenarios to see how key life events might affect your financial curve — your income, expenses, and savings over time.
Instead of me guessing, you tell me your assumptions, and I'll build them in. 
Customer: Okay, sounds fun. 
ME: Alright — if you imagine your future, at what age do you think you might get married? 
Customer: Hmm… probably around 32. 
ME: Okay, marriage at 32. And what about starting a family — any idea when you might want to have your first child? 
Customer: Maybe around 36. 
ME: Got it — child at 36. That'll help us simulate how expenses may increase. Would you know the expenses? 
Customer: No idea, please help me out with an approximation 

ME: Now, one more scenario — a bit sensitive, but important. We usually test a "what-if" for early death, to measure protection adequacy. If you were to pick an age for the simulation, what would you like me to use — something like 40, or later? 
Customer: Let's say 40, just to see how things look in a worst-case situation. 
ME: Good choice. That way, we can see how long your savings and passive income would sustain your dependents if your active income stops suddenly. 
Customer: That's actually very practical. 
ME: Exactly — it's not about predicting, it's about being prepared. 
Customer: Makes sense. I like seeing how all three compare visually. 
ME: Exactly — it gives you clarity to plan ahead confidently. See from the chart, we can see the shortfalls and there are insurance products that we can recommend based on your goals and requirements.`;

import('node:http').then(({ default: http }) => {
    const data = JSON.stringify({ transcript });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/extract-detailed-profile',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (result.success) {
                    console.log('✅ Extraction successful!');
                    console.log('\n📋 Extracted Profile:');
                    console.log(JSON.stringify(result.profile, null, 2));
                } else {
                    console.log('❌ Extraction failed:', result.error);
                    if (result.details) console.log('Details:', result.details);
                }
            } catch (e) {
                console.log('❌ Invalid JSON response:', body);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Request failed:', e.message);
    });

    req.write(data);
    req.end();
});