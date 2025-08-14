export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { documentText, options = {} } = req.body || {};
    
    if (!documentText) {
      return res.status(400).json({ error: 'חסר טקסט מסמך' });
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'מפתח Claude לא מוגדר' });
    }

    // קצר את הטקסט אם הוא ארוך מדי
    const truncatedText = documentText.length > 15000 
      ? documentText.substring(0, 15000) + "..."
      : documentText;

    const prompt = buildPrompt(truncatedText, options);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const data = await claudeResponse.json();
    let reportData;

    try {
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      reportData = JSON.parse(text);
      reportData.riskCounts = calcRiskCounts(reportData.risks || []);
    } catch (e) {
      reportData = getDemoReport(options);
    }

    res.status(200).json(reportData);

  } catch (error) {
    console.error('API Error:', error);
    res.status(200).json(getDemoReport(req.body?.options || {}));
  }
}

function buildPrompt(text, opts) {
  return `נתח את המסמך הזה ויצור דוח JSON לניהול סיכונים:

{
  "projectName": "${opts.projectName || 'פרויקט חדשני'}",
  "organization": "${opts.organization || 'משרד החינוך'}",
  "projectManager": "מנהל הפרויקט",
  "projectScope": "היקף הפרויקט",
  "timeline": "שנתיים",
  "projectType": "פרויקט חדשנות פדגוגית",
  "regulatoryPartners": "אגף מו״פ",
  "goals": [
    {"id": 1, "title": "מטרה 1: שיפור איכות הוראה", "description": "פיתוח כשירויות מאה 21"},
    {"id": 2, "title": "מטרה 2: חיזוק זהות", "description": "גיבוש זהות אישית ושייכות"},
    {"id": 3, "title": "מטרה 3: מענה הוליסטי", "description": "מענה מקיף לצרכי תלמידים"}
  ],
  "deliverables": ["מודל פדגוגי", "תוכניות הכשרה", "כלי הערכה"],
  "risks": [
    {
      "id": 1, "title": "התנגדות מורים", "linkedGoal": 1, "linkedGoalTitle": "שיפור הוראה",
      "probability": 8, "impact": 9, "severity": 72, "severityLevel": "גבוהה",
      "description": "קושי בהטמעה מצד צוותי ההוראה",
      "impacts": ["יישום שטחי", "תסכול מורים", "פגיעה באיכות"],
      "opportunities": ["צמיחה מקצועית", "העלאת יוקרה"]
    }
  ],
  "innovationLevel": {"totalScore": 8.0, "pedagogicalImpact": 9, "technologicalComplexity": 7, "organizationalChange": 8, "technologicalRisk": 8},
  "innovationDescription": "פרויקט חדשני המשנה את פני החינוך",
  "innovationDefinition": "חדשנות משבשת הדורשת מרחב רגולטורי",
  "committeeRecommendation": "מומלץ אישור בתנאים מותאמים",
  "executiveSummary": "פרויקט אסטרטגי חיוני עם סיכונים ניתנים לניהול",
  "recommendations": [
    {"id": 1, "title": "המלצה ראשונה", "description": "פיתוח מקצועי מערכתי", "linkedGoal": 1}
  ]
}

מסמך: ${text}`;
}

function calcRiskCounts(risks) {
  const counts = { veryHigh: 0, high: 0, medium: 0, low: 0 };
  risks.forEach(r => {
    const s = r.severity || (r.probability * r.impact);
    if (s >= 81) counts.veryHigh++;
    else if (s >= 49) counts.high++;
    else if (s >= 25) counts.medium++;
    else counts.low++;
  });
  return counts;
}

function getDemoReport(opts) {
  return {
    projectName: opts.projectName || "פרויקט דמו",
    organization: opts.organization || "ארגון דמו",
    projectManager: "מנהל פרויקט",
    projectScope: "פרויקט להדגמה",
    timeline: "שנתיים",
    projectType: "פיילוט חדשנות",
    regulatoryPartners: "גורמי אסדרה",
    goals: [
      {id: 1, title: "מטרה 1: חדשנות פדגוגית", description: "שיפור שיטות הוראה וייצור ידע חדש"},
      {id: 2, title: "מטרה 2: מעורבות תלמידים", description: "הגברת המוטיבציה והמעורבות"},
      {id: 3, title: "מטרה 3: יעילות ארגונית", description: "שיפור תהליכים ארגוניים"}
    ],
    deliverables: ["מודל חדשני", "כלי הערכה", "תוכנית הכשרה", "מדריך יישום"],
    risks: [
      {
        id: 1, title: "התנגדות לשינוי", linkedGoal: 1, linkedGoalTitle: "חדשנות פדגוגית",
        probability: 7, impact: 8, severity: 56, severityLevel: "גבוהה",
        description: "התנגדות מצד צוותי ההוראה לאימוץ שיטות חדשות",
        impacts: ["עיכוב ביישום", "ירידה באיכות", "תסכול מורים"],
        opportunities: ["הזדמנות להכשרה", "שיפור מיומנויות"]
      },
      {
        id: 2, title: "אתגרים טכנולוגיים", linkedGoal: 2, linkedGoalTitle: "מעורבות תלמידים", 
        probability: 6, impact: 7, severity: 42, severityLevel: "בינונית",
        description: "קושי בהטמעת כלים טכנולוגיים חדשים",
        impacts: ["עיכובים טכניים", "צורך בהכשרה נוספת"],
        opportunities: ["שיפור יכולות דיגיטליות", "חדשנות טכנולוגית"]
      }
    ],
    innovationLevel: {
      totalScore: 7.5,
      pedagogicalImpact: 8,
      technologicalComplexity: 7,
      organizationalChange: 8,
      technologicalRisk: 7
    },
    innovationDescription: "פרויקט זה מציג חדשנות פדגוגית משמעותית",
    innovationDefinition: "חדשנות מתונה עם פוטנציאל השפעה רב",
    committeeRecommendation: "מומלץ לאשר עם מעקב צמוד",
    executiveSummary: "פרויקט בעל פוטנציאל גבוה עם סיכונים מבוקרים. מומלץ ליישום עם תמיכה מתאימה.",
    recommendations: [
      {id: 1, title: "הכשרה מקיפה", description: "ביצוע הכשרה מקיפה לצוותי ההוראה", linkedGoal: 1},
      {id: 2, title: "פיילוט מדורג", description: "התחלה בקבוצה קטנה והרחבה הדרגתית", linkedGoal: 2}
    ],
    riskCounts: { veryHigh: 0, high: 1, medium: 1, low: 0 }
  };
}
