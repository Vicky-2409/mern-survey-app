import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import SurveyForm from './components/SurveyForm';
import AdminLogin from './components/AdminLogin';
import SurveyList from './components/SurveyList';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Survey Application
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/admin/login">
              Admin
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<SurveyForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/surveys" element={<SurveyList />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;