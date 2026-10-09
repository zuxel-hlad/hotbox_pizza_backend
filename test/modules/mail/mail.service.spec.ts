import { MailService } from '@modules/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

describe('MailService', () => {
  const mailer = { sendMail: jest.fn() };
  const mailService = new MailService(mailer as unknown as MailerService);

  beforeEach(() => {
    mailer.sendMail.mockReset();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('sends the code by email', async () => {
    await mailService.sendMail('john@x.com', 'Password reset code', '123456');

    expect(mailer.sendMail).toHaveBeenCalledWith({
      to: 'john@x.com',
      subject: 'Password reset code',
      text: '123456',
      html: expect.stringContaining('<strong>123456</strong>') as string,
    });
  });

  it('rethrows a delivery error', async () => {
    const error = new Error('SMTP error');
    mailer.sendMail.mockRejectedValue(error);

    await expect(mailService.sendMail('john@x.com', 'Password reset code', '123456')).rejects.toBe(error);
  });
});
