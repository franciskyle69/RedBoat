import puppeteer from "puppeteer";
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
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
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

      // Set content and wait for all resources to load
      await page.setContent(html, { 
        waitUntil: "networkidle0",
        timeout: 30000 
      });

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
        headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">WebProj Hotel Management</div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
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
