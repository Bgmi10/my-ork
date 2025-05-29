type OtpType = 'signup' | 'login' | 'forgot';

const getTitle = (type: OtpType): string => {
  switch (type) {
    case 'signup':
      return 'Welcome to MyOKR - Verify Your Email';
    case 'login':
      return 'MyOKR Login Code';
    case 'forgot':
      return 'MyOKR Password Reset Code';
    default:
      return 'MyOKR Verification Code';
  }
};

const getMessage = (type: OtpType): string => {
  switch (type) {
    case 'signup':
      return 'Thank you for signing up! Please use the following code to verify your email address:';
    case 'login':
      return 'Use the following code to log in to your account:';
    case 'forgot':
      return 'You requested a password reset. Use this code to reset your password:';
    default:
      return 'Your verification code is:';
  }
};

export const getOtpHtmlTemplate = (type: OtpType, otp: string): string => {
  const title = getTitle(type);
  const message = getMessage(type);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">${title}</h1>
        <p style="margin-bottom: 20px;">${message}</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          MyOKR - Objectives and Key Results Management System
        </p>
      </div>
    </body>
    </html>
  `;
}; 