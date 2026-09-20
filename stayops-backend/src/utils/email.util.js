const nodemailer = require('nodemailer');

// Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

/**
 * Send a password reset email via Brevo SMTP
 * @param {string} toEmail  - Recipient email address
 * @param {string} toName   - Recipient name
 * @param {string} resetToken - Plain reset token
 */
const sendPasswordResetEmail = async (toEmail, toName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StayOps <noreply@stayops.com>',
    to: `${toName} <${toEmail}>`,
    subject: 'Reset your StayOps password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Password</title>
      </head>
      <body style="margin:0;padding:0;background:#F4F5F3;font-family:'Source Sans Pro',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F3;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:4px;border:1px solid #E3E4DE;overflow:hidden;max-width:480px;width:100%;">

                <!-- Identity bar -->
                <tr>
                  <td style="background:#2C3E8C;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
                </tr>

                <!-- Header -->
                <tr>
                  <td style="padding:32px 40px 0;">
                    <span style="color:#14171F;font-size:16px;font-weight:700;letter-spacing:-0.2px;">StayOps</span>
                    <p style="color:#9CA0A6;font-size:11px;margin:2px 0 0;letter-spacing:0.4px;text-transform:uppercase;">Residence Management System</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:28px 40px 32px;">
                    <h1 style="color:#14171F;font-family:Georgia,'Palatino Linotype',serif;font-size:21px;font-weight:600;margin:0 0 8px;letter-spacing:-0.2px;">
                      Reset your password
                    </h1>
                    <p style="color:#5C6068;font-size:14px;line-height:1.6;margin:0 0 26px;">
                      Hi ${toName}, we received a request to reset the password on your StayOps account. Click below to choose a new one.
                    </p>

                    <!-- CTA Button -->
                    <div style="margin:0 0 26px;">
                      <a href="${resetUrl}"
                         style="display:inline-block;padding:12px 28px;background:#2C3E8C;color:#FFFFFF;font-weight:600;font-size:14px;text-decoration:none;border-radius:4px;letter-spacing:-0.1px;">
                        Reset password
                      </a>
                    </div>

                    <!-- Notice -->
                    <div style="background:#F4F5F3;border:1px solid #E3E4DE;border-radius:4px;padding:12px 16px;margin-bottom:22px;">
                      <p style="color:#5C6068;font-size:12px;margin:0;line-height:1.6;">
                        This link expires in <strong style="color:#14171F;">15 minutes</strong>. If you didn't request this, you can safely ignore this email — your password won't change.
                      </p>
                    </div>

                    <!-- Fallback link -->
                    <p style="color:#9CA0A6;font-size:11px;margin:0;word-break:break-all;line-height:1.6;">
                      Or paste this link into your browser:<br/>
                      <a href="${resetUrl}" style="color:#2C3E8C;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#F9F9F7;padding:16px 40px;text-align:center;border-top:1px solid #E3E4DE;">
                    <p style="color:#9CA0A6;font-size:11px;margin:0;">
                      © ${new Date().getFullYear()} StayOps. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };