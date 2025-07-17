export function otp_template(otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2 style="color: #4CAF50;">Your verification code</h2>
      <p style="font-size: 18px;">To verify your account, please enter the following code:</p>
      <div  style="
                margin: 0;
                margin-top: 30px;
                font-size: 40px;
                font-weight: 600;
                letter-spacing: 25px;
                color: #ba3d4f;
              ">${otp}</div>
      <p style="font-size: 14px; color: #777;">This code will be valid for 1 minute.</p>
    </div>
  `;
}
