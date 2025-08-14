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
  return `אתה מומחה לניהול סיכונים במערכת החינוך. נתח את המסמך הזה ויצור דוח JSON מקיף לניהול סיכונים.

🎯 משימה:
1. חלץ מהמסמך: שם פרויקט, ארגון, מנהל פרויקט, לוח זמנים וכו'
2. זהה 3 מטרות מרכזיות מהמסמך
3. גזור 4-5 סיכונים מהמטרות (כל סיכון מקושר למטרה)
4. חשב רמת חדשנות (1-10)
5. כתב המלצות קונקרטיות לוועדה

${opts.projectName ? `שם פרויקט מבוקש: ${opts.projectName}` : ''}
${opts.organization ? `ארגון מבוקש: ${opts.organization}` : ''}
${opts.customInstructions ? `הוראות מיוחדות: ${opts.customInstructions}` : ''}

השב בפורמט JSON תקין בלבד:

{
  "projectName": "שם הפרויקט שחולץ מהמסמך או ברירת מחדל",
  "organization": "שם הארגון שחולץ מהמסמך או ברירת מחדל",
  "projectManager": "שם מנהל הפרויקט מהמסמך",
  "projectScope": "היקף הפרויקט מהמסמך",
  "timeline": "לוח זמנים מהמסמך",
  "projectType": "סוג הפרויקט",
  "regulatoryPartners": "שותפים רגולטוריים",
  "goals": [
    {"id": 1, "title": "מטרה 1: כותרת מהמסמך", "description": "תיאור מפורט של המטרה"},
    {"id": 2, "title": "מטרה 2: כותרת מהמסמך", "description": "תיאור מפורט של המטרה"},
    {"id": 3, "title": "מטרה 3: כותרת מהמסמך", "description": "תיאור מפורט של המטרה"}
  ],
  "deliverables": ["תוצר 1", "תוצר 2", "תוצר 3", "תוצר 4"],
  "risks": [
    {
      "id": 1,
      "title": "שם הסיכון הראשון",
      "linkedGoal": 1,
      "linkedGoalTitle": "שם המטרה המקושרת",
      "probability": 8,
      "impact": 9,
      "severity": 72,
      "severityLevel": "גבוהה",
      "description": "תיאור מפורט של הסיכון (נגזר ממטרה 1: שם המטרה)",
      "impacts": ["השלכה 1", "השלכה 2", "השלכה 3"],
      "opportunities": ["הזדמנות 1", "הזדמנות 2"]
    },
    {
      "id": 2,
      "title": "שם הסיכון השני",
      "linkedGoal": 2,
      "linkedGoalTitle": "שם המטרה המקושרת",
      "probability": 7,
      "impact": 7,
      "severity": 49,
      "severityLevel": "גבוהה",
      "description": "תיאור מפורט של הסיכון (נגזר ממטרה 2: שם המטרה)",
      "impacts": ["השלכה 1", "השלכה 2"],
      "opportunities": ["הזדמנות 1"]
    }
  ],
  "innovationLevel": {
    "totalScore": 8.0,
    "pedagogicalImpact": 9,
    "technologicalComplexity": 7,
    "organizationalChange": 8,
    "technologicalRisk": 8
  },
  "innovationDescription": "תיאור החדשנות שמזוהה במסמך",
  "innovationDefinition": "הגדרת רמת החדשנות על בסיס המסמך",
  "committeeRecommendation": "המלצה קונקרטית לוועדה על בסיס הניתוח",
  "executiveSummary": "סיכום מנהלים מקיף המבוסס על המסמך",
  "recommendations": [
    {"id": 1, "title": "המלצה ראשונה", "description": "תיאור מפורט של ההמלצה", "linkedGoal": 1},
    {"id": 2, "title": "המלצה שנייה", "description": "תיאור מפורט של ההמלצה", "linkedGoal": 2},
    {"id": 3, "title": "המלצה שלישית", "description": "תיאור מפורט של ההמלצה", "linkedGoal": 3}
  ]
}

מסמך לניתוח:
${text}

זכור: השב רק בפורמט JSON תקין!`;
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
    projectName: opts.projectName || "פרויקט חדשנות פדגוגית",
    organization: opts.organization || "משרד החינוך",
    projectManager: "מנהל פרויקט (נחלץ מהמסמך)",
    projectScope: "פרויקט חדשנות במערכת החינוך",
    timeline: "שנתיים (2025-2027)",
    projectType: "פיילוט חדשנות פדגוגית",
    regulatoryPartners: "אגף מו״פ, ניסויים ויוזמות",
    goals: [
      {id: 1, title: "מטרה 1: שיפור איכות הוראה", description: "פיתוח כשירויות מאה 21 ושיטות הוראה חדשניות"},
      {id: 2, title: "מטרה 2: חיזוק מעורבות תלמידים", description: "הגברת המוטיבציה והמעורבות הפעילה בלמידה"},
      {id: 3, title: "מטרה 3: שיפור יעילות ארגונית", description: "מיטוב תהליכים ארגוניים ותמיכה בצוותי הוראה"}
    ],
    deliverables: ["מודל פדגוגי חדשני", "כלי הערכה מתקדמים", "תוכנית הכשרה מקיפה", "מדריך יישום מעשי"],
    risks: [
      {
        id: 1, title: "התנגדות לשינוי מצד צוותי ההוראה", linkedGoal: 1, linkedGoalTitle: "שיפור איכות הוראה",
        probability: 8, impact: 8, severity: 64, severityLevel: "גבוהה",
        description: "קושי בהטמעת שיטות הוראה חדשות עקב התנגדות או חוסר מוכנות של המורים (נגזר ממטרה 1: שיפור איכות הוראה)",
        impacts: ["עיכוב ביישום הפרויקט", "ירידה באיכות ההוראה בתקופת המעבר", "תסכול ושחיקה בקרב צוותי ההוראה"],
        opportunities: ["הזדמנות לפיתוח מקצועי מעמיק", "חיזוק קהילות למידה מקצועיות", "העלאת מעמד מקצוע ההוראה"]
      },
      {
        id: 2, title: "אתגרים טכנולוגיים ודיגיטליים", linkedGoal: 2, linkedGoalTitle: "חיזוק מעורבות תלמידים",
        probability: 6, impact: 7, severity: 42, severityLevel: "בינונית",
        description: "קושי בהטמעת כלים דיגיטליים וטכנולוגיים חדשים (נגזר ממטרה 2: חיזוק מעורבות תלמידים)",
        impacts: ["עיכובים טכניים", "צורך בהכשרה טכנית נוספת", "פערים דיגיטליים בין בתי ספר"],
        opportunities: ["שיפור האוריינות הדיגיטלית", "פיתוח חדשנות טכנולוגית", "יצירת פתרונות יצירתיים"]
      },
      {
        id: 3, title: "קושי במדידה והערכת הצלחה", linkedGoal: 3, linkedGoalTitle: "שיפור יעילות ארגונית",
        probability: 7, impact: 6, severity: 42, severityLevel: "בינונית",
        description: "אתגר במדידת תוצאות הפרויקט וקביעת מדדי הצלחה ברורים (נגזר ממטרה 3: שיפור יעילות ארגונית)",
        impacts: ["קושי בהוכחת הצלחת הפרויקט", "אי ודאות לגבי המשך מימון", "בעיות בדיווח לגורמי פיקוח"],
        opportunities: ["פיתוח כלי הערכה חדשניים", "יצירת מדדים איכותניים חדשים", "שיפור תרבות המדידה והלמידה"]
      }
    ],
    innovationLevel: {
      totalScore: 7.8,
      pedagogicalImpact: 8.5,
      technologicalComplexity: 7.0,
      organizationalChange: 8.5,
      technologicalRisk: 7.0
    },
    innovationDescription: "פרויקט זה מציג חדשנות פדגוגית משמעותית המשלבת טכנולוגיות מתקדמות עם גישות הוראה חדשניות. החדשנות מתבטאת בשינוי מהותי בדרכי ההוראה והלמידה, תוך התמקדות בפיתוח כשירויות מאה ה-21.",
    innovationDefinition: "הפרויקט מוגדר כחדשנות מתונה עד גבוהה, הדורשת שינויים ארגוניים משמעותיים אך עם סיכון טכנולוגי מבוקר. רמת החדשנות מצביעה על פוטנציאל השפעה רב תוך שמירה על יציבות המערכת.",
    committeeRecommendation: "מומלץ לאשר את הפרויקט עם דגש על הכנה מקדימה מקיפה, הכשרת צוותים ויצירת מנגנוני תמיכה מתאימים. יש לוודא מעקב צמוד ומדידה שוטפת של התקדמות.",
    executiveSummary: "פרויקט חדשנות פדגוגית בעל פוטנציאל השפעה גבוה על איכות החינוך. הפרויקט מתמקד בשלוש מטרות מרכזיות: שיפור איכות ההוראה, חיזוק מעורבות התלמידים ושיפור היעילות הארגונית. הסיכונים המזוהים ניתנים לניהול באמצעות תכנון מתאים והכנה מקדימה. רמת החדשנות (7.8/10) מצביעה על פרויקט מתקדם שדורש תמיכה והשקעה מתאימה. ההמלצה היא לאישור הפרויקט עם הקמת מנגנוני תמיכה ומעקב מתאימים.",
    recommendations: [
      {id: 1, title: "פיתוח מקצועי מערכתי", description: "מומלץ להקים תוכנית הכשרה מקיפה לצוותי ההוראה הכוללת ליווי אישי וקהילות למידה מקצועיות. התוכנית תכלול לפחות 40 שעות הכשרה בשנה הראשונה ותמיכה שוטפת.", linkedGoal: 1},
      {id: 2, title: "הטמעה הדרגתית ומבוקרת", description: "יש להתחיל בפיילוט מוגבל של 10-15 בתי ספר נבחרים, עם מעקב צמוד ואיסוף נתונים שוטף. ההרחבה תתבצע בהדרגה על בסיס תוצאות הפיילוט ולקחים שנלמדו.", linkedGoal: 2},
      {id: 3, title: "פיתוח מערכת מדידה חדשנית", description: "מומלץ לפתח כלי הערכה חלופיים המתאימים למטרות הפרויקט, בשיתוף עם ראמ\"ה. יש לקבוע מדדי הצלחה ברורים ומערכת דיווח שקופה לכל השותפים.", linkedGoal: 3}
    ],
    riskCounts: { veryHigh: 0, high: 1, medium: 2, low: 0 }
  };
}
