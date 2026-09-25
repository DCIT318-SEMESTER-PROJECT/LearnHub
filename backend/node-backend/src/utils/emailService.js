const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendWelcomeEmail = async (user) => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured — skipping welcome email');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; background: #f7f7fb; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px;">
          <div style="width: 48px; height: 48px; background: #6c5ce7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 24px;">🎓</div>
          <h1 style="margin: 0 0 12px; font-size: 24px; color: #1a1a2e;">
            Welcome to LearnHub, ${user.firstName}!
          </h1>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
            Your account is ready. You can now browse courses, join study groups, and start learning.
          </p>
          <a href="http://localhost:5173/courses" style="display: inline-block; background: #6c5ce7; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Browse Courses →
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            Happy learning!<br>The LearnHub Team
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Welcome to LearnHub, ${user.firstName}! 🎓`,
      html,
    });
    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
};