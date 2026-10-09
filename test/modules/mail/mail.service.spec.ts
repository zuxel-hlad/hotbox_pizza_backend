import { MailService } from '@modules/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  const mailer = { sendMail: jest.fn() };
  const mailService = new MailService(mailer as unknown as MailerService);

  beforeEach(() => {
    mailer.sendMail.mockReset();
  });

  it('sends the code by email', async () => {
    await mailService.sendResetCode('john@x.com', '123456');

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

    await expect(mailService.sendResetCode('john@x.com', '123456')).rejects.toBe(error);
  });
});
