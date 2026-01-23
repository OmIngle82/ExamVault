import { NextRequest, NextResponse } from 'next/server';

// Piston API Map
const RUNTIME_MAP: Record<string, { language: string; version: string }> = {
    python: { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
};

export async function POST(req: NextRequest) {
    try {
        const { language, sourceCode, expectedOutput } = await req.json();

        if (!language || !sourceCode) {
            return NextResponse.json({ error: 'Language and Code are required' }, { status: 400 });
        }

        const runtime = RUNTIME_MAP[language] || RUNTIME_MAP['python'];

        // Call Piston API
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [{ content: sourceCode }]
            })
        });

        if (!response.ok) {
            throw new Error(`Piston API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const stdout = data.run.stdout || '';
        const stderr = data.run.stderr || '';
        const output = (stdout + stderr).trim();

        // Validation Logic
        let status = 'neutral';
        if (expectedOutput) {
            // Flexible check: Does output contain expected string?
            // ignoring whitespace differences
            const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
            if (normalize(output).includes(normalize(expectedOutput))) {
                status = 'success';
            } else {
                status = 'failure';
            }
        }

        return NextResponse.json({
            output: output,
            status: status
        });

    } catch (error: any) {
        console.error('Code Execution Error:', error);
        return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 });
    }
}
