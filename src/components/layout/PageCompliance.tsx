import { COMPLIANCE_LINE } from "@/lib/site";

export function PageCompliance({ className }: { className?: string }) {
  return (
    <p className={className ? `page-compliance ${className}` : "page-compliance"}>{COMPLIANCE_LINE}</p>
  );
}
