import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import { 
  Search as SearchIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// API URL configuration for development and production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/surveys'
  : 'http://localhost:5000/api/surveys';

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const navigate = useNavigate();

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(API_URL, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch surveys. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
    // Set up periodic refresh
    const refreshInterval = setInterval(fetchSurveys, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Memoized search filter
  const filteredSurveys = React.useMemo(() => {
    return surveys.filter(survey => 
      Object.values(survey).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [surveys, searchTerm]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1400px', margin: '0 auto' }}>
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <Card sx={{ 
        mb: 4, 
        bgcolor: 'primary.main', 
        color: 'white',
        boxShadow: 3 
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>Survey Submissions</Typography>
              <Typography variant="body1">
                Total submissions: {surveys.length}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleLogout}
              startIcon={<LogOutIcon size={20} />}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search surveys..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 3, 
          boxShadow: 3,
          overflowX: 'auto'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Nationality</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  {Array.from(new Array(6)).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredSurveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No surveys found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSurveys
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((survey) => (
                  <React.Fragment key={survey._id}>
                    <TableRow 
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                        cursor: 'pointer'
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{survey.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          <Chip 
                            icon={<MailIcon size={16} />} 
                            label={survey.email} 
                            size="small" 
                            sx={{ maxWidth: { xs: '100%', sm: 200 } }}
                          />
                          <Chip 
                            icon={<PhoneIcon size={16} />} 
                            label={survey.phone} 
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{survey.nationality}</TableCell>
                      <TableCell>
                        <Chip 
                          label={survey.gender} 
                          size="small"
                          color={
                            survey.gender.toLowerCase() === 'male' ? 'primary' : 
                            survey.gender.toLowerCase() === 'female' ? 'secondary' : 
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(survey.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => toggleRowExpansion(survey._id)}
                        >
                          {expandedRows[survey._id] ? 
                            <ChevronUpIcon size={20} /> : 
                            <ChevronDownIcon size={20} />
                          }
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {expandedRows[survey._id] && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Address:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {survey.address || 'Not provided'}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                              Message:
                            </Typography>
                            <Typography variant="body2">
                              {survey.message || 'No message'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredSurveys.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default SurveyList;