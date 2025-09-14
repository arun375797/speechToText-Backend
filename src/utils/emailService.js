import nodemailer from 'nodemailer';

// Create transporter (using Gmail for now, but can be configured for other providers)
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }
  
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - SpeechAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎙️ SpeechAI</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${name}!</h2>
            
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for signing up with SpeechAI! To complete your registration, please verify your email address using the OTP below:
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 24px;">Your Verification Code</h3>
              <div style="background: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} SpeechAI. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to SpeechAI! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to SpeechAI!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your account is now verified</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${name}!</h2>
            
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Congratulations! Your email has been successfully verified. You can now access all the features of SpeechAI:
            </p>
            
            <ul style="color: #64748b; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
              <li>🎤 Upload audio files for transcription</li>
              <li>🎧 Live speech-to-text conversion</li>
              <li>📝 View your transcription history</li>
              <li>👤 Manage your profile and settings</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_ORIGIN}/home" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Get Started Now
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} SpeechAI. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};
