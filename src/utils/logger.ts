export class Logger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Colors
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  };

  private static formatAgent(agent: string): string {
    const agentColors: Record<string, string> = {
      'Orchestrator': this.colors.magenta,
      'Planner': this.colors.blue,
      'Researcher': this.colors.cyan,
      'Coder': this.colors.green,
      'Reviewer': this.colors.yellow,
      'System': this.colors.white,
    };

    const color = agentColors[agent] || this.colors.white;
    return `${color}${this.colors.bright}[${agent}]${this.colors.reset}`;
  }

  static agent(agent: string, message: string): void {
    console.log(`${this.formatAgent(agent)} ${message}`);
  }

  static success(agent: string, message: string): void {
    console.log(`${this.formatAgent(agent)} ${this.colors.green}✓${this.colors.reset} ${message}`);
  }

  static error(agent: string, message: string): void {
    console.log(`${this.formatAgent(agent)} ${this.colors.red}✗${this.colors.reset} ${message}`);
  }

  static info(message: string): void {
    console.log(`${this.colors.dim}ℹ ${message}${this.colors.reset}`);
  }

  static divider(): void {
    console.log(`${this.colors.dim}${'─'.repeat(80)}${this.colors.reset}`);
  }

  static header(title: string): void {
    console.log(`\n${this.colors.bright}${this.colors.cyan}╔${'═'.repeat(title.length + 2)}╗${this.colors.reset}`);
    console.log(`${this.colors.bright}${this.colors.cyan}║ ${title} ║${this.colors.reset}`);
    console.log(`${this.colors.bright}${this.colors.cyan}╚${'═'.repeat(title.length + 2)}╝${this.colors.reset}\n`);
  }

  static json(agent: string, label: string, data: any): void {
    console.log(`${this.formatAgent(agent)} ${this.colors.dim}${label}:${this.colors.reset}`);
    console.log(JSON.stringify(data, null, 2));
  }
}