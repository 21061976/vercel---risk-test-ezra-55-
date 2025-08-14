import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // הוסף CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure we only handle POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { documentText, options } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    // בדיקה שיש API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `
      אתה EZRA 5.0, מומחה לניהול סיכונים במערכת החינוך הישראלית.
      קיבלת את מסמך התפיסה הבא:
      
      <document>
      ${documentText}
      </document>

      וההנחיות הבאות לניתוח:
      <options>
      - סוג ניתוח: ${options.analysisType || 'standard'}
      - התמקדות בסיכונים: ${options.riskFocus || 'balanced'}
      - קהל יעד לדוח: ${options.targetAudience || 'management'}
      - הקשר מיוחד: ${options.specificContext || 'אין'}
      </options>

      המשימה שלך היא לייצר דוח ניהול סיכונים מקיף ומפורט.
      **חובה: פרמט את כל התשובה שלך בפורמט Markdown בלבד.**
      השתמש בכותרות (#, ##, ###), רשימות (*), הדגשות (**טקסט מודגש**) וטבלאות אם נדרש.
      התחל ישירות עם כותרת הדוח.

      יש לכלול בדוח:
      1. תקציר מנהלים
      2. זיהוי וניתוח סיכונים עיקריים
      3. הערכת רמת חדשנות הפרויקט
      4. המלצות מעשיות
      5. מטריצת סיכונים
      6. לוח זמנים ליישום
    `;

    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }

    res.end();

  } catch (error) {
    console.error('Error in analyze handler:', error);
    if (!res.writableEnded) {
      res.status(500).json({ 
        error: 'Failed to process request',
        details: error.message 
      });
    }
  }
}
