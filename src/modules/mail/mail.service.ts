import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendResetCode(to: string, code: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Password reset code',
      text: code,
      html: `<p>Your password reset code: <strong>${code}</strong></p>`,
    });
  }
}
