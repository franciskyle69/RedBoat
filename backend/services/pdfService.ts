import puppeteer from "puppeteer";
import path from "path";
import { TemplateService } from "./templateService";
import { DataPreprocessor } from "./dataPreprocessor";

interface ReportData {
  occupancy?: any;
  revenue?: any;
  bookings?: any;
  dashboard?: any;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export class PDFService {
  private static instance: PDFService;
  private browser: any = null;
  private templateService: TemplateService;

  private constructor() {
    this.templateService = TemplateService.getInstance();
  }

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  private async getBrowser() {
    if (this.browser) return this.browser;
    const commonArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      // Note: '--single-process' can cause crashes on Windows; omit it
    ];
    const tryLaunch = async (opts: any) => {
      return await puppeteer.launch({
        // Explicit headless mode for compatibility across versions
        headless: true,
        args: commonArgs,
        ...opts,
      });
    };
    try {
      const ep = (puppeteer as any).executablePath ? (puppeteer as any).executablePath() : undefined;
      if (ep) {
        this.browser = await tryLaunch({ executablePath: ep });
        return this.browser;
      }
    } catch (e0) { /* continue to next strategy */ }

    // Try channel-based launch (supported in newer Puppeteer versions)
    try {
      this.browser = await tryLaunch({ channel: 'chrome' });
      return this.browser;
    } catch (eCh) { /* try next */ }

    try {
      this.browser = await tryLaunch({ channel: 'msedge' });
      return this.browser;
    } catch (eEd) { /* try next */ }

    try {
      this.browser = await tryLaunch({});
      return this.browser;
    } catch (e1) {
      const envPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
      const localAppData = process.env.LOCALAPPDATA || '';
      const winCandidates = [
        envPath,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
        'C:/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe',
        localAppData ? path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe') : undefined,
      ].filter(Boolean) as string[];
      for (const p of winCandidates) {
        try {
          this.browser = await tryLaunch({ executablePath: p });
          return this.browser;
        } catch (e2) { /* try next */ }
      }
      throw new Error(`Failed to launch headless browser for PDF generation. You may set PUPPETEER_EXECUTABLE_PATH to a Chrome/Chromium/Brave path. Original error: ${e1 instanceof Error ? e1.message : 'unknown'}`);
    }
  }

  // ===================================================
  // TEMPLATE-BASED HTML GENERATION
  // ===================================================
  private async generateReportHTML(reportType: string, rawData: any, dateRange: DateRange): Promise<string> {
    try {
      // Preprocess the data based on report type
      let processedData;
      switch (reportType) {
        case 'occupancy':
          processedData = DataPreprocessor.preprocessOccupancyData(rawData, dateRange);
          break;
        case 'revenue':
          processedData = DataPreprocessor.preprocessRevenueData(rawData, dateRange);
          break;
        case 'bookings':
          processedData = DataPreprocessor.preprocessBookingsData(rawData, dateRange);
          break;
        default:
          throw new Error(`Invalid report type: ${reportType}`);
      }

      // Render the template with processed data
      return await this.templateService.renderReport(reportType, processedData);
    } catch (error) {
      console.error(`Error generating ${reportType} HTML:`, error);
      throw new Error(`Failed to generate ${reportType} report HTML`);
    }
  }

  // ===================================================
  // GENERATE REPORT PDF
  // ===================================================
  public async generateReportPDF(reportType: string, data: any, dateRange: DateRange): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Generate HTML using template system
      const html = await this.generateReportHTML(reportType, data, dateRange);

      const documentId = `RPT-${reportType.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      await page.emulateMediaType('screen');

      // Try the most strict wait first, then relax on retry
      const loadAttempts: Array<{ waitUntil: any; timeout: number }> = [
        { waitUntil: 'networkidle0', timeout: 45000 },
        { waitUntil: 'load', timeout: 45000 },
        { waitUntil: 'domcontentloaded', timeout: 45000 }
      ];

      let lastSetContentError: any = null;
      for (const attempt of loadAttempts) {
        try {
          await page.setContent(html, attempt as any);
          lastSetContentError = null;
          break;
        } catch (e) {
          lastSetContentError = e;
        }
      }

      if (lastSetContentError) {
        throw lastSetContentError;
      }

      // Generate PDF with professional settings
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { 
          top: "15mm", 
          right: "15mm", 
          bottom: "15mm", 
          left: "15mm" 
        },
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size: 9px; width: 100%; color: #666; display: flex; justify-content: space-between; padding: 0 10mm;">
          <span>RedBoat Hotel Management</span>
          <span>Document ID: ${documentId}</span>
        </div>`,
        footerTemplate: `<div style="font-size: 9px; width: 100%; color: #666; display: flex; justify-content: space-between; padding: 0 10mm;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span>Document ID: ${documentId}</span>
        </div>`,
        preferCSSPageSize: true
      });

      return pdf;
    } catch (error) {
      console.error(`Error generating PDF for ${reportType}:`, error);
      throw new Error(`Failed to generate PDF for ${reportType} report`);
    } finally {
      await page.close();
    }
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
