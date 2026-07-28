'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  reportType: 'issues_summary' | 'vendor_performance' | 'full_report';
  label?: string;
  data?: any;
}

const generatePDF = async (reportData: any, reportType: string) => {
  const doc = new jsPDF();
  // Header
  doc.setFillColor(15, 110, 100);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('PublicCare', 14, 18);
  doc.setFontSize(10);
  doc.text('Lalitpur Municipal Hygiene Intelligence', 14, 26);
  doc.text(`Report: ${reportType.replace(/_/g, ' ').toUpperCase()}`, 14, 32);
  
  // Reset colors
  doc.setTextColor(33, 29, 23);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
  
  // Summary table
  let y = 50;
  if (reportData.stats) {
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Metric', 'Value']],
      body: Object.entries(reportData.stats).map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').trim(), String(v)]),
      theme: 'grid',
      headStyles: { fillColor: [15, 110, 100] },
      styles: { fontSize: 9 }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Issues by category
  if (reportData.issuesByCategory?.length) {
    doc.setFontSize(14);
    doc.text('Issues by Category', 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Category', 'Count', 'Percentage']],
      body: reportData.issuesByCategory.map((c: any) => [
        c.category.replace(/_/g, ' '),
        c.count,
        reportData.stats?.totalIssues ? Math.round((c.count / reportData.stats.totalIssues) * 100) + '%' : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 110, 100] },
      styles: { fontSize: 9 }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Issues list
  if (reportData.issues?.length) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.text('Issue Details', 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Title', 'Category', 'Status', 'Upvotes', 'Address', 'Date']],
      body: reportData.issues.slice(0, 50).map((i: any) => [
        i.title?.substring(0, 30),
        i.category?.replace(/_/g, ' '),
        i.status,
        i.netUpvotes,
        i.address?.substring(0, 25),
        new Date(i.createdAt).toLocaleDateString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 110, 100] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 35 }, 4: { cellWidth: 30 } }
    });
  }
  
  // Vendor performance
  if (reportData.vendors?.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Vendor Performance', 14, 20);
    autoTable(doc, {
      startY: 26,
      head: [['Company', 'Type', 'Tenders', 'Accepted', 'Ads', 'Status']],
      body: reportData.vendors.map((v: any) => [
        v.companyName, v.businessType?.replace(/_/g, ' '),
        v._count?.tenders || 0, v.acceptedTenders || 0,
        v._count?.ads || 0, v.isApproved ? 'Approved' : 'Pending'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 110, 100] },
      styles: { fontSize: 8 }
    });
  }
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(89, 82, 74);
    doc.text(`PublicCare — Lalitpur Municipality | Page ${i} of ${pageCount}`, 14, 290);
  }
  
  // Charts
  const chartElement = document.getElementById('analytics-charts');
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Analytics Charts', 14, 20);
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const maxImgWidth = pdfWidth - margin * 2;
      const imgWidth = maxImgWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);
    } catch (err) {
      console.error('Failed to capture charts', err);
    }
  }

  doc.save(`PublicCare-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export default function ExportButton({ reportType, label = 'Export PDF', data }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      let reportData = data;
      
      if (!reportData) {
        const res = await fetch('/api/v1/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportType })
        });
        
        if (!res.ok) throw new Error('Export failed');
        const resData = await res.json();
        reportData = resData.data;
      }
      
      await generatePDF(reportData, reportType);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-[#0F6E64] hover:bg-[#14837A] text-[#FFFFFF] font-semibold text-[14px] px-[20px] py-[10px] rounded-[6px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      style={{ boxShadow: 'var(--shadow-level-1)' }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{loading ? 'Generating...' : label}</span>
    </button>
  );
}
