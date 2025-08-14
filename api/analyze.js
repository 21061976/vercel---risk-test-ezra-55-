export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request received:', req.body);

    const { documentText, options = {} } = req.body || {};
    
    if (!documentText || documentText.trim() === '') {
      return res.status(400).json({ error: 'חסר טקסט מסמך או הטקסט ריק' });
    }

    // בדיקת API Key
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    console.log('API Key exists:', !!CLAUDE_API_KEY);
    
    if (!CLAUDE_API_KEY) {
      console.log('API Key missing, returning demo report');
      return res.status(200).json(getDemoReport());
    }

    // קיצור טקסט מחמיר יותר
    const maxLength = 1200;
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + "..."
      : documentText;

    console.log('Text length:', truncatedText.length);

    // בניית פרומפט מחמיר יותר
    const analysisContext = options.analysisType || 'standard';
    const riskFocus = options.riskFocus || 'balanced';
    
    const prompt = `תפקידך: מנתח מסמכי תפיסה ויוצר דוח ניהול סיכונים.

טקסט לניתוח: "${truncatedText}"

הנחיות:
- התמקד ב${analysisContext === 'educational' ? 'היבטים חינוכיים' : analysisContext === 'technological' ? 'טכנולוגיה' : 'ניתוח כללי'}
- גישה לסיכונים: ${riskFocus === 'conservative' ? 'שמרנית' : riskFocus === 'optimistic' ? 'אופטימית' : 'מאוזנת'}

צור JSON מדויק עם המבנה הבא (חובה להחזיר JSON תקין בלבד):

{
  "projectName": "שם הפרויקט מהמסמך",
  "organization": "הארגון המוזכר",
  "projectManager": "מנהל הפרויקט או 'לא צוין'",
  "projectScope": "היקף הפרויקט",
  "timeline": "לוח זמנים",
  "projectType": "סוג הפרויקט",
  "regulatoryPartners": "שותפים רגולטוריים",
  "goals": [
    {
      "id": 1,
      "title": "מטרה ראשונה",
      "description": "תיאור המטרה"
    }
  ],
  "deliverables": ["תוצר 1", "תוצר 2"],
  "risks": [
    {
      "id": 1,
      "title": "שם הסיכון",
      "linkedGoal": 1,
      "probability": 7,
      "impact": 6,
      "severity": 42,
      "severityLevel": "בינונית",
      "description": "תיאור הסיכון",
      "impacts": ["השלכה 1", "השלכה 2"],
      "opportunities": ["הזדמנות 1"]
    }
  ],
  "innovationLevel": {
    "totalScore": 7.5,
    "pedagogicalImpact": 8,
    "technologicalComplexity": 7,
    "organizationalChange": 8,
    "technologicalRisk": 7
  },
  "innovationDescription": "תיאור החדשנות",
  "innovationDefinition": "הגדרת החדשנות",
  "committeeRecommendation": "המלצה לוועדה",
  "executiveSummary": "סיכום מנהלים",
  "recommendations": [
    {
      "id": 1,
      "title": "המלצה ראשונה",
      "description": "תיאור ההמלצה",
      "linkedGoal": 1
    }
  ]
}

חזר רק JSON תקין, ללא טקסט נוסף או הסברים!`;

    console.log('Sending request to Claude...');

    // קריאה ל-Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ 
          role: 'user', 
          content: prompt 
        }]
      })
    });

    console.log('Claude response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      
      // במקרה של שגיאה, החזר דמו
      return res.status(200).json(getDemoReport());
    }

    const data = await claudeResponse.json();
    console.log('Claude response received');

    let reportData;

    try {
      // ניקוי תגובת Claude מקוד מרקדאון
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      console.log('Parsing Claude response...');
      reportData = JSON.parse(responseText);
      
      // חישוב מונה סיכונים
      reportData.riskCounts = calculateRiskCounts(reportData.risks || []);
      
      console.log('Report generated successfully');

    } catch (parseError) {
      console.error('JSON Parse error:', parseError);
      console.log('Raw response:', data.content[0].text);
      
      // החזר דמו במקרה של שגיאת פרסור
      reportData = getDemoReport();
    }

    return res.status(200).json(reportData);

  } catch (error) {
    console.error('General error:', error);
    
    // החזר דמו במקרה של שגיאה כללית
    return res.status(200).json(getDemoReport());
  }
}

function calculateRiskCounts(risks) {
  const counts = { veryHigh: 0, high: 0, medium: 0, low: 0 };
  
  risks.forEach(risk => {
    const severity = risk.severity || (risk.probability * risk.impact);
    
    if (severity >= 81) counts.veryHigh++;
    else if (severity >= 49) counts.high++;
    else if (severity >= 25) counts.medium++;
    else counts.low++;
  });
  
  return counts;
}

function getDemoReport() {
  return {
    projectName: "פרויקט חדשנות פדגוגית",
    organization: "משרד החינוך",
    projectManager: "ד\"ר מנהל פרויקט",
    projectScope: "הטמעת מודל חדשני במערכת החינוך",
    timeline: "3 שנים (2025-2028)",
    projectType: "פרויקט חדשנות פדגוגית",
    regulatoryPartners: "אגף מו״פ, ניסויים ויוזמות",
    goals: [
      {
        id: 1,
        title: "שיפור איכות ההוראה",
        description: "פיתוח כשירויות מאה ה-21 ושיטות הוראה חדשניות"
      },
      {
        id: 2,
        title: "חיזוק מעורבות תלמידים",
        description: "הגברת המעורבות הפעילה בלמידה"
      },
      {
        id: 3,
        title: "שיפור תמיכה מוסדית",
        description: "יצירת מערכת תמיכה מקיפה למורים"
      }
    ],
    deliverables: ["מודל פדגוגי", "תוכניות הכשרה", "כלי הערכה", "מדריך יישום"],
    risks: [
      {
        id: 1,
        title: "התנגדות צוותי הוראה",
        linkedGoal: 1,
        linkedGoalTitle: "שיפור הוראה",
        probability: 8,
        impact: 7,
        severity: 56,
        severityLevel: "גבוהה",
        description: "קושי בהטמעת שיטות חדשות מצד המורים",
        impacts: ["יישום שטחי", "תסכול מורים", "פגיעה באיכות"],
        opportunities: ["צמיחה מקצועית", "קהילות למידה"]
      },
      {
        id: 2,
        title: "פערים בין בתי ספר",
        linkedGoal: 2,
        linkedGoalTitle: "חיזוק מעורבות",
        probability: 7,
        impact: 6,
        severity: 42,
        severityLevel: "בינונית",
        description: "הגדלת פערים בין בתי ספר חזקים לחלשים",
        impacts: ["אי שוויון", "תסכול", "איום של חדשנות"],
        opportunities: ["תמיכה דיפרנציאלית", "בתי ספר מדגימים"]
      }
    ],
    innovationLevel: {
      totalScore: 8.0,
      pedagogicalImpact: 8.5,
      technologicalComplexity: 7.0,
      organizationalChange: 8.5,
      technologicalRisk: 7.5
    },
    innovationDescription: "פרויקט חדשנות פדגוגית משמעותי המשנה את דרכי ההוראה והלמידה",
    innovationDefinition: "חדשנות משבשת הדורשת מרחב רגולטורי מותאם",
    committeeRecommendation: "מומלץ לאישור עם הכנה מקדימה מקיפה ומעקב צמוד",
    executiveSummary: "פרויקט אסטרטגי חיוני עם פוטנציאל השפעה גבוה. הסיכונים ניתנים לניהול באמצעות הכנה מתאימה ותמיכה מתמשכת.",
    recommendations: [
      {
        id: 1,
        title: "פיתוח מקצועי מערכתי",
        description: "הכשרה מקיפה וליווי אישי למורים",
        linkedGoal: 1
      },
      {
        id: 2,
        title: "יישום מדורג",
        description: "התחלה בפיילוט מוגבל והרחבה הדרגתית",
        linkedGoal: 2
      }
    ],
    riskCounts: { veryHigh: 0, high: 1, medium: 1, low: 0 }
  };
}
