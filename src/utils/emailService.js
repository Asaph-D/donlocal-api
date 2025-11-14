const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Configuration du transporteur SMTP (ex: Gmail)
const createTransporter = async () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  });

  const accessToken = await oAuth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  return transporter;
};

// Version simplifiée (sans OAuth, pour un usage basique avec mot de passe d'application)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Utilise un mot de passe d'application pour Gmail
  },
});

// Fonction pour envoyer un email
const sendEmail = async (options) => {
  try {
    const emailOptions = {
      from: `"DonLocal.cm" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    // Envoi de l'email
    await transporter.sendMail(emailOptions);
    console.log(`✅ Email envoyé à ${options.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    throw new Error('Échec de l\'envoi de l\'email');
  }
};

// Exemple d'email de vérification
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const message = `
    <h1>Bienvenue sur DonLocal.cm !</h1>
    <p>Merci de vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
    <a href="${verificationUrl}">Vérifier mon email</a>
    <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
  `;

  await sendEmail({
    email,
    subject: 'Vérifiez votre adresse email',
    html: message,
  });
};

// Exemple d'email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const message = `
    <h1>Réinitialisation de mot de passe</h1>
    <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien ci-dessous :</p>
    <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
    <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  `;

  await sendEmail({
    email,
    subject: 'Réinitialisation de mot de passe',
    html: message,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
