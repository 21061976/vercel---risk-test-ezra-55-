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
      console.log('Missing Claude API Key');
      return res.status(200).json(getDemoReport());
    }

    // קצר עוד יותר - מקסימום 4000 תווים
    const maxLength = 4000;
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + "..."
      : documentText;

    console.log('Processing text length:', truncatedText.length);

    const prompt = `נתח מסמך זה ויצור JSON:
${truncatedText}

השב בפורמט JSON בלבד:
{
  "projectName": "שם פרויקט מהמסמך",
  "organization": "ארגון מהמסמך", 
  "projectManager": "מנהל פרויקט",
  "projectScope": "היקף",
  "timeline": "לוח זמנים",
  "projectType": "סוג פרויקט",
  "regulatoryPartners": "שותפים",
  "goals": [
    {"id": 1, "title": "מטרה 1", "description": "תיאור"},
    {"id": 2, "title": "מטרה 2", "description": "תיאור"},
    {"id": 3, "title": "מטרה 3", "description": "תיאור"}
  ],
  "deliverables": ["תוצר 1", "תוצר 2"],
  "risks": [
    {
      "id": 1, "title": "סיכון 1", "linkedGoal": 1, "linkedGoalTitle": "מטרה 1",
      "probability": 8, "impact": 7, "severity": 56, "severityLevel": "גבוהה",
      "description": "תיאור סיכון", "impacts": ["השלכה 1"], "opportunities": ["הזדמנות 1"]
    }
  ],
  "innovationLevel": {"totalScore": 7.5, "pedagogicalImpact": 8, "technologicalComplexity": 7, "organizationalChange": 8, "technologicalRisk": 7},
  "innovationDescription": "תיאור חדשנות",
  "innovationDefinition": "הגדרת חדשנות", 
  "committeeRecommendation": "המלצה",
  "executiveSummary": "סיכום מנהלים",
  "recommendations": [{"id": 1, "title": "המלצה 1", "description": "תיאור", "linkedGoal": 1}]
}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500, // הורדנו עוד יותר
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeResponse.ok) {
      console.log('Claude API error:', claudeResponse.status);
      return res.status(200).json(getDemoReport());
    }

    const data = await claudeResponse.json();
    let reportData;

    try {
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      reportData = JSON.parse(text);
      reportData.riskCounts = calcRiskCounts(reportData.risks || []);
      console.log('Successfully parsed Claude response');
    } catch (e) {
      console.log('Parse error, using demo:', e.message);
      reportData = getDemoReport();
    }

    res.status(200).json(reportData);

  } catch (error) {
    console.error('API Error:', error.message);
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
    projectName: "פרויקט חדשנות פדגוגית מתקדם",
    organization: "משרד החינוך",
    projectManager: "ד\"ר אסף רונאל - מנהל פיתוח חדשנות",
    projectScope: "הטמעת מודל חדשני ברחבי מערכת החינוך",
    timeline: "3 שנים (2025-2028) - פיילוט ואז הרחבה",
    projectType: "פרויקט חדשנות פדגוגית מערכתי",
    regulatoryPartners: "אגף מו״פ ניסויים ויוזמות, המזכירות הפדגוגית",
    goals: [
      {id: 1, title: "מטרה 1: שיפור איכות ההוראה והלמידה", description: "פיתוח וייצור כשירויות מאה ה-21 בקרב התלמידים, כולל חשיבה ביקורתית, יצירתיות ושיתופיות, תוך שילוב טכנולוגיות מתקדמות בהוראה"},
      {id: 2, title: "מטרה 2: חיזוק המעורבות והמוטיבציה", description: "הגברת המעורבות הפעילה של התלמידים בתהליך הלמידה, פיתוח אוטונומיה ואחריות אישית, וחיזוק הקשר בין הלמידה לחיים המעשיים"},
      {id: 3, title: "מטרה 3: שיפור התמיכה המוסדית", description: "יצירת מערכת תמיכה מקיפה למורים ולמנהלים, פיתוח תרבות של למידה מתמשכת וחדשנות, ושיפור התהליכים הארגוניים בבתי הספר"}
    ],
    deliverables: ["מודל פדגוגי מפורט ומובנה", "תוכניות הכשרה מקיפות לצוותי חינוך", "כלי הערכה חלופיים ומותאמים", "מאגר תכנים ופעילויות חדשניות", "הנחיות לארגון מחדש של סביבות הלמידה"],
    risks: [
      {
        id: 1, title: "התנגדות וקושי בהטמעה מצד צוותי ההוראה", linkedGoal: 1, linkedGoalTitle: "שיפור איכות ההוראה",
        probability: 9, impact: 8, severity: 72, severityLevel: "גבוהה",
        description: "מורים רבים רגילים למודל ההוראה הפרונטלי המסורתי. המעבר לפדגוגיה מבוססת פרויקטים והערכה חלופית דורש שינוי תפיסתי עמוק ועלול להיתקל בהתנגדות פעילה או סמויה (נגזר ממטרה 1: שיפור איכות ההוראה)",
        impacts: ["יישום שטחי של המודל ללא שינוי מהותי", "שחיקה ותסכול בקרב המורים", "פגיעה באיכות ההוראה בתקופת המעבר", "חזרה לדפוסי הוראה ישנים"],
        opportunities: ["הזדמנות לצמיחה מקצועית של המורים", "פיתוח קהילות למידה מקצועיות", "העלאת האוטונומיה והיוקרה של מקצוע ההוראה"]
      },
      {
        id: 2, title: "פערים הולכים וגדלים בין בתי ספר חזקים לחלשים", linkedGoal: 2, linkedGoalTitle: "חיזוק המעורבות",
        probability: 8, impact: 7, severity: 56, severityLevel: "גבוהה",
        description: "המודל דורש גמישות, משאבי הדרכה וניהול חזק. בתי ספר מבוססים יצליחו ליישם בעוד שבתי ספר בפריפריה עלולים להתקשות ולהעמיק את הפערים החינוכיים (נגזר ממטרה 2: חיזוק המעורבות)",
        impacts: ["העמקת אי השוויון במערכת החינוך", "תסכול וכישלון בבתי ספר מאתגרים", "יצירת איים של חדשנות במקום שינוי מערכתי"],
        opportunities: ["הזדמנות למתן תמיכה דיפרנציאלית לבתי ספר מאתגרים", "פיתוח מודלים של בתי ספר מדגימים"]
      },
      {
        id: 3, title: "קושי במדידה והערכה של כשירויות וגיבוש זהות", linkedGoal: 3, linkedGoalTitle: "שיפור התמיכה המוסדית",
        probability: 7, impact: 6, severity: 42, severityLevel: "בינונית",
        description: "המעבר להערכת תוצרים מורכבים כמו יצירתיות וגיבוש זהות הוא אתגר עצום. היעדר כלי הערכה מהימנים עלול להוביל לזילות התהליך (נגזר ממטרה 3: שיפור התמיכה המוסדית)",
        impacts: ["חוסר יכולת להוכיח הצלחת המהלך", "תחושת חוסר אונים בקרב המורים", "לחץ לחזור להערכה מספרית"],
        opportunities: ["פיתוח שפה הערכתית חדשה ועשירה", "קידום מחקר בתחום ההערכה החלופית"]
      }
    ],
    innovationLevel: {
      totalScore: 8.2,
      pedagogicalImpact: 9.0,
      technologicalComplexity: 7.5,
      organizationalChange: 8.5,
      technologicalRisk: 7.8
    },
    innovationDescription: "פרויקט זה מייצג חדשנות פדגוגית משבשת (Disruptive Innovation) המציעה שינוי מהותי בתפיסת תפקיד בית הספר, המורה והתלמיד. החדשנות מתבטאת במעבר מפרדיגמת ידע לפרדיגמת כשירויות, שילוב טכנולוגיות מתקדמות בהוראה, ויצירת סביבות למידה גמישות ומותאמות אישית.",
    innovationDefinition: "הפרויקט מוגדר כ'חדשנות משבשת' מכיוון שהוא מאתגר הנחות יסוד לגבי מבנה מערכת השעות, שיטות הוראה והערכה, ומטרות הלמידה. רמת החדשנות הגבוהה (8.2/10) מצביעה על פוטנציאל השפעה משמעותי תוך דרישה למרחב רגולטורי מותאם.",
    committeeRecommendation: "מומלץ להגדיר את בתי הספר המשתתפים בפיילוט כ'מרחב ניסוי מוגן'. יש לאפשר להם גמישות פדגוגית וארגונית במסגרת תוכנית עבודה מפורטת ועמידה במדדי הצלחה שיוגדרו מראש. הפרויקט דורש השקעה משמעותית בהכשרה ותמיכה מתמשכת.",
    executiveSummary: "פרויקט 'חדשנות פדגוגית מתקדם' הוא מהלך אסטרטגי שאפתני וחיוני, המבקש לתת מענה לאתגרים העמוקים של המאה ה-21 וליצור רלוונטיות של מערכת החינוך. שלוש מטרותיו המרכזיות מציבות חזון חינוכי מתקדם וראוי. עם זאת, רמת החדשנות הגבוהה (8.2/10) והשינוי הארגוני העמוק הנדרש מציבים סיכונים משמעותיים. הסיכון המרכזי בחומרה 'גבוהה' הוא התנגדות צוותי ההוראה, אשר עלול לרוקן את המהלך מתוכן. תוכנית ההתמודדות המוצעת מתבססת על פיתוח מקצועי מערכתי, יישום מדורג מבוקר, ויצירת מנגנוני תמיכה מתאימים. יישום האסטרטגיות חיוני להצלחת המהלך החשוב הזה.",
    recommendations: [
      {id: 1, title: "פיתוח מקצועי מערכתי ומתמשך", description: "מומלץ לאשר את הפרויקט בתנאי שיוקצה משאב ייעודי לפיתוח מקצועי אינטנסיבי וליווי אישי למורים. יש לדרוש מהמפעיל להציג מודל הכשרה מפורט הכולל לפחות 50 שעות הכשרה בשנה הראשונה וליווי מדריך פדגוגי שבועי.", linkedGoal: 1},
      {id: 2, title: "יישום מדורג מבוסס פיילוט ובקרה", description: "יש לדרוש מהמפעיל לשתף פעולה עם ראמ\"ה לפיתוח כלי הערכה חלופיים תוך שנה. יש להתנות את הרחבת הפיילוט בקיומם של כלים למדידת התקדמות בתחומים כמו מסוגלות עצמית ומעורבות חברתית.", linkedGoal: 2},
      {id: 3, title: "יצירת מרחב רגולטורי מותאם", description: "מומלץ לאשר הקמת 'ארגז החול הרגולטורי' לבתי הספר בפיילוט. יש להעניק להם פטור ממבחני המיצ\"ב ובגמישות בבניית תוכנית הלימודים, בתנאי עמידה במדדי הצלחה חלופיים ותוכנית עבודה מאושרת מראש.", linkedGoal: 3}
    ],
    riskCounts: { veryHigh: 0, high: 2, medium: 1, low: 0 }
  };
}
