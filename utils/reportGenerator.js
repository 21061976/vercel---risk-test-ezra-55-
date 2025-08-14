// utils/reportGenerator.js - מחולל דוח HTML מקצועי

export function generateReportHTML(reportData) {
  const {
    projectName,
    organization,
    projectManager,
    projectScope,
    timeline,
    projectType,
    regulatoryPartners,
    goals,
    deliverables,
    risks,
    strategies,
    innovationLevel,
    innovationDescription,
    innovationDefinition,
    committeeRecommendation,
    executiveSummary,
    recommendations,
    riskCounts
  } = reportData;

  // יצירת HTML מלא עם הנתונים החדשים
  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>דוח ניהול סיכונים - ${projectName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #2c3e50;
            direction: rtl;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header .subtitle {
            font-size: 1.4em;
            opacity: 0.9;
            margin-bottom: 10px;
        }

        .date-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 15px;
            backdrop-filter: blur(10px);
        }

        .nav-menu {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 0;
        }

        .nav-item {
            flex: 1;
            min-width: 150px;
            text-align: center;
            border-left: 1px solid #2c3e50;
        }

        .nav-item:first-child {
            border-left: none;
        }

        .nav-item a {
            display: block;
            padding: 18px 20px;
            color: #bdc3c7;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95em;
            transition: all 0.3s ease;
        }

        .nav-item a:hover {
            background: #2c3e50;
            color: white;
            transform: translateY(-2px);
        }

        .section {
            margin: 0;
        }

        .section-header {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 25px 40px;
            font-size: 2.2em;
            font-weight: bold;
            text-align: center;
            position: relative;
        }

        .project-overview {
            padding: 40px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }

        .overview-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            border-top: 4px solid #3498db;
            transition: all 0.3s ease;
        }

        .overview-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
        }

        .overview-card h4 {
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .goals-section {
            background: white;
            margin: 30px 40px;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .goals-section h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5em;
            text-align: center;
        }

        .goal-item {
            background: #f8f9fa;
            margin: 15px 0;
            padding: 20px;
            border-radius: 10px;
            border-right: 4px solid #27ae60;
            transition: all 0.3s ease;
        }

        .goal-item:hover {
            background: #e9ecef;
            transform: translateX(-5px);
        }

        .risks-container {
            padding: 40px;
            background: white;
        }

        .risk-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }

        .summary-card:hover {
            transform: translateY(-3px);
        }

        .summary-number {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .very-high { color: #e74c3c; }
        .high { color: #f39c12; }
        .medium { color: #f1c40f; }
        .low { color: #27ae60; }

        .risks-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }

        .risk-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 30px;
            transition: all 0.3s ease;
            border-top: 6px solid;
            position: relative;
            overflow: hidden;
        }

        .risk-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .risk-very-high { border-top-color: #e74c3c; }
        .risk-high { border-top-color: #f39c12; }
        .risk-medium { border-top-color: #f1c40f; }
        .risk-low { border-top-color: #27ae60; }

        .risk-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
        }

        .risk-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #2c3e50;
            flex: 1;
        }

        .risk-severity {
            padding: 8px 15px;
            border-radius: 25px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
            white-space: nowrap;
        }

        .severity-very-high { background: #e74c3c; }
        .severity-high { background: #f39c12; }
        .severity-medium { background: #f1c40f; color: #2c3e50; }
        .severity-low { background: #27ae60; }

        .risk-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
            text-align: center;
        }

        .metric {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
        }

        .metric-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #2c3e50;
        }

        .metric-label {
            font-size: 0.9em;
            color: #7f8c8d;
            margin-top: 5px;
        }

        .risk-description {
            color: #34495e;
            line-height: 1.7;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 15px;
            border-right: 4px solid #bdc3c7;
        }

        .risk-impact {
            margin-top: 20px;
        }

        .impact-title {
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 10px;
        }

        .impact-list {
            list-style: none;
            padding-right: 15px;
        }

        .impact-list li {
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
            position: relative;
        }

        .impact-list li::before {
            content: '⚠️';
            margin-left: 10px;
        }

        .opportunity-title {
            font-weight: bold;
            color: #27ae60;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .opportunity-list {
            list-style: none;
            padding-right: 15px;
        }

        .opportunity-list li {
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
            position: relative;
        }

        .opportunity-list li::before {
            content: '✅';
            margin-left: 10px;
        }

        .innovation-section {
            background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
        }

        .innovation-score {
            font-size: 5em;
            font-weight: bold;
            margin: 30px 0;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
        }

        .innovation-components {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 40px;
        }

        .component-card {
            background: rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }

        .component-card:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-3px);
        }

        .component-score {
            font-size: 2.5em;
            font-weight: bold;
            color: #f39c12;
            margin-bottom: 10px;
        }

        .component-title {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .summary-box {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 40px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }

        .recommendation-item {
            background: #f0f8ff;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            border-left: 6px solid #3498db;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .recommendation-item h4 {
            color: #34495e;
            font-size: 1.4em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 30px;
            font-size: 0.9em;
        }

        @media print {
            body { background: white !important; }
            .container { box-shadow: none !important; }
            .nav-menu { display: none !important; }
            .section { page-break-inside: avoid; }
        }

        @media (max-width: 768px) {
            .header h1 { font-size: 2.2em; }
            .nav-menu { flex-direction: column; }
            .nav-item { min-width: auto; border-left: none; border-bottom: 1px solid #2c3e50; }
            .nav-item:last-child { border-bottom: none; }
            .risks-grid, .overview-grid, .innovation-components { grid-template-columns: 1fr; }
            .innovation-score { font-size: 3.5em; }
            .risk-header { flex-direction: column; align-items: flex-start; }
            .risk-metrics { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <h1>דוח ניהול סיכונים מקיף</h1>
            <div class="subtitle">${projectName} - ${organization}</div>
            <div class="date-badge">נוצר ב-${new Date().toLocaleDateString('he-IL')}</div>
        </header>

        <!-- Navigation -->
        <nav class="nav-menu">
            <div class="nav-item"><a href="#project">📋 הגדרת הפרויקט</a></div>
            <div class="nav-item"><a href="#risks">⚠️ ניהול סיכונים</a></div>
            <div class="nav-item"><a href="#innovation">🚀 אסדרת חדשנות</a></div>
            <div class="nav-item"><a href="#summary">📝 סיכום והמלצות</a></div>
        </nav>

        <!-- Project Section -->
        <section id="project" class="section">
            <div class="section-header">📋 הגדרת הפרויקט</div>
            
            <div class="project-overview">
                <h2 style="text-align: center; color: #2c3e50; font-size: 2.2em; margin-bottom: 30px;">פרטי הפרויקט</h2>
                <div class="overview-grid">
                    <div class="overview-card">
                        <h4><span>👤</span> מנהל הפרויקט</h4>
                        <p>${projectManager || 'לא צוין'}</p>
                    </div>
                    <div class="overview-card">
                        <h4><span>🏢</span> ארגון</h4>
                        <p>${organization}</p>
                    </div>
                    <div class="overview-card">
                        <h4><span>🌍</span> היקף הפרויקט</h4>
                        <p>${projectScope || 'לא צוין'}</p>
                    </div>
                    <div class="overview-card">
                        <h4><span>📅</span> לוח זמנים</h4>
                        <p>${timeline || 'לא צוין'}</p>
                    </div>
                    <div class="overview-card">
                        <h4><span>🚀</span> סוג הפרויקט</h4>
                        <p>${projectType || 'לא צוין'}</p>
                    </div>
                    <div class="overview-card">
                        <h4><span>🤝</span> שותפים רגולטוריים</h4>
                        <p>${regulatoryPartners || 'לא צוין'}</p>
                    </div>
                </div>
            </div>

            <!-- Goals -->
            <div class="goals-section">
                <h3>🎯 מטרות הפרויקט</h3>
                ${goals.map(goal => `
                    <div class="goal-item">
                        <strong>${goal.title}</strong><br>
                        ${goal.description}
                    </div>
                `).join('')}
            </div>

            <!-- Deliverables -->
            ${deliverables && deliverables.length > 0 ? `
            <div class="goals-section">
                <h3>📋 תוצרים מצופים</h3>
                ${deliverables.map(deliverable => `
                    <div class="goal-item" style="border-right-color: #3498db;">
                        ${deliverable}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </section>

        <!-- Risks Section -->
        <section id="risks" class="section">
            <div class="section-header">⚠️ ניהול סיכונים</div>

            <div class="risks-container">
                <!-- Risk Summary -->
                <div class="risk-summary">
                    <div class="summary-card">
                        <div class="summary-number very-high">${riskCounts.veryHigh}</div>
                        <div>סיכונים בחומרה<br>גבוהה מאוד</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number high">${riskCounts.high}</div>
                        <div>סיכונים בחומרה<br>גבוהה</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number medium">${riskCounts.medium}</div>
                        <div>סיכונים בחומרה<br>בינונית</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number low">${riskCounts.low}</div>
                        <div>סיכונים בחומרה<br>נמוכה</div>
                    </div>
                </div>

                <!-- Risk Cards -->
                <div class="risks-grid">
                    ${risks.map(risk => {
                        const severityClass = getSeverityClass(risk.severity);
                        const severityLabel = getSeverityLabel(risk.severity);
                        
                        return `
                        <div class="risk-card ${severityClass}">
                            <div class="risk-header">
                                <div class="risk-title">${risk.title}</div>
                                <div class="risk-severity severity-${severityClass.replace('risk-', '')}">${severityLabel}</div>
                            </div>
                            <div class="risk-metrics">
                                <div class="metric">
                                    <div class="metric-value">${risk.probability}</div>
                                    <div class="metric-label">הסתברות (1-10)</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${risk.impact}</div>
                                    <div class="metric-label">נזק (1-10)</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value" style="color: ${getSeverityColor(risk.severity)};">${risk.severity}</div>
                                    <div class="metric-label">חומרה</div>
                                </div>
                            </div>
                            <div class="risk-description">
                                <strong>תיאור:</strong> ${risk.description}
                            </div>
                            <div class="risk-impact">
                                <div class="impact-title">השלכות פוטנציאליות:</div>
                                <ul class="impact-list">
                                    ${risk.impacts.map(impact => `<li>${impact}</li>`).join('')}
                                </ul>
                            </div>
                            ${risk.opportunities && risk.opportunities.length > 0 ? `
                            <div class="risk-opportunity">
                                <div class="opportunity-title">הזדמנויות:</div>
                                <ul class="opportunity-list">
                                    ${risk.opportunities.map(opp => `<li>${opp}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </section>

        <!-- Innovation Section -->
        <section id="innovation" class="section innovation-section">
            <div class="section-header">🚀 רמת החדשנות בפרויקט</div>
            <p style="font-size: 1.2em; max-width: 800px; margin: 20px auto 40px; color: rgba(255,255,255,0.9);">
                רמת החדשנות הכוללת מחושבת כממוצע של ארבעה רכיבים מרכזיים, המעריכים את עומק השינוי והסיכון הגלום בו.
            </p>
            <div class="innovation-score">${innovationLevel.totalScore.toFixed(1)} / 10</div>
            <div class="innovation-components">
                <div class="component-card">
                    <div class="component-title">השפעה פדגוגית</div>
                    <div class="component-score">${innovationLevel.pedagogicalImpact}/10</div>
                    <p>עומק השינוי הפדגוגי והשפעתו על תהליכי ההוראה והלמידה</p>
                </div>
                <div class="component-card">
                    <div class="component-title">מורכבות טכנולוגית</div>
                    <div class="component-score">${innovationLevel.technologicalComplexity}/10</div>
                    <p>רמת הטכנולוגיה החדשה והמורכבות הטכנית הנדרשת</p>
                </div>
                <div class="component-card">
                    <div class="component-title">שינוי ארגוני</div>
                    <div class="component-score">${innovationLevel.organizationalChange}/10</div>
                    <p>עומק השינוי הנדרש במבנה הארגוני ובתהליכי העבודה</p>
                </div>
                <div class="component-card">
                    <div class="component-title">סיכון טכנולוגי</div>
                    <div class="component-score">${innovationLevel.technologicalRisk}/10</div>
                    <p>רמת אי הוודאות והסיכון הטכנולוגי הגלום בפרויקט</p>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: right; max-width: 800px; margin-left: auto; margin-right: auto;">
                <h3 style="margin-bottom: 15px;">תיאור החדשנות</h3>
                <p style="margin-bottom: 20px;">${innovationDescription}</p>
                
                <h3 style="margin-bottom: 15px;">הגדרת רמת החדשנות</h3>
                <p style="margin-bottom: 20px;">${innovationDefinition}</p>
                
                <div class="recommendation-item" style="margin-top: 30px; background: rgba(255,255,255,0.1); border-left: 6px solid #f39c12;">
                    <h4>👥 המלצה לאסדרת חדשנות:</h4>
                    <p>${committeeRecommendation}</p>
                </div>
            </div>
        </section>

        <!-- Executive Summary Section -->
        <section id="summary" class="section">
            <div class="section-header">📝 סיכום מנהלים והמלצות</div>
            
            <div class="summary-box">
                <h3 style="text-align: center; color: #2c3e50; font-size: 1.8em; margin-bottom: 20px;">סיכום מנהלים: ${projectName} במבט על</h3>
                <p style="text-align: justify; font-size: 1.1em; line-height: 1.8;">${executiveSummary}</p>
            </div>

            <div class="summary-box">
                <h3 style="text-align: center; color: #2c3e50; font-size: 1.8em; margin-bottom: 20px;">💡 המלצות קונקרטיות לוועדה</h3>
                ${recommendations.map((rec, index) => `
                    <div class="recommendation-item">
                        <h4>המלצה ${index + 1} (מענה למטרה ${rec.linkedGoal}):</h4>
                        <p><strong>${rec.title}</strong></p>
                        <p>${rec.description}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <p style="margin-bottom: 10px;">דוח זה נוצר באמצעות מערכת EZRA 5.0 - מחולל דוחות ניהול סיכונים חכם</p>
            <p>נוצר בתאריך ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL')}</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #34495e;">
                <p>כל הזכויות שמורות © ${new Date().getFullYear()}</p>
            </div>
        </footer>
    </div>

    <script>
        // הוסף פונקציונליות עריכה ובקרת התרות
        document.addEventListener('DOMContentLoaded', function() {
            // הוסף כפתור הדפסה
            const printBtn = document.createElement('button');
            printBtn.innerHTML = '🖨️ הדפס דוח';
            printBtn.style.cssText = 'position: fixed; top: 20px; left: 20px; z-index: 1000; background: #3498db; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);';
            printBtn.onclick = () => window.print();
            document.body.appendChild(printBtn);

            // הוסף כפתור שמירה כ-PDF
            const saveBtn = document.createElement('button');
            saveBtn.innerHTML = '💾 שמור PDF';
            saveBtn.style.cssText = 'position: fixed; top: 70px; left: 20px; z-index: 1000; background: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);';
            saveBtn.onclick = () => {
                alert('לשמירה כ-PDF, השתמש באפשרות "הדפס" ובחר "שמור כ-PDF"');
                window.print();
            };
            document.body.appendChild(saveBtn);

            // גלילה חלקה לקישורי ניווט
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // הדגשת קישור הניווט הפעיל
            const updateActiveNav = () => {
                const sections = document.querySelectorAll('section[id]');
                const navLinks = document.querySelectorAll('.nav-item a');
                
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 100;
                    if (scrollY >= sectionTop) {
                        current = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.style.background = '';
                    link.style.color = '#bdc3c7';
                    if (link.getAttribute('href').includes(current)) {
                        link.style.background = '#2c3e50';
                        link.style.color = 'white';
                    }
                });
            };

            window.addEventListener('scroll', updateActiveNav);
            updateActiveNav(); // קרא בטעינה ראשונית
        });
    </script>
</body>
</html>
  `;
}

// פונקציות עזר
function getSeverityClass(severity) {
  if (severity >= 81) return 'risk-very-high';
  if (severity >= 49) return 'risk-high';
  if (severity >= 25) return 'risk-medium';
  return 'risk-low';
}

function getSeverityLabel(severity) {
  if (severity >= 81) return 'גבוהה מאוד';
  if (severity >= 49) return 'גבוהה';
  if (severity >= 25) return 'בינונית';
  return 'נמוכה';
}

function getSeverityColor(severity) {
  if (severity >= 81) return '#e74c3c';
  if (severity >= 49) return '#f39c12';
  if (severity >= 25) return '#f1c40f';
  return '#27ae60';
}
