const nodemailer = require('nodemailer');

// Email transport configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Email templates
const createUserEmailContent = (name) => ({
  subject: 'Survey Submission Confirmation',
  text: `Dear ${name},\n\nThank you for submitting your survey. We have received your response and will review it shortly.\n\nBest regards,\nThe Survey Team`,
  html: `
    <h2>Survey Submission Confirmation</h2>
    <p>Dear ${name},</p>
    <p>Thank you for submitting your survey. We have received your response and will review it shortly.</p>
    <p>Best regards,<br>The Survey Team</p>
  `
});

const createAdminEmailContent = (surveyData) => ({
  subject: 'New Survey Submission',
  text: `New survey submission received from ${surveyData.name}.\n\nDetails:\nEmail: ${surveyData.email}\nPhone: ${surveyData.phone}\nNationality: ${surveyData.nationality}`,
  html: `
    <h2>New Survey Submission</h2>
    <p>New survey submission received from ${surveyData.name}.</p>
    <h3>Details:</h3>
    <ul>
      <li>Email: ${surveyData.email}</li>
      <li>Phone: ${surveyData.phone}</li>
      <li>Nationality: ${surveyData.nationality}</li>
    </ul>
  `
});

// Send email function
const sendEmail = async (to, content) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADDRESS,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const submitSurvey = async (req, res) => {
  try {
    // Remove honeypot and recaptcha token from data
    const { honeypot, recaptchaToken, ...surveyData } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'gender', 'nationality', 'email', 'phone', 'address', 'message'];
    const missingFields = requiredFields.filter(field => !surveyData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Add submission metadata
    const survey = new Survey({
      ...surveyData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Save survey
    await survey.save();
    
    // Send confirmation email to user
    const userEmailSent = await sendEmail(
      surveyData.email,
      createUserEmailContent(surveyData.name)
    );

    // Send notification to admin
    const adminEmailSent = await sendEmail(
      process.env.ADMIN_EMAIL,
      createAdminEmailContent(surveyData)
    );

    res.status(201).json({
      message: 'Survey submitted successfully',
      survey: survey,
      notifications: {
        userEmail: userEmailSent ? 'sent' : 'failed',
        adminEmail: adminEmailSent ? 'sent' : 'failed'
      }
    });
  } catch (error) {
    console.error('Error saving survey:', error);
    res.status(400).json({
      message: 'Error submitting survey',
      error: error.message
    });
  }
};

module.exports = { submitSurvey };