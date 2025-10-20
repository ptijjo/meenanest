/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import Mailjet from 'node-mailjet';
import { verifyEmailTemplate } from 'src/utils/templates';

interface MailjetResponse {
  Messages: {
    Status: string;
    To: {
      Email: string;
      MessageUUID: string;
      MessageID: number;
    }[];
  }[];
}

@Injectable()
export class MailsService {
  private MAILJET_API_KEY = process.env.MAILJET_API_KEY;
  private MAILJET_API_SECRET_KEY = process.env.MAILJET_API_SECRET_KEY;
  private EMAIL = process.env.EMAIL;
  private mailjet;

  constructor() {
    this.mailjet = new Mailjet({
      apiKey: this.MAILJET_API_KEY,
      apiSecret: this.MAILJET_API_SECRET_KEY,
    });
  }

  async sendEmailVerification(email: string, link: string): Promise<string> {
    const subject = 'Invitation à rejoindre Meena';
    const content = `
    <p>Bonjour !</p>
    <p> Vous avez été invité à rejoindre  Meena </p>
    <p>Pour cela, cliquez sur le lien ci-dessous : </p>
  `;

    const disclaimer = `
  <p>Si vous n'ètes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
    `;

    const request = await this.mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: this.EMAIL,
              Name: 'Meena Corp',
            },
            To: [
              {
                Email: email,
              },
            ],
            Subject: subject,
            HTMLPart: verifyEmailTemplate(content, subject, link, disclaimer),
          },
        ],
      });

    const response = request.body as unknown as MailjetResponse;

    if (response.Messages[0].Status.trim().toLowerCase() !== 'success') {
      throw new HttpException(
        "Erreur lors de l'envoi de l'email d'invitation",
        HttpStatus.FORBIDDEN,
      );
    }
    return response.Messages[0].Status.trim().toLowerCase();
  }
}
