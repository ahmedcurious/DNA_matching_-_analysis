import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField, Typography, CircularProgress } from '@mui/material';
import './App.css';

function App() {
  const [file, setFile] = useState(null); // To store the uploaded DNA sequence file
  const [excelFile, setExcelFile] = useState(null); // To store the optional Excel file
  const [result, setResult] = useState(null); // To store API response

  // Define the mutation for handling the POST request
  const mutation = useMutation({
    mutationFn: async (files) => {
      const formData = new FormData();
      formData.append('target_sequence', files.targetSequence);
      
      // Only append excel file if it is provided
      if (files.excelFile) {
        formData.append('excel_file', files.excelFile);
      }

      const response = await fetch('http://localhost:8000/dna_matching', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data); // Set the result state with API response
    },
    onError: (error) => {
      setResult({ error: error.message });
    },
  });

  // Handle DNA sequence file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle Excel file input change (optional)
  const handleExcelFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (file) {
      mutation.mutate({
        targetSequence: file,
        excelFile: excelFile, // Include the Excel file if provided
      });
    } else {
      alert('Please upload a DNA sequence file before submitting!');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundImage: "url('./src/assets/dna_image.jpg')", // Corrected path
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.8,
        color: 'white',
        padding: '4rem',
        overflow: 'hidden', // Hide scrollbars
        maxWidth: '100%',   // Set max-width to 100%
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        DNA Pattern Matching
      </Typography>

      <Typography
        variant="body1"
        style={{
          marginBottom: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
        }}
      >
        Upload a DNA sequence in a text file to find the best match in our database. This application
        uses advanced algorithms to analyze the sequence and provides a detailed analysis, including
        matching percentage, random match probability (RMP), and other key metrics.
      </Typography>

      {/* DNA sequence file input field with label */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Typography variant="h6" gutterBottom>
          Upload the DNA Sequence for Matching and Analysis
        </Typography>
        <TextField
          type="file"
          inputProps={{ accept: '.txt' }}
          onChange={handleFileChange}
          variant="outlined"
          fullWidth
          style={{
            backgroundColor: 'white',
            borderRadius: '4px',
            input: { color: 'black' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
          }}
        />
      </div>

      {/* Optional Excel file input field with label */}
      <div style={{ width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
        <Typography variant="h6" gutterBottom>
          Upload DNA Sequence List to be matched against (Optional)
        </Typography>
        <TextField
          type="file"
          inputProps={{ accept: '.xlsx' }}
          onChange={handleExcelFileChange}
          variant="outlined"
          fullWidth
          style={{
            backgroundColor: 'white',
            borderRadius: '4px',
            input: { color: 'black' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
          }}
        />
      </div>

      {/* Submit Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={mutation.isLoading}
        style={{
          marginTop: '1rem',
        }}
      >
        {mutation.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
      </Button>

      {/* Display result */}
      {result && (
        <div style={{ marginTop: '2rem', textAlign: 'center', maxWidth: '600px' }}>
          {result.error ? (
            <Typography variant="h6" color="error">
              Error: {result.error}
            </Typography>
          ) : (
            <>
              <Typography variant="h6">DNA Matching Results:</Typography>
              <Typography>
                Best Match Name: {result.dna_matching.best_match_name}
              </Typography>
              <Typography>
                Best Match Percentage: {result.dna_matching.best_match_percentage.toFixed(2)}%
              </Typography>

              <Typography variant="h6" style={{ marginTop: '1rem' }}>
                DNA Analysis:
              </Typography>
              <Typography>RMP: {result.dna_analysis.rmp}</Typography>
              <Typography>CPI: {result.dna_analysis.cpi}</Typography>
              <Typography>PI: {result.dna_analysis.pi}</Typography>
              <Typography>Kinship LR: {result.dna_analysis.kinship_lr}</Typography>
              <Typography>FSI: {result.dna_analysis.fsi}</Typography>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
