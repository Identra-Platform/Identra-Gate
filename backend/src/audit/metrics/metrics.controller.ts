import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

import { BadRequestException } from '@nestjs/common';

class PeriodParser {
  static parsePeriod(period: string): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(now); // Default to now

    let from = new Date(now);

    // Parse period string
    const unit = period.slice(-1); // Last character: d, w, m, y
    const value = parseInt(period.slice(0, -1)); // Number part

    if (isNaN(value) || value <= 0) {
      throw new BadRequestException('Invalid period value');
    }

    switch (unit.toLowerCase()) {
      case 'd': // Days
        from.setDate(from.getDate() - value);
        break;

      case 'w': // Weeks
        from.setDate(from.getDate() - value * 7);
        break;

      case 'm': // Months
        from.setMonth(from.getMonth() - value);
        break;

      case 'y': // Years
        from.setFullYear(from.getFullYear() - value);
        break;

      default:
        throw new BadRequestException(
          `Invalid period unit: ${unit}. Use d (days), w (weeks), m (months), or y (years)`,
        );
    }

    // Set to start of day for 'from' and end of day for 'to'
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    return { from, to };
  }
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(@Query('period') period?: string) {
    let from: Date | undefined = undefined;
    let to: Date | undefined = undefined;

    if (period) {
      const periodParsed = PeriodParser.parsePeriod(period);
      from = periodParsed.from;
      to = periodParsed.to;
    }
    return this.metricsService.getMetrics(from, to);
  }
}
