"use client";

import { PDFDownloadLink } from '@react-pdf/renderer';
import { MyBookPDF } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Project, InteriorLayout } from '@/lib/store';

export default function PDFDownloadSection({ project }: { project: Project }) {
    const il = project.coverDesign?.interiorLayout as InteriorLayout | undefined;
    const bookFormatKey = project.coverDesign?.params?.bookFormat;
    const fmtLabel = bookFormatKey ? bookFormatKey.toUpperCase() : 'A5';

    return (
        <PDFDownloadLink
            document={<MyBookPDF project={project} interiorLayout={il} bookFormatKey={bookFormatKey} />}
            fileName={`${project.title}.pdf`}
            className="w-full block"
        >
            {/* @ts-ignore */}
            {({ loading }) => (
                <Button disabled={loading} className="w-full bg-slate-800">
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'PDF 준비 중...' : `PDF 다운로드 (${fmtLabel})`}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
