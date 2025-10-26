import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export class TemplateService {
  private static instance: TemplateService;
  private compiledTemplates: { [key: string]: HandlebarsTemplateDelegate } = {};

  private constructor() {
    this.registerHelpers();
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  private registerHelpers(): void {
    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    // Date formatting helper
    Handlebars.registerHelper('formatDate', (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    });

    // DateTime formatting helper
    Handlebars.registerHelper('formatDateTime', (date: Date) => {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // Percentage formatting helper
    Handlebars.registerHelper('formatPercentage', (value: number, decimals: number = 1) => {
      return `${value.toFixed(decimals)}%`;
    });

    // Conditional helper for status styling
    Handlebars.registerHelper('statusClass', (status: string) => {
      const statusMap: { [key: string]: string } = {
        'confirmed': 'status-confirmed',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled',
        'checked-in': 'status-checked-in',
        'checked-out': 'status-checked-out'
      };
      return statusMap[status] || '';
    });

    // Comparison helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    // Array helpers
    Handlebars.registerHelper('times', (n: number, block: any) => {
      let accum = '';
      for (let i = 0; i < n; i++) {
        accum += block.fn(i);
      }
      return accum;
    });

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0);

    // String helpers
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str.toUpperCase();
    });

    Handlebars.registerHelper('lowercase', (str: string) => {
      return str.toLowerCase();
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '..', 'templates', 'reports', `${templateName}.hbs`);
    return fs.promises.readFile(templatePath, 'utf-8');
  }

  private async getCompiledTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (!this.compiledTemplates[templateName]) {
      const templateContent = await this.loadTemplate(templateName);
      this.compiledTemplates[templateName] = Handlebars.compile(templateContent);
    }
    return this.compiledTemplates[templateName];
  }

  public async renderReport(reportType: string, data: any): Promise<string> {
    try {
      // Load and compile the specific report template
      const reportTemplate = await this.getCompiledTemplate(reportType);
      
      // Load and compile the layout template
      const layoutTemplate = await this.getCompiledTemplate('layout');
      
      // Render the report content
      const reportContent = reportTemplate(data);
      
      // Create the final data object with the rendered content
      const layoutData = {
        ...data,
        content: reportContent
      };
      
      // Render the complete HTML with layout
      return layoutTemplate(layoutData);
    } catch (error) {
      console.error(`Error rendering ${reportType} template:`, error);
      throw new Error(`Failed to render ${reportType} report template`);
    }
  }

  public async renderCustomTemplate(templateName: string, data: any): Promise<string> {
    try {
      const template = await this.getCompiledTemplate(templateName);
      return template(data);
    } catch (error) {
      console.error(`Error rendering custom template ${templateName}:`, error);
      throw new Error(`Failed to render template ${templateName}`);
    }
  }

  public clearCache(): void {
    this.compiledTemplates = {};
  }

  public getAvailableTemplates(): string[] {
    return ['layout', 'occupancy', 'revenue', 'bookings'];
  }
}
