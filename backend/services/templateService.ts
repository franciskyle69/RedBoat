import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Built-in default templates used when file-based templates are missing.
const DEFAULT_TEMPLATES: Record<string, string> = {
  layout: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{title}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; margin: 24px; color: #111827; }
    h1 { margin: 0 0 4px 0; font-size: 22px; }
    .sub { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
    h2 { font-size: 16px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #fff; }
    .row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: left; font-size: 12px; }
    th { background: #f9fafb; color: #374151; }
    small { color: #6b7280; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <div class="sub">{{reportType}} • Period: {{startDate}} – {{endDate}} • Generated: {{formatDateTime generatedAt}}</div>
  {{{content}}}
</body>
</html>
`,

  occupancy: `
<section>
  <h2>Summary</h2>
  <div class="grid">
    <div class="card"><div class="label">Total Rooms</div><div class="value">{{summary.totalRooms}}</div></div>
    <div class="card"><div class="label">Total Bookings</div><div class="value">{{summary.totalBookings}}</div></div>
    <div class="card"><div class="label">Total Room Nights</div><div class="value">{{summary.totalRoomNights}}</div></div>
    <div class="card"><div class="label">Occupancy Rate</div><div class="value">{{summary.occupancyRate}}%</div></div>
  </div>

  {{#if insights}}
  <h2>Insights</h2>
  <ul>
    {{#each insights}}<li><small>{{this}}</small></li>{{/each}}
  </ul>
  {{/if}}

  <h2>Room Type Breakdown</h2>
  <table>
    <thead><tr><th>Room Type</th><th>Bookings</th><th>Revenue</th><th>Avg / Booking</th><th>Market Share</th></tr></thead>
    <tbody>
      {{#each roomTypeBreakdown}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{bookings}}</td>
          <td>{{formatCurrency revenue}}</td>
          <td>{{formatCurrency avgRevenuePerBooking}}</td>
          <td>{{marketShare}}%</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>

  <h2>Daily Occupancy</h2>
  <table>
    <thead><tr><th>Date</th><th>Occupied</th><th>Total Rooms</th><th>Rate</th></tr></thead>
    <tbody>
      {{#each dailyOccupancy}}
        <tr>
          <td>{{formatDate date}}</td>
          <td>{{occupiedRooms}}</td>
          <td>{{totalRooms}}</td>
          <td>{{occupancyRate}}%</td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</section>
`,

  revenue: `
<section>
  <h2>Summary</h2>
  <div class="grid">
    <div class="card"><div class="label">Total Revenue</div><div class="value">{{formatCurrency summary.totalRevenue}}</div></div>
    <div class="card"><div class="label">Total Bookings</div><div class="value">{{summary.totalBookings}}</div></div>
    <div class="card"><div class="label">Average Booking Value</div><div class="value">{{formatCurrency summary.averageBookingValue}}</div></div>
  </div>

  <h2>Revenue by Room Type</h2>
  <table>
    <thead><tr><th>Room Type</th><th>Revenue</th><th>Bookings</th></tr></thead>
    <tbody>
      {{#each revenueByRoomType}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{formatCurrency revenue}}</td>
          <td>{{bookings}}</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>

  <h2>Payment Status</h2>
  <table>
    <thead><tr><th>Status</th><th>Count</th><th>%</th><th>Est. Amount</th></tr></thead>
    <tbody>
      {{#each paymentStatusBreakdown}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{count}}</td>
          <td>{{percentage}}%</td>
          <td>{{formatCurrency totalAmount}}</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>

  <h2>Top Customers</h2>
  <table>
    <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Bookings</th><th>Total Spent</th><th>Avg / Booking</th></tr></thead>
    <tbody>
      {{#each topCustomers}}
        <tr>
          <td>{{rank}}</td>
          <td>{{name}}</td>
          <td>{{email}}</td>
          <td>{{bookings}}</td>
          <td>{{formatCurrency totalSpent}}</td>
          <td>{{formatCurrency avgPerBooking}}</td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</section>
`,

  bookings: `
<section>
  <h2>Summary</h2>
  <div class="grid">
    <div class="card"><div class="label">Total Bookings</div><div class="value">{{summary.totalBookings}}</div></div>
    <div class="card"><div class="label">Average Duration</div><div class="value">{{summary.averageDuration}} nights</div></div>
    <div class="card"><div class="label">Total Room Nights</div><div class="value">{{summary.totalRoomNights}}</div></div>
  </div>

  <h2>Status Breakdown</h2>
  <table>
    <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
    <tbody>
      {{#each statusBreakdown}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{count}}</td>
          <td>{{percentage}}%</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>

  <h2>Room Type Popularity</h2>
  <table>
    <thead><tr><th>Room Type</th><th>Bookings</th><th>Popularity</th></tr></thead>
    <tbody>
      {{#each roomTypePopularity}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{count}}</td>
          <td>{{popularity}}%</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>

  <h2>Booking Sources</h2>
  <table>
    <thead><tr><th>Source</th><th>Count</th><th>%</th></tr></thead>
    <tbody>
      {{#each bookingSources}}
        {{#with this}}
        <tr>
          <td>{{@key}}</td>
          <td>{{count}}</td>
          <td>{{percentage}}%</td>
        </tr>
        {{/with}}
      {{/each}}
    </tbody>
  </table>
</section>
`
};

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
        currency: 'PHP'
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
    try {
      return await fs.promises.readFile(templatePath, 'utf-8');
    } catch {
      const builtin = DEFAULT_TEMPLATES[templateName];
      if (!builtin) {
        throw new Error(`Template not found: ${templateName}`);
      }
      return builtin;
    }
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
