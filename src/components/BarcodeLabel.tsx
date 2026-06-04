import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface BarcodeLabelProps {
  batch: any;
}

export function BarcodeLabel({ batch }: BarcodeLabelProps) {
  const ref = useRef<SVGSVGElement>(null);
  const code = batch?.barcode || `${batch?.id?.slice(0, 8)}-${batch?.batch_number}`.toUpperCase();

  useEffect(() => {
    if (ref.current && code) {
      try {
        JsBarcode(ref.current, code, { format: "CODE128", width: 1.5, height: 50, fontSize: 11, displayValue: true, margin: 4 });
      } catch {}
    }
  }, [code]);

  const handlePrint = () => {
    const svg = ref.current?.outerHTML;
    if (!svg) return;
    const w = window.open("", "_blank", "width=500,height=300");
    if (!w) return;
    w.document.write(`<html><head><title>Batch Label</title><style>
      body{font-family:system-ui;padding:20px;}
      .label{border:1px solid #000;padding:12px;width:300px;}
      .row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;}
      strong{font-size:13px;}
      @media print{button{display:none;}}
    </style></head><body>
      <div class="label">
        <strong>${batch.medications?.name || "Medication"}</strong>
        <div class="row"><span>Batch:</span><span>${batch.batch_number}</span></div>
        ${batch.lot_number ? `<div class="row"><span>Lot:</span><span>${batch.lot_number}</span></div>` : ""}
        <div class="row"><span>Expiry:</span><span>${batch.expiry_date}</span></div>
        <div class="row"><span>Qty:</span><span>${batch.quantity_remaining}/${batch.quantity_received}</span></div>
        ${svg}
      </div>
      <button onclick="window.print()" style="margin-top:12px;">Print</button>
    </body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-2">
      <svg ref={ref} />
      <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-3 w-3 mr-1" /> Print Label</Button>
    </div>
  );
}
