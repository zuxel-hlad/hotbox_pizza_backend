import { MailService } from '@app/mailer/mailer.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: `smtps://${config.get('USER_EMAIL')}:${config.get('USER_EMAIL_PASSWORD')}@smtp.gmail.com`,
        defaults: {
          from: `"Hotbox PIZZA" <${process.env.USER_EMAIL}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
