import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
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
      התחל ישירות עם כותרת הדוח.
    `;

    // --- MODEL UPDATED HERE ---
    const stream = await anthropic.messages.create({
      model: 'claude-3.5-sonnet-20240620',
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
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
}
