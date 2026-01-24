import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { topic, text, count = 5 } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    if (!topic && !text) {
      return NextResponse.json({ error: 'Topic or Text is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      You are an expert exam creator.
      Generate ${count} multiple-choice questions (MCQ) based on the following content:
      
      Topic/Context: "${topic || 'General Knowledge'}"
      ${text ? `Source Text: "${text.substring(0, 5000)}"` : ''}

      Return strictly a JSON array of objects. No markdown, no "json" tags.
      Format:
      [
        {
          "type": "mcq",
          "prompt": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A" 
        }
      ]
      Ensure "correctAnswer" exactly matches one of the strings in "options".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textData = response.text();

    // Cleanup markdown if present
    textData = textData.replace(/```json/g, '').replace(/```/g, '').trim();

    const questions = JSON.parse(textData);

    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    // Handle status code from Google API error
    const status = (error.status === 429 || (error.message && error.message.includes('429'))) ? 429 : 500;
    const msg = status === 429 ? 'AI Usage Limit Exceeded (Please wait 1 min)' : (error.message || 'Failed to generate');
    return NextResponse.json({ error: msg }, { status });
  }
}
