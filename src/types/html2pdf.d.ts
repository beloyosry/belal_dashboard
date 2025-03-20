declare module "html2pdf.js" {
    function html2pdf(): {
        from(element: HTMLElement | string): any;
        set(options: any): any;
        outputPdf(type?: string): any;
        save(filename?: string): Promise<void>;
        toPdf(): any;
    };
    export = html2pdf;
}
