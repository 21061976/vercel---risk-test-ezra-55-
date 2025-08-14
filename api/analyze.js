// In api/analyze.js

import Anthropic from '@anthropic-ai/sdk';

// ודא שמפתח ה-API שלך מוגדר כמשתנה סביבה ב-Vercel
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // Note: We use `res` (response object) now, which is standard in Node.js functions
  try {
    const { documentText, options } = req.body; // In Node.js, we use req.body

    if (!documentText) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    const prompt = `
      אתה EZRA 5.0, מומחה לניהול סיכונים.
      קיבלת את מסמך התפיסה הבא:
      <document>
      ${documentText}
      </document>

      וההנחיות הבאות לניתוח:
      <options>
      - סוג ניתוח: ${options.analysisType}
      - התמקדות בסיכונים: ${options.riskFocus}
      - קהל יעד לדוח: ${options.targetAudience}
      - הקשר מיוחד: ${options.specificContext || 'אין'}
      </options>

      המשימה שלך היא לייצר דוח ניהול סיכונים מקיף ומפורט.
      **חובה: פרמט את כל התשובה שלך בפורמט Markdown בלבד.**
      השתמש בכותרות (#, ##, ###), רשימות (*), הדגשות (**טקסט מודגש**) וטבלאות אם נדרש.
      התחל ישירות עם כותרת הדוח, לדוגמה: "# 🎯 דוח ניהול סיכונים: [שם הפרויקט]".
      אל תכלול שום טקסט מקדים כמו "בטח, הנה הדוח המבוקש".
    `;

    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    // Pipe the stream from Claude directly to the response
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }

    // End the response when the stream is finished
    res.end();

  } catch (error) {
    console.error('Error in analyze handler:', error);
    // Ensure the stream is closed in case of an error
    if (!res.writableEnded) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
}
