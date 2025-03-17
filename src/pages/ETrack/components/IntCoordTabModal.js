
import React, { useState, useEffect } from "react";
import { Modal, Box, Button, TextField, Select, MenuItem, Typography, FormControl } from "@mui/material";
import './ManagerModal.css';

const IntCoordTabsModal = ({ open, handleClose, handleSubmit, translatorOptions = [], currentUser = "b6428259", currentDateTime = "2025-03-06 07:39:31" }) => {
  // Initialize form data with default values
  const [formData, setFormData] = useState({
    language: "",
    translatorId: "", // Store the selected translator's ID
    coordinator: "",
    extension: "",
    department: "After: Checkup Contract",
    urgency: "Normal",
    patientHN: "05-12-12345", // Default patient HN (hidden from UI)
    servicePointId: "OR1234", // Default service point ID (hidden from UI)
  });

  // Group translators by language for the dropdown
  const [languageOptions, setLanguageOptions] = useState([]);
  const [translatorsByLanguage, setTranslatorsByLanguage] = useState({});

  // Process translator options when they change
  useEffect(() => {
    if (translatorOptions && translatorOptions.length > 0) {
      // Create a map of languages to translators
      const languageMap = {};
      const uniqueLanguages = new Set();
      
      translatorOptions.forEach(translator => {
        if (translator.lang) {
          if (!languageMap[translator.lang]) {
            languageMap[translator.lang] = [];
          }
          
          // Add translator to this language
          languageMap[translator.lang].push({
            id: translator.eid,
            name: translator.full_name,
            extension: translator.tel || "*0000",
            isAvailable: translator.is_free === "1",
            lang_id: translator.lang_id || "1" // Include lang_id for API requests
          });
          
          uniqueLanguages.add(translator.lang);
        }
      });
      
      setLanguageOptions(Array.from(uniqueLanguages));
      setTranslatorsByLanguage(languageMap);
      
      // Set default language and translator if available
      if (uniqueLanguages.size > 0) {
        const firstLanguage = Array.from(uniqueLanguages)[0];
        const availableTranslators = languageMap[firstLanguage].filter(t => t.isAvailable);
        
        // Select an available translator if possible
        const translator = availableTranslators.length > 0 ? availableTranslators[0] : languageMap[firstLanguage][0];
        
        setFormData({
          ...formData,
          language: firstLanguage,
          translatorId: translator.id,
          coordinator: translator.name,
          extension: translator.extension
        });
      }
    } else {
      // Fallback to default values if no translator options
      const defaultLanguageOptions = ["German", "Italian", "French", "Russian", "Spanish"];
      const defaultMap = {};
      
      defaultLanguageOptions.forEach((lang, index) => {
        defaultMap[lang] = [{
          id: `default${index}`,
          name: `Default ${lang} Translator`,
          extension: "*0000",
          isAvailable: true,
          lang_id: `${index + 1}` // Add numeric language IDs
        }];
      });
      
      setLanguageOptions(defaultLanguageOptions);
      setTranslatorsByLanguage(defaultMap);
      setFormData({
        ...formData,
        language: "German",
        translatorId: "default0",
        coordinator: "Default German Translator",
        extension: "*0000"
      });
    }
  }, [translatorOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData };

    if (name === "language") {
      updatedData.language = value;
      
      // Update translator selection when language changes
      const translators = translatorsByLanguage[value] || [];
      const availableTranslators = translators.filter(t => t.isAvailable);
      
      // Select first available translator, or first translator if none are available
      if (availableTranslators.length > 0) {
        updatedData.translatorId = availableTranslators[0].id;
        updatedData.coordinator = availableTranslators[0].name;
        updatedData.extension = availableTranslators[0].extension;
      } else if (translators.length > 0) {
        updatedData.translatorId = translators[0].id;
        updatedData.coordinator = translators[0].name;
        updatedData.extension = translators[0].extension;
      } else {
        updatedData.translatorId = "";
        updatedData.coordinator = "";
        updatedData.extension = "";
      }
    } else if (name === "translatorId") {
      updatedData.translatorId = value;
      
      // Find the selected translator and update related fields
      const translators = translatorsByLanguage[updatedData.language] || [];
      const selectedTranslator = translators.find(t => t.id === value);
      
      if (selectedTranslator) {
        updatedData.coordinator = selectedTranslator.name;
        updatedData.extension = selectedTranslator.extension;
      }
    } else {
      updatedData[name] = value;
    }
    
    setFormData(updatedData);
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" id="modal-title" gutterBottom>
          New Intl Coordinator Request
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          Date: {currentDateTime} | User: {currentUser}
        </Typography>
        <form onSubmit={(e) => handleSubmit(e, formData)}>
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle1" gutterBottom>
              Language:
            </Typography>
            <Select 
              fullWidth 
              name="language" 
              value={formData.language} 
              onChange={handleChange}
            >
              {languageOptions.map((lang) => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle1" gutterBottom>
              Translator:
            </Typography>
            <Select 
              fullWidth 
              name="translatorId" 
              value={formData.translatorId} 
              onChange={handleChange}
              disabled={!formData.language || !(translatorsByLanguage[formData.language]?.length > 0)}
            >
              {(translatorsByLanguage[formData.language] || []).map((translator) => (
                <MenuItem 
                  key={translator.id} 
                  value={translator.id}
                  sx={{ 
                    color: translator.isAvailable ? 'inherit' : '#999',
                    fontStyle: translator.isAvailable ? 'normal' : 'italic'
                  }}
                >
                  {translator.name}{!translator.isAvailable ? ' (Not Available)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle1" gutterBottom>
              Extension:
            </Typography>
            <TextField 
              fullWidth 
              name="extension" 
              value={formData.extension} 
              onChange={handleChange} 
              disabled
            />
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle1" gutterBottom>
              Department:
            </Typography>
            <Select fullWidth name="department" value={formData.department} onChange={handleChange}>
              <MenuItem value="After: Checkup Contract">After: Checkup Contract</MenuItem>
              <MenuItem value="After: Dermatology Department">After: Dermatology Department</MenuItem>
              <MenuItem value="After: Heart Clinic">Heart Clinic</MenuItem>
              <MenuItem value="C.C.U.">C.C.U.</MenuItem>
              <MenuItem value="Cashier OPD Floor 2">Cashier OPD Floor 2</MenuItem>
            </Select>
          </FormControl>
      
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle1" gutterBottom>
              Urgency:
            </Typography>
            <Select fullWidth name="urgency" value={formData.urgency} onChange={handleChange}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>

          {/* Hidden fields for patient_hn and service_point_id */}
          <input type="hidden" name="patientHN" value={formData.patientHN} />
          <input type="hidden" name="servicePointId" value={formData.servicePointId} />

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={!formData.language || !formData.translatorId}
          >
            Submit Request
          </Button>
          <Button onClick={handleClose} color="secondary" fullWidth sx={{ mt: 1 }}>
            Cancel
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default IntCoordTabsModal;