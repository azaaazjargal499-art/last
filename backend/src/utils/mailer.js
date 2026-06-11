const nodemailer = require('nodemailer');

const getMailerConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
};

const sendPasswordResetCode = async ({ to, code }) => {
  const config = getMailerConfig();
  if (!config) {
    const error = new Error('SMTP тохиргоо дутуу байна. backend/.env дээр SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM утгуудаа бөглөнө үү.');
    error.statusCode = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport(config);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: 'Disciplinex нууц үг сэргээх код',
    text: `Таны нууц үг сэргээх код: ${code}\n\nЭнэ код 10 минут хүчинтэй.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2>Нууц үг сэргээх код</h2>
        <p>Доорх кодыг Disciplinex дээр оруулж шинэ нууц үгээ тохируулна уу.</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:6px;background:#f1f5f9;border-radius:12px;padding:16px 20px;display:inline-block">${code}</div>
        <p style="color:#64748b">Энэ код 10 минут хүчинтэй.</p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetCode };
