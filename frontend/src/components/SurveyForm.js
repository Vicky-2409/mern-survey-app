import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import ReCAPTCHA from 'react-google-recaptcha';
import { 
  TextField, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  Box,
  CircularProgress 
} from '@mui/material';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Create a base URL that works in both development and production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

// Move reCAPTCHA key to environment variable
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeB4twqAAAAACbfyUH02Pm5Cs2MAD2AzuvvCarD';

// Rest of your validation schema remains the same
const validationSchema = Yup.object({
  // ... your existing validation schema
});

const SurveyForm = () => {
  const [formStartTime] = useState(Date.now());

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const timeDiff = Date.now() - formStartTime;
      if (timeDiff < 3000) {
        toast.error('Please take time to fill out the form properly.');
        return;
      }

      const { honeypot, recaptchaToken, ...submitData } = values;

      await toast.promise(
        // Update the API URL
        axios.post(`${API_URL}/surveys`, {
          ...submitData,
          recaptchaToken
        }),
        {
          loading: 'Submitting survey...',
          success: () => {
            resetForm();
            return 'Survey submitted successfully! 🎉';
          },
          error: (err) => {
            // Enhanced error handling
            console.error('Submission error:', err);
            return err.response?.data?.message || 
                   err.message || 
                   'Error submitting survey. Please try again.';
          }
        },
        {
          success: {
            duration: 4000,
          },
          error: {
            duration: 5000,
          },
          style: {
            minWidth: '250px',
          },
        }
      );

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <h1>Survey Form</h1>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        }}
      />
      
      <Formik
        initialValues={{
          name: '',
          gender: '',
          nationality: '',
          email: '',
          phone: '',
          address: '',
          message: '',
          honeypot: '',
          recaptchaToken: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, setFieldValue }) => (
          <Form>
            <Field
              name="name"
              as={TextField}
              label="Name"
              fullWidth
              margin="normal"
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
            />
            
            <FormControl component="fieldset" margin="normal" fullWidth error={touched.gender && !!errors.gender}>
              <FormLabel>Gender</FormLabel>
              <Field name="gender" as={RadioGroup} row>
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </Field>
              {touched.gender && errors.gender && (
                <Box sx={{ color: 'error.main', mt: 1, fontSize: '0.75rem' }}>
                  {errors.gender}
                </Box>
              )}
            </FormControl>

            <Field
              name="nationality"
              as={TextField}
              label="Nationality"
              fullWidth
              margin="normal"
              error={touched.nationality && !!errors.nationality}
              helperText={touched.nationality && errors.nationality}
            />

            <Field
              name="email"
              as={TextField}
              label="Email"
              fullWidth
              margin="normal"
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
            />

            <Field
              name="phone"
              as={TextField}
              label="Phone"
              fullWidth
              margin="normal"
              error={touched.phone && !!errors.phone}
              helperText={touched.phone && errors.phone}
            />

            <Field
              name="address"
              as={TextField}
              label="Address"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              error={touched.address && !!errors.address}
              helperText={touched.address && errors.address}
            />

            <Field
              name="message"
              as={TextField}
              label="Message"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              error={touched.message && !!errors.message}
              helperText={touched.message && errors.message}
            />

            {/* Honeypot field */}
            <Field
              name="honeypot"
              type="text"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* reCAPTCHA */}
            <Box sx={{ my: 2 }}>
              <ReCAPTCHA
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setFieldValue('recaptchaToken', token)}
              />
              {touched.recaptchaToken && errors.recaptchaToken && (
                <Box sx={{ color: 'error.main', mt: 1, fontSize: '0.75rem' }}>
                  {errors.recaptchaToken}
                </Box>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Submit Survey'
              )}
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default SurveyForm;