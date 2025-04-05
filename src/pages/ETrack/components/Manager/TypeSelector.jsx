import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Custom styled components
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.3s ease',
    background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    '&:hover': {
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-2px)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3498db',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3498db',
      borderWidth: 2,
    }
  },
  '& .MuiInputLabel-outlined': {
    fontWeight: 500,
    fontSize: '1rem',
    '&.Mui-focused': {
      color: '#3498db',
    }
  },
  '& .MuiSelect-select': {
    padding: '14px 20px',
    fontSize: '1.05rem',
    fontWeight: 500,
    color: '#2c3e50',
  }
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 500,
  padding: '12px 20px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f0f7ff',
    paddingLeft: '24px',
  },
  '&.Mui-selected': {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #3498db',
    '&:hover': {
      backgroundColor: '#d0e8fc',
    }
  }
}));

const TypeSelector = ({ options, value, onChange }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };
return (
    <div className="dashboard-type-selection" style={{ padding: '16px 24px' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          height: '4px',
          width: '60px',
          backgroundColor: '#3498db',
          bottom: '-10px',
          borderRadius: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
        }
      }}>
        <StyledFormControl variant="outlined">
          <InputLabel id="data-type-selector-label">Select Dashboard View</InputLabel>
          <Select
            labelId="data-type-selector-label"
            id="data-type-selector"
            value={value}
            onChange={handleChange}
            label="Select Dashboard View"
            IconComponent={KeyboardArrowDownIcon}
            MenuProps={{
              PaperProps: {
                sx: { 
                  borderRadius: 3,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  marginTop: '8px',
                  maxHeight: '400px',
                  '& .MuiList-root': {
                    padding: '8px 0',
                  }
                }
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'center',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'center',
              },
            }}
          >
            {options.map((option) => (
              <StyledMenuItem key={option.value} value={option.value}>
                {option.label}
              </StyledMenuItem>
            ))}
          </Select>
        </StyledFormControl>
      </Box>
    </div>
  );
};

export default TypeSelector;