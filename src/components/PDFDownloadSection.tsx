"use client";

import { PDFDownloadLink } from '@react-pdf/renderer';
import { MyBookPDF } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Project } from '@/lib/store';

export default function PDFDownloadSection({ project }: { project: Project }) {
    return (
        <PDFDownloadLink
            document={<MyBookPDF project={project} />}
            fileName={`${project.title}.pdf`}
            className="w-full block"
        >
            {/* @ts-ignore */}
            {({ loading }) => (
                <Button disabled={loading} className="w-full bg-slate-800">
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'PDF 준비 중...' : 'PDF 다운로드 (A5)'}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
