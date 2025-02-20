const router = require("express").Router();

const auth = require("../middleware/auth");

const {
  submitSurvey,
  checkMultipleSubmissions,
  validateInput,
  surveyLimiter,
  getAllSurvey,
} = require("../controllers/surveyController");

// Submit survey (public)
router.post(
  "/",
  surveyLimiter,
  validateInput,
  checkMultipleSubmissions,
  submitSurvey
);

// Get all surveys (protected - admin only)
router.get("/", auth, getAllSurvey);

module.exports = router;
