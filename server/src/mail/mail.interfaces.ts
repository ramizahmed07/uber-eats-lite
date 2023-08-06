export interface MailOptions {
  apiKey: string;
}

interface DynamicTemlateData {
  title: string;
  content: string;
  subject: string;
  [key: string]: string;
}

export interface SendEmailInput {
  toEmail: string;
  dynamicTemplateData: DynamicTemlateData;
}
