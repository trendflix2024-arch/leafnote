import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { title, chapters, author } = await req.json();

        // Build EPUB-like HTML content
        const htmlChapters = chapters.map((ch: { title: string; content: string }, i: number) => ({
            title: ch.title || `Chapter ${i + 1}`,
            data: `<h1>${ch.title || `Chapter ${i + 1}`}</h1><p>${ch.content.replace(/\n/g, '</p><p>')}</p>`,
        }));

        // For a real EPUB, you'd use epub-gen-memory on a Node.js runtime.
        // Here, we generate a simple HTML-based ebook that can be downloaded.
        const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; margin-bottom: 40px; }
    h2 { margin-top: 60px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    p { line-height: 1.8; text-align: justify; }
    .author { text-align: center; color: #666; margin-bottom: 60px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="author">${author} 저</p>
  ${htmlChapters.map((ch: { title: string; data: string }) => `<h2>${ch.title}</h2>${ch.data}`).join('\n')}
</body>
</html>`;

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'application/xhtml+xml',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.epub.html"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
