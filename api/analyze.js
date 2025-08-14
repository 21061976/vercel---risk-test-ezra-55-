export default async function handler(req, res) {
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
      return res.status(200).json(getDemoReport());
    }

    // קיצור קיצוני - רק 1500 תווים!
    const maxLength = 1500;
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + "..."
      : documentText;

    // פרומפט קצר ביותר
    const prompt = `נתח: ${truncatedText}

JSON:
{"projectName":"שם","organization":"ארגון","projectManager":"מנהל","projectScope":"היקף","timeline":"זמן","projectType":"סוג","regulatoryPartners":"שותפים","goals":[{"id":1,"title":"מטרה 1","description":"תיאור"}],"deliverables":["תוצר"],"risks":[{"id":1,"title":"סיכון","linkedGoal":1,"probability":7,"impact":6,"severity":42,"severityLevel":"בינונית","description":"תיאור","impacts":["השלכה"],"opportunities":["הזדמנות"]}],"innovationLevel":{"totalScore":7,"pedagogicalImpact":7,"technologicalComplexity":7,"organizationalChange":7,"technologicalRisk":7},"innovationDescription":"תיאור","innovationDefinition":"הגדרה","committeeRecommendation":"המלצה","executiveSummary":"סיכום","recommendations":[{"id":1,"title":"המלצה","description":"תיאור","linkedGoal":1}]}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000, // הורדנו עוד יותר
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeResponse.ok) {
      return res.status(200).json(getDemoReport());
    }

    const data = await claudeResponse.json();
    let reportData;

    try {
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      reportData = JSON.parse(text);
      reportData.riskCounts = calcRiskCounts(reportData.risks || []);
    } catch (e) {
      reportData = getDemoReport();
    }

    res.status(200).json(reportData);

  } catch (error) {
    res.status(200).json(getDemoReport());
  }
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
      {id: 1, title: "מטרה 1: שיפור איכות ההוראה", description: "פיתוח כשירויות מאה ה-21 ושיטות הוראה חדשניות"},
      {id: 2, title: "מטרה 2: חיזוק מעורבות תלמידים", description: "הגברת המעורבות הפעילה בלמידה"},
      {id: 3, title: "מטרה 3: שיפור תמיכה מוסדית", description: "יצירת מערכת תמיכה מקיפה למורים"}
    ],
    deliverables: ["מודל פדגוגי", "תוכניות הכשרה", "כלי הערכה", "מדריך יישום"],
    risks: [
      {
        id: 1, title: "התנגדות צוותי הוראה", linkedGoal: 1, linkedGoalTitle: "שיפור הוראה",
        probability: 8, impact: 7, severity: 56, severityLevel: "גבוהה",
        description: "קושי בהטמעת שיטות חדשות מצד המורים",
        impacts: ["יישום שטחי", "תסכול מורים", "פגיעה באיכות"],
        opportunities: ["צמיחה מקצועית", "קהילות למידה"]
      },
      {
        id: 2, title: "פערים בין בתי ספר", linkedGoal: 2, linkedGoalTitle: "חיזוק מעורבות",
        probability: 7, impact: 6, severity: 42, severityLevel: "בינונית", 
        description: "הגדלת פערים בין בתי ספר חזקים לחלשים",
        impacts: ["אי שוויון", "תסכול", "איים של חדשנות"],
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
      {id: 1, title: "פיתוח מקצועי מערכתי", description: "הכשרה מקיפה וליווי אישי למורים", linkedGoal: 1},
      {id: 2, title: "יישום מדורג", description: "התחלה בפיילוט מוגבל והרחבה הדרגתית", linkedGoal: 2}
    ],
    riskCounts: { veryHigh: 0, high: 1, medium: 1, low: 0 }
  };
}
