# WealthWise Financial Advisor Dashboard

## Overview

This is the **Financial Advisor Dashboard** for WealthWise - a comprehensive interface designed for financial advisors to manage client portfolios, conduct live sessions, analyze client data, and generate AI-powered recommendations.

## Features

### 🎯 **Client Portfolio Management**
- **Client Overview**: View all clients with status indicators (Complete, In Progress, Scheduled)
- **Quick Actions**: Start sessions, view profiles, continue ongoing consultations
- **Client Metrics**: Real-time display of key financial metrics
- **Alert System**: Notifications for new recommendations and important updates

### 🎙️ **Live Session Management**
- **Real-time Profile Building**: Watch client profiles update live during voice conversations
- **Conversation Monitor**: Track dialogue with sentiment analysis and engagement metrics
- **Session Controls**: Pause, resume, and end sessions with proper data saving
- **AI Insights**: Real-time emotional cues and client interest detection

### 📊 **Advanced Analytics**
- **30-Year Projections**: Net worth, income, and expense forecasting
- **Interactive Charts**: Multiple visualization types using Chart.js
- **Key Metrics Dashboard**: Net worth, savings rate, insurance coverage tracking
- **Scenario Comparisons**: Side-by-side analysis of different financial paths

### 💡 **AI-Powered Recommendations**
- **Priority-Based Sorting**: High, medium, and low priority recommendations
- **Confidence Scoring**: AI confidence levels for each recommendation
- **Detailed Reasoning**: Explanation of why each recommendation was made
- **Action Buttons**: Present to client, view products, adjust plans

## Demo Data

The dashboard uses realistic demo data for the **Sarah Chen Family**:

- **Profile**: 3-member household, $8,500 monthly income, 4-room HDB
- **Metrics**: $247,500 net worth, 38.8% savings rate
- **Recommendations**: Life insurance gap, education savings, portfolio diversification
- **Session Data**: Live conversation with sentiment analysis

## User Journey - Financial Advisor

### 1. **Client Selection**
- Review client portfolio on dashboard
- Select client (Sarah Chen Family) to begin session
- View client summary and alerts

### 2. **Live Session Conduct**
- Start voice-enabled session with client
- Monitor real-time profile building
- Track conversation sentiment and engagement
- Receive AI insights about client interests

### 3. **Data Analysis**
- Review comprehensive financial analytics
- Examine 30-year projections and scenarios
- Identify optimization opportunities
- Validate AI-generated insights

### 4. **Recommendation Presentation**
- Review AI-powered recommendations
- Filter by type (insurance, investment, savings)
- Present recommendations to client
- Track client responses and decisions

### 5. **Follow-up Actions**
- Schedule next session
- Update client profile
- Generate session summary
- Plan implementation steps

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **Styling**: Modern CSS with gradients and animations
- **Data**: Hardcoded demo data (Sarah Chen Family profile)
- **Server**: Python HTTP server for local development

## Running the Dashboard

### Prerequisites
- Python 3.x installed
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Start the Server
```bash
cd advisor-dashboard
python3 server.py
```

### Access the Dashboard
Open your browser and navigate to:
```
http://localhost:8082
```

## Navigation

- **Client Portfolio**: Main client management interface
- **Live Session**: Real-time session monitoring and control
- **Analytics**: Comprehensive client data analysis
- **Recommendations**: AI-powered suggestion management

## Key Benefits for Advisors

1. **Efficiency**: Automated profile building and real-time updates
2. **Insights**: AI-powered client sentiment and engagement tracking
3. **Professionalism**: Modern, dashboard-like interface
4. **Data-Driven**: Comprehensive analytics and projections
5. **Client Engagement**: Interactive session management
6. **Recommendation Engine**: AI-generated, prioritized suggestions

## Demo Highlights

- **Complete Client Profile**: Fully populated Sarah Chen family data
- **Live Session Simulation**: Real conversation monitoring
- **30-Year Projections**: Detailed financial forecasting
- **AI Recommendations**: 3 prioritized suggestions with reasoning
- **Professional UI**: Modern, card-based design

This dashboard demonstrates how WealthWise transforms the traditional advisor-client relationship into a dynamic, data-driven, and highly engaging experience.

