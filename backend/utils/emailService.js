// Safe optional import of Brevo SDK
let BrevoSdkMod = null;
try { BrevoSdkMod = require('@getbrevo/brevo'); } catch (_) { BrevoSdkMod = null; }
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Resolve Brevo module for both CJS and ESM builds
const resolveBrevo = () => {
  try {
    const root = (BrevoSdkMod && BrevoSdkMod.ApiClient)
      ? BrevoSdkMod
      : (BrevoSdkMod && BrevoSdkMod.default ? BrevoSdkMod.default : null);
    return root || null;
  } catch (_) {
    return null;
  }
};

// Initialize Brevo (Sendinblue) client (returns { api, root } or null)
const getBrevoAPI = () => {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  const root = resolveBrevo();
  if (!root || !root.ApiClient) return { api: null, root: null }; // silent fallback
  const defaultClient = root.ApiClient.instance;
  const apiKey = defaultClient.authentications && defaultClient.authentications['apiKey'];
  if (!apiKey) return { api: null, root: null }; // silent fallback
  apiKey.apiKey = key;
  return { api: new root.TransactionalEmailsApi(), root };
};

// Minimal HTTPS sender for Brevo REST when SDK is unavailable
const sendViaBrevoHTTP = ({ senderEmail, senderName, to, subject, html, text }) => {
  const key = process.env.BREVO_API_KEY;
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || ''
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': key,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 12000 // 12s hard timeout to avoid hangs
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ ok: true });
        const err = new Error(`Brevo HTTP ${res.statusCode}: ${data}`);
        err.statusCode = res.statusCode;
        err.body = data;
        return reject(err);
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT_HTTP'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// Function to send password reset email (kept same signature and return shape)
const sendResetPasswordEmail = async (userEmail, resetToken) => {
  const ctx = getBrevoAPI();

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'NiteBite';

  if (!process.env.BREVO_API_KEY) {
    console.log('\n📧 PASSWORD RESET EMAIL (Development Mode)');
    console.log('================================');
    console.log(`To: ${userEmail}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log('This token expires in 15 minutes.');
    console.log('================================\n');
    return { success: true, message: 'Reset token logged to console (development mode)' };
  }

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0; margin: 0;">CNA Food Ordering System</h2>
          <h3 style="color: #333; margin: 10px 0;">Password Reset Request</h3>
        </div>
        <p style="color: #555; line-height: 1.6;">Hello,</p>
        <p style="color: #555; line-height: 1.6;">You have requested to reset your password.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="color: #333; margin-bottom: 15px; font-weight: bold;">Your Password Reset Token:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2c5aa0;">
            <span style="font-size: 24px; letter-spacing: 3px; color: #2c5aa0; font-weight: bold; font-family: monospace;">${resetToken}</span>
          </div>
        </div>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Important:</p>
          <p style="color: #856404; margin: 5px 0 0 0;">This token will expire in 15 minutes for security reasons.</p>
        </div>
        <p style="color: #555; line-height: 1.6;">To reset your password:</p>
        <ol style="color: #555; line-height: 1.6;">
          <li>Go back to the password reset page</li>
          <li>Enter the token above</li>
          <li>Create your new password</li>
          <li>Confirm your new password</li>
        </ol>
        <p style="color: #555; line-height: 1.6;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated email from CNA Food Ordering System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

  try {
    if (ctx && ctx.api) {
      const email = new ctx.root.SendSmtpEmail();
      email.sender = { email: senderEmail, name: senderName };
      email.to = [{ email: userEmail }];
      email.subject = 'Password Reset Request - NiteBite x RGIPT';
      email.htmlContent = html;
      await ctx.api.sendTransacEmail(email);
    } else {
      await sendViaBrevoHTTP({ senderEmail, senderName, to: userEmail, subject: 'Password Reset Request - NiteBite x RGIPT', html, text: `Your password reset token is ${resetToken}` });
    }
    console.log(`✅ Password reset email sent to ${userEmail}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('❌ Email sending error (Brevo):', error && (error.body || error.response?.text || error.message || error));
    return { success: false, message: 'Failed to send password reset email' };
  }
};

// Function to send email verification email (kept same signature and return shape)
const sendEmailVerificationEmail = async (userEmail, verificationToken) => {
  const ctx = getBrevoAPI();

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'NiteBite';

  if (!process.env.BREVO_API_KEY) {
    console.log('\n📧 EMAIL VERIFICATION (Development Mode)');
    console.log('================================');
    console.log(`To: ${userEmail}`);
    console.log(`Verification Token: ${verificationToken}`);
    console.log('This token expires in 24 hours.');
    console.log('================================\n');
    return { success: true, message: 'Verification token logged to console (development mode)' };
  }

  const verifyUrlBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const verificationLink = `${verifyUrlBase}/verify-email?token=${verificationToken}`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0; margin: 0;">NiteBite x RGIPT</h2>
          <h3 style="color: #333; margin: 10px 0;">Email Verification</h3>
        </div>
        <p style="color: #555; line-height: 1.6;">Thank you for registering! Please verify your email address to activate your account.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="color: #333; margin-bottom: 15px; font-weight: bold;">Your Verification Token:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2c5aa0;">
            <span style="font-size: 24px; letter-spacing: 3px; color: #2c5aa0; font-weight: bold; font-family: monospace;">${verificationToken}</span>
          </div>
        </div>
        <p style="color: #555; line-height: 1.6;">You can verify your email in this way:</p>
        <ol style="color: #555; line-height: 1.6;">
          <li>Copy the token above and paste it on the Email Verification page</li>
        </ol>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;"></div>
        <p style="color: #555; line-height: 1.6;">If you did not create this account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated email from NiteBite x RGIPT.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

  try {
    if (ctx && ctx.api) {
      const email = new ctx.root.SendSmtpEmail();
      email.sender = { email: senderEmail, name: senderName };
      email.to = [{ email: userEmail }];
      email.subject = 'Verify Your Email - NiteBite x RGIPT';
      email.htmlContent = html;
      await ctx.api.sendTransacEmail(email);
    } else {
      await sendViaBrevoHTTP({ senderEmail, senderName, to: userEmail, subject: 'Verify Your Email - NiteBite x RGIPT', html, text: `Your verification token is ${verificationToken}. Link: ${verificationLink}` });
    }
    console.log(`✅ Verification email sent to ${userEmail}`);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('❌ Verification email sending error (Brevo):', error && (error.body || error.response?.text || error.message || error));
    return { success: false, message: 'Failed to send verification email' };
  }
};

module.exports = {
  sendResetPasswordEmail,
  sendEmailVerificationEmail,
};
