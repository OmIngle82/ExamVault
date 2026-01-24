import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDFParser from 'pdf2json';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Extract Text from PDF using pdf2json
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const pdfParser = new PDFParser(null, 1); // 1 = text only

        const text = await new Promise<string>((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                // Determine text from pdfData
                // pdf2json returns URL encoded text in its raw format sometimes, 
                // but the '1' option generally helps parsing to raw text content.
                // However, pdf2json's `getRawTextContent` is easier via event or just parsing the JSON structure.
                // Actually, let's just use the raw text content derived from the pages.
                const rawText = pdfParser.getRawTextContent();
                resolve(rawText);
            });

            pdfParser.parseBuffer(buffer);
        });

        // Truncate if too long
        const cleanedText = text.substring(0, 50000);

        // 2. Send to Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
            You are a teacher. Create 5 multiple-choice questions based on the following text content.
            Return ONLY a raw JSON array. Do not wrap in markdown code blocks.
            Structure:
            [
              {
                "type": "mcq",
                "prompt": "Question text?",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A",
                "explanation": "Why A is correct."
              }
            ]

            Text Content:
            ${cleanedText}
        `;

        const result = await model.generateContent(prompt);
        const responseFn = await result.response;
        let jsonStr = responseFn.text();

        // Cleanup markdown
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

        const questions = JSON.parse(jsonStr);

        return NextResponse.json({ questions });

    } catch (error: any) {
        console.error('PDF AI Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
