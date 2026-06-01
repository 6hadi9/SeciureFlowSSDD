import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const drawSectionTitle = (pdf, text, y) => {
  pdf.setFontSize(14);
  pdf.setTextColor(30, 27, 24);
  pdf.text(text, 40, y);
  return y + 18;
};

const drawTextBlock = (pdf, lines, y) => {
  pdf.setFontSize(11);
  pdf.setTextColor(60, 54, 50);
  lines.forEach((line) => {
    pdf.text(line, 40, y);
    y += 14;
  });
  return y + 6;
};

export const exportPdf = async (elementId, filename, reportData = null) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("l", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  const marginX = (pageWidth - imgWidth) / 2;
  const marginY = (pageHeight - imgHeight) / 2;

  pdf.addImage(imageData, "PNG", marginX, marginY, imgWidth, imgHeight);

  if (reportData) {
    pdf.addPage();
    let y = 50;
    pdf.setFontSize(18);
    pdf.text(reportData.projectName || "SecureFlow Report", 40, y);
    y += 24;

    if (reportData.score) {
      y = drawSectionTitle(pdf, "Security Score", y);
      y = drawTextBlock(pdf, [
        `Overall: ${reportData.score.overallScore} (${reportData.score.rating})`,
        `Authentication: ${reportData.score.categories?.authentication ?? "-"}`,
        `Encryption: ${reportData.score.categories?.encryption ?? "-"}`,
        `Access Control: ${reportData.score.categories?.accessControl ?? "-"}`,
        `Data Protection: ${reportData.score.categories?.dataProtection ?? "-"}`,
        `Network Security: ${reportData.score.categories?.networkSecurity ?? "-"}`,
      ], y);
    }

    if (reportData.recommendations?.criticalActions?.length) {
      y = drawSectionTitle(pdf, "Recommendations", y);
      const lines = reportData.recommendations.criticalActions.map(
        (item, index) => `${index + 1}. ${item.title} (+${item.impact}%)`
      );
      y = drawTextBlock(pdf, lines, y);
    }

    if (reportData.attackPaths?.length) {
      y = drawSectionTitle(pdf, "Attack Paths", y);
      const lines = reportData.attackPaths.slice(0, 5).map(
        (path, index) =>
          `${index + 1}. ${path.entryPoint} -> ${path.exploitationStep || path.exploitation} -> ${path.finalImpact}`
      );
      y = drawTextBlock(pdf, lines, y);
    }

    if (reportData.threats?.length) {
      y = drawSectionTitle(pdf, "Top Threats", y);
      const lines = reportData.threats.slice(0, 8).map(
        (threat, index) =>
          `${index + 1}. ${threat.type || threat.threat} (${threat.severity}) - ${threat.status || "Unmitigated"}`
      );
      drawTextBlock(pdf, lines, y);
    }
  }

  pdf.save(filename || "secureflow-report.pdf");
};
