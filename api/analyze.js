// In api/analyze.js

import Anthropic from '@anthropic-ai/sdk';

// ודא שמפתח ה-API שלך מוגדר כמשתנה סביבה ב-Vercel
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// הגדרת הפונקציה לרוץ כ-Edge Function כדי לתמוך בסטרימינג בצורה מיטבית
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { documentText, options } = await req.json();

    if (!documentText) {
      return new Response(JSON.stringify({ error: 'Document text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- בניית הפרומפט המשודרג ---
    // הנחיה חשובה ל-AI: בקש ממנו להחזיר את התשובה בפורמט Markdown.
    // זה יאפשר לנו לעצב אותה יפה בצד הלקוח.
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

    // יצירת ה-Stream מ-Claude
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229', // או כל מודל אחר שאתה משתמש בו
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // יצירת Stream חדש להחזרת התשובה לדפדפן
    const responseStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const textChunk = event.delta.text;
            // שלח כל חתיכת טקסט שמגיעה מיד לדפדפן
            controller.enqueue(new TextEncoder().encode(textChunk));
          }
        }
        // סגור את ה-Stream כשהכל הסתיים
        controller.close();
      },
    });

    // החזרת ה-Stream לדפדפן כתשובה
    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error in analyze handler:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
