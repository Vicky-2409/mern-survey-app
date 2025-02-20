import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Box, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create a base URL that works in both development and production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState('');

  const handleSubmit = async (values) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, values);
      
      // Add error handling for invalid response
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', response.data.token);
      navigate('/admin/surveys');
    } catch (error) {
      // More detailed error handling
      setError(
        error.response?.data?.message || 
        error.message || 
        'Login failed. Please try again.'
      );
    }
  };

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => setError('');
  }, []);

  return (
    <Box sx={{ 
      maxWidth: 400, 
      mx: 'auto', 
      p: 2,
      mt: 4,
      boxShadow: 3,
      borderRadius: 2,
      backgroundColor: 'background.paper' 
    }}>
      <h1 style={{ textAlign: 'center' }}>Admin Login</h1>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')} // Allow users to dismiss the error
        >
          {error}
        </Alert>
      )}
      <Formik
        initialValues={{
          username: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field
              name="username"
              as={TextField}
              label="Username"
              fullWidth
              margin="normal"
              error={touched.username && !!errors.username}
              helperText={touched.username && errors.username}
              autoComplete="username"
            />

            <Field
              name="password"
              as={TextField}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={touched.password && !!errors.password}
              helperText={touched.password && errors.password}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default AdminLogin;