import nodemailer from "nodemailer";
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,   // smtp.yandex.ru
  port: process.env.SMTP_PORT,   // 465
  secure: true,                  // true для 465
  auth: {
    user: process.env.SMTP_USER, // твоя почта
    pass: process.env.SMTP_PASS, // пароль приложения
  },
});

export async function sendMail(to, subject, resetLink, fullName = '') {
  await transporter.sendMail({
    from: `"ЦОЗМАИТ КБР" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text: `Здравствуйте${fullName ? ', ' + fullName : ''}!

Вы запросили сброс пароля в системе "Мониторинг обращений граждан по КБР".

Для сброса пароля перейдите по ссылке:
${resetLink}

Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.

С уважением,
ЦОЗМАИТ КБР`,
    html: `
      <p>Здравствуйте${fullName ? ', <b>' + fullName + '</b>' : ''}!</p>
      <p>Вы запросили сброс пароля в системе <b>Мониторинг обращений граждан по КБР</b>.</p>
      <p>
        <a href="${resetLink}" style="color:#0086E0; font-weight:bold;">Нажмите сюда для сброса пароля</a>
      </p>
      <p>Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
      <br/>
      <p>С уважением,<br/>ЦОЗМАИТ КБР</p>
    `,
  });
}

