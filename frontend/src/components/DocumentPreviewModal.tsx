import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import { Employee } from "@/types";
import { DocType, DOC_TYPE_LABELS, generatePDF, getFilename } from "@/utils/documentGenerators";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  docType: DocType;
}

function LetterContent({ employee, docType }: { employee: Employee; docType: DocType }) {
  const today = format(new Date(), "dd MMMM yyyy");

  const renderBody = () => {
    switch (docType) {
      case "offer-letter":
        return (
          <>
            <p>Dear {employee.firstName} {employee.lastName},</p>
            <p>We are pleased to offer you the position of <strong>{employee.designation}</strong> in our <strong>{employee.department}</strong> department. This offer is contingent upon successful completion of our standard background verification process.</p>
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <tbody>
                {[
                  ["Position", employee.designation],
                  ["Department", employee.department],
                  ["Employment Type", employee.employmentType],
                  ["Date of Joining", employee.joiningDate],
                  ["Work Location", employee.workLocation || employee.officeLocation],
                  ["Reporting Manager", employee.reportingManager],
                  ["Shift Timing", employee.shiftTiming],
                  ["Company Email", employee.companyEmail],
                ].map(([l, v], i) => (
                  <tr key={l} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 font-medium text-muted-foreground w-40">{l}</td>
                    <td className="px-3 py-2 text-foreground">{v || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>Please sign and return a copy of this letter to confirm your acceptance. We look forward to welcoming you to our team.</p>
          </>
        );
      case "confirmation-letter":
        return (
          <>
            <p>Dear {employee.firstName} {employee.lastName},</p>
            <p>We are pleased to confirm your employment with HRMS Enterprise Suite as <strong>{employee.designation}</strong> in the <strong>{employee.department}</strong> department, effective from <strong>{employee.joiningDate}</strong>.</p>
            <p>After a satisfactory review of your performance during the probation period, your services are hereby confirmed. All terms and conditions as communicated in your original offer letter shall continue to apply.</p>
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <tbody>
                {[
                  ["Employee ID", employee.employeeId],
                  ["Designation", employee.designation],
                  ["Department", employee.department],
                  ["Date of Joining", employee.joiningDate],
                  ["Employment Type", employee.employmentType],
                  ["Work Location", employee.workLocation || employee.officeLocation],
                ].map(([l, v], i) => (
                  <tr key={l} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 font-medium text-muted-foreground w-40">{l}</td>
                    <td className="px-3 py-2 text-foreground">{v || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>We appreciate your dedication and look forward to your continued contributions. Congratulations!</p>
          </>
        );
      case "increment-letter":
        return (
          <>
            <p>Dear {employee.firstName} {employee.lastName},</p>
            <p>In recognition of your consistent performance and valuable contributions to the <strong>{employee.department}</strong> department, we are pleased to inform you about a revision in your compensation package, effective from <strong>{today}</strong>.</p>
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <tbody>
                {[
                  ["Employee ID", employee.employeeId],
                  ["Current Designation", employee.designation],
                  ["Department", employee.department],
                  ["Effective Date", today],
                ].map(([l, v], i) => (
                  <tr key={l} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 font-medium text-muted-foreground w-40">{l}</td>
                    <td className="px-3 py-2 text-foreground">{v || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>The revised compensation reflects our appreciation of your hard work and commitment. All other terms remain unchanged. This letter is confidential.</p>
          </>
        );
      case "promotion-letter":
        return (
          <>
            <p>Dear {employee.firstName} {employee.lastName},</p>
            <p>We are delighted to inform you that based on your exemplary performance, you have been promoted within the <strong>{employee.department}</strong> department, effective <strong>{today}</strong>.</p>
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <tbody>
                {[
                  ["Employee ID", employee.employeeId],
                  ["Current Designation", employee.designation],
                  ["Department", employee.department],
                  ["Effective Date", today],
                  ["Reporting Manager", employee.reportingManager],
                ].map(([l, v], i) => (
                  <tr key={l} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 font-medium text-muted-foreground w-40">{l}</td>
                    <td className="px-3 py-2 text-foreground">{v || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>This promotion is a testament to your dedication and leadership. Revised terms will be communicated separately. Congratulations!</p>
          </>
        );
      case "relieving-letter":
        return (
          <>
            <p>To Whomsoever It May Concern,</p>
            <p>This is to certify that <strong>{employee.firstName} {employee.lastName}</strong> (Employee ID: {employee.employeeId}) has been employed with HRMS Enterprise Suite as <strong>{employee.designation}</strong> in the <strong>{employee.department}</strong> Department from <strong>{employee.joiningDate}</strong> to <strong>{today}</strong>.</p>
            <p>{employee.firstName} has been relieved from {employee.employmentType === "Full-time" ? "full-time" : employee.employmentType.toLowerCase()} employment effective {today} as per mutual agreement.</p>
            <p>During the tenure, we found {employee.firstName} to be sincere, hardworking and a team player. We wish {employee.firstName} all the best in future endeavors.</p>
          </>
        );
    }
  };

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground print:text-black">
      {/* Header */}
      <div className="rounded-lg p-4 text-white" style={{ background: "var(--gradient-primary)" }}>
        <h2 className="text-lg font-bold">HRMS Enterprise Suite</h2>
        <p className="text-xs opacity-80">admin@company.com | www.hrmsportal.com</p>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">{DOC_TYPE_LABELS[docType].toUpperCase()}</h3>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ref: {docType === "offer-letter" ? "OL" : docType === "confirmation-letter" ? "CL" : docType === "increment-letter" ? "IL" : docType === "promotion-letter" ? "PL" : "RL"}-{employee.employeeId}</span>
        <span>Date: {today}</span>
      </div>

      <div className="space-y-3">{renderBody()}</div>

      <div className="flex justify-between pt-6 mt-6 border-t border-border text-xs text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">Authorised Signatory</p>
          <p>HRMS Enterprise Suite</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground">HR Department</p>
          <p>Human Resources</p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentPreviewModal({ open, onClose, employee, docType }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!employee) return null;

  const handleDownload = () => {
    const doc = generatePDF(employee, docType);
    doc.save(getFilename(employee, docType));
  };

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${DOC_TYPE_LABELS[docType]} - ${employee.firstName} ${employee.lastName}</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        td { padding: 8px 12px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .header { background: linear-gradient(135deg, #6366f1, #3b82f6); color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
        .header h2 { margin: 0; } .header p { margin: 4px 0 0; opacity: 0.8; font-size: 12px; }
        h3 { text-align: center; font-size: 20px; margin: 16px 0; }
        .meta { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
        .sig { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; }
        .sig strong { display: block; color: #1a1a2e; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{DOC_TYPE_LABELS[docType]} — {employee.firstName} {employee.lastName}</span>
          </DialogTitle>
        </DialogHeader>

        <div ref={contentRef}>
          <LetterContent employee={employee} docType={docType} />
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button onClick={handleDownload} className="flex-1 gap-2">
            <Download size={14} /> Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
            <Printer size={14} /> Print
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
