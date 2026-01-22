import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + '_' + file.name.replaceAll(' ', '_');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure dir exists (although we created it)
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/${filename}`
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
