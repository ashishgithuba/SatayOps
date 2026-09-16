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
    subject: '🔐 Reset Your StayOps Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Password</title>
      </head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:rgba(30,41,59,0.98);border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,211,105,0.15);">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:40px;height:40px;background:linear-gradient(135deg,#FFD369,#f59e0b);border-radius:10px;display:inline-block;"></div>
                      <span style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">StayOps</span>
                    </div>
                    <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:8px 0 0;letter-spacing:1px;text-transform:uppercase;">Residence Management System</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <h1 style="color:#f8fafc;font-size:22px;font-weight:800;margin:0 0 8px;">Reset Your Password</h1>
                    <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 28px;">
                      Hi <strong style="color:#f8fafc;">${toName}</strong>, we received a request to reset your StayOps account password. Click the button below to set a new password.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align:center;margin:0 0 28px;">
                      <a href="${resetUrl}" 
                         style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#FFD369,#f59e0b);color:#0f172a;font-weight:900;font-size:15px;text-decoration:none;border-radius:10px;letter-spacing:-0.3px;">
                        Reset Password →
                      </a>
                    </div>

                    <!-- Warning -->
                    <div style="background:rgba(255,211,105,0.06);border:1px solid rgba(255,211,105,0.15);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.6;">
                        ⏰ This link will expire in <strong style="color:#FFD369;">15 minutes</strong>.<br/>
                        If you did not request a password reset, please ignore this email — your password will remain unchanged.
                      </p>
                    </div>

                    <!-- Fallback link -->
                    <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;word-break:break-all;">
                      Or copy this link: <a href="${resetUrl}" style="color:#FFD369;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:rgba(0,0,0,0.25);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">
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
