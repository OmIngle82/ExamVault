const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: List models is not directly exposed in the high-level SDK easily in all versions, 
    // but let's try a simple generation on a known model or just try to instantiate generic.
    // Actually, the SDK doesn't always have listModels helper on the top level class in older versions, 
    // but looking at 0.21+, it might. 
    // If not, we can just try to run 'gemini-1.5-flash' and print the error detailedly.

    // Actually, let's just try to hit the REST API directly to list models to be sure.
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("No key found");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
