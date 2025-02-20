const rateLimit = require("express-rate-limit");
const axios = require("axios");
const validator = require("validator");
const Survey = require("../models/Survey");

// Rate limiting middleware - 5 submissions per 15 minutes per IP

const surveyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many submissions. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateInput = async (req, res, next) => {
  try {
    const { name, email, phone, message, honeypot, recaptchaToken } = req.body;

    // Check honeypot
    if (honeypot) {
      return res.status(200).json({ message: "Survey submitted successfully" }); // Fake success
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      return res
        .status(400)
        .json({ message: "reCAPTCHA verification required" });
    }

    const recaptchaVerification = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaVerification.data.success) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }

    // Basic input validation
    if (
      !validator.isLength(name, { min: 2, max: 50 }) ||
      !validator.matches(name, /^[a-zA-Z\s-']+$/)
    ) {
      return res.status(400).json({ message: "Invalid name format" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validator.matches(phone, /^\+?[\d\s-()]{8,20}$/)) {
      return res.status(400).json({ message: "Invalid phone format" });
    }

    if (!validator.isLength(message, { min: 10, max: 1000 })) {
      return res
        .status(400)
        .json({ message: "Message must be between 10 and 1000 characters" });
    }

    // Check for suspicious patterns
    const containsSuspiciousContent =
      [
        /<[^>]*>/.test(message), // HTML tags
        /http[s]?:\/\//i.test(message), // URLs
        /\[url=/i.test(message), // BBCode
        /[^\s]{30,}/.test(message), // Words longer than 30 chars
        /(.)\1{4,}/.test(message), // Repeated characters
        /[\$\!\?\.]{'3,}/.test(message), // Excessive punctuation
      ].filter(Boolean).length >= 2;

    if (containsSuspiciousContent) {
      return res
        .status(400)
        .json({ message: "Message contains suspicious content" });
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid input" });
  }
};

// Check for multiple submissions
const checkMultipleSubmissions = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check submissions in last 24 hours
    const recentSubmissions = await Survey.countDocuments({
      email,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentSubmissions >= 3) {
      return res.status(429).json({
        message:
          "Too many submissions from this email address. Please try again later.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// const submitSurvey =   async (req, res) => {
//   try {
//     // Remove honeypot and recaptcha token from data
//     const { honeypot, recaptchaToken, ...surveyData } = req.body;

//     // Validate required fields
//     const requiredFields = ['name', 'gender', 'nationality', 'email', 'phone', 'address', 'message'];
//     const missingFields = requiredFields.filter(field => !surveyData[field]);

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         message: `Missing required fields: ${missingFields.join(', ')}`
//       });
//     }

//     // Add submission metadata
//     const survey = new Survey({
//       ...surveyData,
//       ipAddress: req.ip,
//       userAgent: req.headers['user-agent']
//     });

//     await survey.save();

//     res.status(201).json({
//       message: 'Survey submitted successfully',
//       survey: survey
//     });
//   } catch (error) {
//     console.error('Error saving survey:', error);
//     res.status(400).json({
//       message: 'Error submitting survey',
//       error: error.message
//     });
//   }
// }

const nodemailer = require("nodemailer");

// Email transport configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const createUserEmailContent = (name) => ({
  subject: "Survey Submission Confirmation",
  text: `Dear ${name},\n\nThank you for submitting your survey. We have received your response and will review it shortly.\n\nBest regards,\nThe Survey Team`,
  html: `
    <h2>Survey Submission Confirmation</h2>
    <p>Dear ${name},</p>
    <p>Thank you for submitting your survey. We have received your response and will review it shortly.</p>
    <p>Best regards,<br>The Survey Team</p>
  `,
});

const createAdminEmailContent = (surveyData) => ({
  subject: "New Survey Submission",
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
  `,
});

// Send email function
const sendEmail = async (to, content) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADDRESS,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const submitSurvey = async (req, res) => {
  try {
    // Remove honeypot and recaptcha token from data
    const { honeypot, recaptchaToken, ...surveyData } = req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "gender",
      "nationality",
      "email",
      "phone",
      "address",
      "message",
    ];
    const missingFields = requiredFields.filter((field) => !surveyData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Add submission metadata
    const survey = new Survey({
      ...surveyData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
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
      message: "Survey submitted successfully",
      survey: survey,
      notifications: {
        userEmail: userEmailSent ? "sent" : "failed",
        adminEmail: adminEmailSent ? "sent" : "failed",
      },
    });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(400).json({
      message: "Error submitting survey",
      error: error.message,
    });
  }
};

const getAllSurvey = async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  surveyLimiter,
  validateInput,
  checkMultipleSubmissions,
  submitSurvey,
  getAllSurvey,
};
