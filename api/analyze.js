// api/analyze.js - Vercel Serverless Function
export default async function handler(req, res) {
  // הגדרת CORS
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
    const { documentText, options } = req.body;

    if (!documentText) {
      return res.status(400).json({ 
        error: 'חסר טקסט מסמך לניתוח' 
      });
    }

    // בדיקת מפתח Claude
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: 'מפתח Claude API לא מוגדר' 
      });
    }

    // בניית הפרומפט EZRA 5.0
    const prompt = buildEZRAPrompt(documentText, options);

    // קריאה ל-Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error('Claude API Error:', errorData);
      return res.status(500).json({ 
        error: `שגיאת Claude API: ${claudeResponse.status}` 
      });
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0]) {
      return res.status(500).json({ 
        error: 'תגובה ריקה מ-Claude' 
      });
    }

    // ניתוח התגובה
    let reportData;
    try {
      const responseText = claudeData.content[0].text;
      
      // ניקוי הטקסט מסימנים מיותרים
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      reportData = JSON.parse(cleanedText);
      
      // חישוב ספירת סיכונים
      reportData.riskCounts = calculateRiskCounts(reportData.risks || []);
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', claudeData.content[0].text);
      return res.status(500).json({ 
        error: 'שגיאה בפענוח תגובת Claude' 
      });
    }

    // החזרת הנתונים
    res.status(200).json(reportData);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'שגיאה פנימית בשרת' 
    });
  }
}

// פונקציה לבניית פרומפט EZRA
function buildEZRAPrompt(documentText, options = {}) {
  const { projectName, organization, customInstructions } = options;

  return `
אתה מומחה לניהול סיכונים במערכת החינוך. אני מעלה אליך מסמך תפיסה ואתה צריך ליצור דוח ניהול סיכונים מקצועי ומפורט.

🎯 המשימה שלך:
1. נתח את מסמך התפיסה לעומק
2. זהה בדיוק 3 מטרות מרכזיות
3. גזור מהמטרות 4-5 סיכונים עיקריים (כל סיכון מקושר למטרה)
4. צור דוח JSON מובנה לפי התבנית המדויקת

⚠️ הוראות מדויקות לביצוע:

🔄 זרימה לוגית חובה:
1. זהה 3 מטרות מרכזיות מהמסמך (לא יותר!)
2. לכל מטרה - גזור סיכונים ישירים וציין בכל סיכון "(נגזר ממטרה X: שם המטרה)"
3. המלצות סוף הדוח חייבות לתת מענה קונקרטי וישיר לכל אחת מ-3 המטרות

📚 דגשים פדגוגיים חובה:
- התמקד בהיבטים חינוכיים ופדגוגיים בלבד
- אסור להזכיר נתונים כלכליים מספריים (תקציבים, עלויות וכו')
- התייחס לסיכונים פדגוגיים: איכות הוראה, השפעה על תלמידים, פערים לימודיים
- כל ניתוח חייב להתמקד בהשפעה על התהליך החינוכי

📊 חישוב רמת חדשנות (ציון 1-10):
- השפעה פדגוגית: עמקות השינוי בהוראה-למידה
- מורכבות טכנולוגית: רמת הטכנולוגיה החדשה
- שינוי ארגוני: עומק השינוי במבנה הארגון  
- סיכון טכנולוגי: רמת אי הוודאות הטכנולוגית
ציון סופי = ממוצע של 4 הרכיבים

⚠️ דרישות סיכונים:
- זהה 4-5 סיכונים מרכזיים (כל אחד מקושר למטרה)
- חשב חומרה: הסתברות (1-10) × נזק (1-10)
- רמות: גבוהה מאוד (81-100), גבוהה (49-80), בינונית (25-48), נמוכה (1-24)
- כל סיכון חייב: קישור למטרה + תיאור + השלכות + הזדמנויות

📤 פורמט התגובה:
השב אך ורק בפורמט JSON תקין הבא (אל תוסיף טקסט נוסף):

{
  "projectName": "${projectName || 'שם הפרויקט'}",
  "organization": "${organization || 'שם הארגון'}",
  "projectManager": "שם מנהל הפרויקט מהמסמך",
  "projectScope": "תיאור היקף הפרויקט",
  "timeline": "לוח זמנים של הפרויקט",
  "projectType": "סוג הפרויקט",
  "regulatoryPartners": "שותפים רגולטוריים",
  
  "goals": [
    {
      "id": 1,
      "title": "מטרה 1: כותרת קצרה",
      "description": "תיאור מפורט של המטרה"
    },
    {
      "id": 2,
      "title": "מטרה 2: כותרת קצרה", 
      "description": "תיאור מפורט של המטרה"
    },
    {
      "id": 3,
      "title": "מטרה 3: כותרת קצרה",
      "description": "תיאור מפורט של המטרה"
    }
  ],
  
  "deliverables": [
    "תוצר 1",
    "תוצר 2",
    "תוצר 3",
    "תוצר 4"
  ],
  
  "risks": [
    {
      "id": 1,
      "title": "שם הסיכון",
      "linkedGoal": 1,
      "linkedGoalTitle": "שם המטרה המקושרת",
      "probability": 8,
      "impact": 9,
      "severity": 72,
      "severityLevel": "גבוהה",
      "description": "תיאור מפורט של הסיכון (נגזר ממטרה X: שם המטרה)",
      "impacts": [
        "השלכה 1",
        "השלכה 2",
        "השלכה 3"
      ],
      "opportunities": [
        "הזדמנות 1",
        "הזדמנות 2"
      ]
    }
  ],
  
  "strategies": [
    {
      "id": 1,
      "title": "אסטרטגיה 1",
      "description": "תיאור האסטרטגיה",
      "objectives": "מטרות האסטרטגיה",
      "methods": "אמצעים וכלים",
      "timeline": "לוח זמנים",
      "successMetrics": "מדדי הצלחה"
    }
  ],
  
  "innovationLevel": {
    "totalScore": 8.0,
    "pedagogicalImpact": 8.5,
    "technologicalComplexity": 7.5,
    "organizationalChange": 8.0,
    "technologicalRisk": 8.0
  },
  
  "innovationDescription": "תיאור החדשנות בפרויקט",
  "innovationDefinition": "הגדרת רמת החדשנות",
  "committeeRecommendation": "המלצה לאסדרת חדשנות",
  
  "executiveSummary": "סיכום מנהלים מפורט",
  
  "recommendations": [
    {
      "id": 1,
      "title": "המלצה 1",
      "description": "תיאור מפורט של ההמלצה הקונקרטית לוועדה",
      "linkedGoal": 1
    }
  ]
}

${customInstructions ? `\n🔧 הוראות נוספות מהמשתמש:\n${customInstructions}\n` : ''}

📄 מסמך התפיסה לניתוח:

${documentText}

זכור: השב אך ורק בפורמט JSON תקין ללא טקסט נוסף!
`;
}

// פונקציה לחישוב ספירת סיכונים
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
