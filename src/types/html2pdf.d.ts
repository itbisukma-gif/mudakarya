
declare module 'html2pdf.js' {
  export interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: { type: 'jpeg' | 'png' | 'webp'; quality: number };
    html2canvas?: { scale?: number; useCORS?: boolean; [key: string]: any };
    jsPDF?: { unit?: 'pt' | 'mm' | 'cm' | 'in'; format?: string | number[]; orientation?: 'portrait' | 'landscape'; [key: string]: any };
    [key: string]: any;
  }

  export interface Html2Pdf {
    from(element: HTMLElement | string, type?: string): this;
    to(target: any): this;
    set(options: Html2PdfOptions): this;
    save(filename?: string): Promise<void>;
    outputPdf(type?: string, options?: any): Promise<any>;
    // Add other methods as you need them
  }

  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
