import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Clean up the filename to avoid issues
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${originalName}`;

        const uploadsDir = join(process.cwd(), 'public', 'uploads');

        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist, ignore error
        }

        const filePath = join(uploadsDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URL
        return NextResponse.json({ url: `/uploads/${filename}` });

    } catch (error: any) {
        console.error('File upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
