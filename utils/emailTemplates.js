const fs = require("fs");
const path = require("path");

// Read and convert logo to Base64
const logoPath = path.join(__dirname, "../public/logo.webp");
const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
const logoDataUri = `data:image/webp;base64,${logoBase64}`;

// Verification Email Template
const verificationEmail = (fullName, code) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color:#f5f8fb; padding:30px; margin:0;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:16px; padding:40px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
    <img src="${logoDataUri}" alt="BahirLink Logo" style="width:120px; margin-bottom:20px;" />
    <h2 style="color:#0F52BA; margin-bottom:15px;">Welcome to BahirLink, ${fullName}!</h2>
    <p style="font-size:16px; color:#555; margin-bottom:30px;">Please use the verification code below to verify your email. This code will expire in 10 minutes.</p>
    <div style="display:inline-block; background:#0F52BA; color:#fff; font-size:32px; font-weight:bold; padding:15px 25px; border-radius:8px; letter-spacing:8px;">
      ${code}
    </div>
    <p style="font-size:14px; color:#888; margin-top:30px;">If you did not sign up for BahirLink, please ignore this email.</p>
  </div>
</body>
</html>
`;

// Temporary Password Email Template
const temporaryPasswordEmail = (tempPassword) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color:#f5f8fb; padding:30px; margin:0;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:16px; padding:40px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
    <img src="${logoDataUri}" alt="BahirLink Logo" style="width:120px; margin-bottom:20px;" />
    <h2 style="color:#0F52BA; margin-bottom:15px;">Your Temporary Password</h2>
    <p style="font-size:16px; color:#555; margin-bottom:30px;">Use the password below to log in. You must change it after logging in.</p>
    <div style="display:inline-block; background:#0F52BA; color:#fff; font-size:24px; font-weight:bold; padding:15px 25px; border-radius:8px; letter-spacing:2px;">
      ${tempPassword}
    </div>
    <p style="font-size:14px; color:#888; margin-top:30px;">If you did not request a temporary password, please contact support immediately.</p>
  </div>
</body>
</html>
`;

module.exports = {
  verificationEmail,
  temporaryPasswordEmail,
};
