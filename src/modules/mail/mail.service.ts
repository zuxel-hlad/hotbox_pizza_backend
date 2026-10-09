import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendMail(to: string, subject: string, code: string) {
    try {
      await this.mailer.sendMail({
        to,
        subject,
        text: code,
        html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                    <p style="margin: 0">
                        Your password reset code:&nbsp;<strong>${code}</strong>
                    </p>
                </div>
             `,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, '');
      throw error;
    }
  }
}
