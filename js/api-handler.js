// מנהל ה-API של Claude
class ClaudeAPIHandler {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
    }

    async analyzeDocument(documentText, projectName) {
        const prompt = this.buildPrompt(documentText, projectName);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 8000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseResponse(data.content[0].text);
            
        } catch (error) {
            console.error('Error calling Claude API:', error);
            throw error;
        }
    }

    buildPrompt(documentText, projectName) {
        return `
אתה מומחה לניהול סיכונים במערכת החינוך. נתח את המסמך הבא וצור דוח סיכונים מפורט.

פרויקט: ${projectName}

המסמך לניתוח:
${documentText}

החזר תשובה ב-JSON בפורמט הבא בלבד:
{
    "projectName": "שם הפרויקט",
    "organization": "הארגון",
    "projectManager": "מנהל הפרויקט",
    "timeline": "לוח זמנים",
    "goals": [
        {
            "title": "מטרה 1",
            "description": "תיאור"
        }
    ],
    "risks": [
        {
            "title": "שם הסיכון",
            "severity": "very-high/high/medium/low",
            "probability": 8,
            "impact": 9,
            "score": 72,
            "description": "תיאור מפורט",
            "impacts": ["השלכה 1", "השלכה 2"],
            "opportunities": ["הזדמנות 1", "הזדמנות 2"]
        }
    ],
    "strategies": [
        {
            "title": "אסטרטגיה 1",
            "description": "תיאור",
            "timeline": "Q1 2025"
        }
    ],
    "executiveSummary": "סיכום מנהלים",
    "recommendations": ["המלצה 1", "המלצה 2"]
}`;
    }

    parseResponse(responseText) {
        try {
            // נקה את הטקסט מסימנים מיותרים
            const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```/g, '');
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Error parsing response:', error);
            throw new Error('Failed to parse API response');
        }
    }
}
