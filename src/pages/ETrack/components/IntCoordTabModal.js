import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  FormControl,
  Autocomplete,
  Paper,
  Divider,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  Badge,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TranslateIcon from "@mui/icons-material/Translate";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import "./IntCoordTabsModal.css";

const IntCoordTabsModal = ({
  open,
  handleClose,
  handleSubmit,
  translatorOptions = [],
  currentUser = "test",
}) => {
  const [formData, setFormData] = useState({
    language: "",
    translatorId: "",
    coordinator: "",
    extension: "",
    department: "After: Checkup Contract",
    urgency: "Normal",
    patientHN: "05-12-12345",
    servicePointId: "OR1234",
  });

  const [currentDateTime, setCurrentDateTime] = useState(
    new Date()
      .toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      })
      .replace(",", "")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(
        new Date()
          .toLocaleString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "Asia/Bangkok",
          })
          .replace(",", "")
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Group translators by language for the dropdown
  const [languageOptions, setLanguageOptions] = useState([]);
  const [translatorsByLanguage, setTranslatorsByLanguage] = useState({});
  const [activeSection, setActiveSection] = useState("translator");

  const departmentOptions = [
    "After: Checkup Contract",
    "After: Dermatology Department",
    "After: Heart Clinic",
    "C.C.U.",
    "Cashier OPD Floor 2",
  ];

  // Process translator options when they change
  useEffect(() => {
    if (translatorOptions && translatorOptions.length > 0) {
      // Create a map of languages to translators
      const languageMap = {};
      const uniqueLanguages = new Set();
      translatorOptions.forEach((translator) => {
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
            lang_id: translator.lang_id || "1",
          });
          uniqueLanguages.add(translator.lang);
        }
      });

      setLanguageOptions(Array.from(uniqueLanguages));
      setTranslatorsByLanguage(languageMap);

      // Set default language and translator if available
      if (uniqueLanguages.size > 0) {
        const firstLanguage = Array.from(uniqueLanguages)[0];
        const availableTranslators = languageMap[firstLanguage].filter(
          (t) => t.isAvailable
        );

        // Select an available translator if possible
        const translator =
          availableTranslators.length > 0
            ? availableTranslators[0]
            : languageMap[firstLanguage][0];

        setFormData({
          ...formData,
          language: firstLanguage,
          translatorId: translator.id,
          coordinator: translator.name,
          extension: translator.extension,
        });
      }
    } else {
      // Fallback to default values if no translator options
      const defaultLanguageOptions = [
        "German",
        "Italian",
        "French",
        "Russian",
        "Spanish",
      ];
      const defaultMap = {};

      defaultLanguageOptions.forEach((lang, index) => {
        defaultMap[lang] = [
          {
            id: `default${index}`,
            name: `Default ${lang} Translator`,
            extension: "*0000",
            isAvailable: true,
            lang_id: `${index + 1}`,
          },
        ];
      });

      setLanguageOptions(defaultLanguageOptions);
      setTranslatorsByLanguage(defaultMap);
      setFormData({
        ...formData,
        language: "German",
        translatorId: "default0",
        coordinator: "Default German Translator",
        extension: "*0000",
      });
    }
  }, [translatorOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData };

    if (name === "translatorId") {
      updatedData.translatorId = value;
      // Find the selected translator and update related fields
      const translators = translatorsByLanguage[updatedData.language] || [];
      const selectedTranslator = translators.find((t) => t.id === value);

      if (selectedTranslator) {
        updatedData.coordinator = selectedTranslator.name;
        updatedData.extension = selectedTranslator.extension;
      }
    } else {
      updatedData[name] = value;
    }
    setFormData(updatedData);
  };

  // Handle language change from Autocomplete
  const handleLanguageChange = (event, newValue) => {
    let updatedData = { ...formData };

    updatedData.language = newValue || "";
    // Update translator selection when language changes
    if (newValue) {
      const translators = translatorsByLanguage[newValue] || [];
      const availableTranslators = translators.filter((t) => t.isAvailable);
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
  } else {
      updatedData.translatorId = "";
      updatedData.coordinator = "";
      updatedData.extension = "";
    }
    setFormData(updatedData);
  };

  // Handle department change from Autocomplete
  const handleDepartmentChange = (event, newValue) => {
    setFormData({
      ...formData,
      department: newValue || "After: Checkup Contract",
    });
  };

  // Get urgency color based on value
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical":
        return "#ED1C24"; // Red
      case "Normal":
        return "#0071BC"; // Blue
      case "Low":
        return "#008000"; // Green
      default:
        return "#716E6E"; // Gray
    }
  };

  // Get urgency icon based on value
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case "Critical":
        return <ErrorIcon fontSize="small" sx={{ color: "#ED1C24" }} />;
      case "Normal":
        return <PriorityHighIcon fontSize="small" sx={{ color: "#0071BC" }} />;
      case "Low":
        return <CheckCircleIcon fontSize="small" sx={{ color: "#008000" }} />;
      default:
        return <PriorityHighIcon fontSize="small" sx={{ color: "#716E6E" }} />;
    }
  };

  // Check if translator is available
  const isTranslatorAvailable = () => {
    if (!formData.translatorId || !formData.language) return false;

    const translators = translatorsByLanguage[formData.language] || [];
    const selectedTranslator = translators.find(
      (t) => t.id === formData.translatorId
    );

    return selectedTranslator && selectedTranslator.isAvailable;
  };
  
  const switchSection = (section) => {
    setActiveSection(section);
  };
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      className="intl-coord-modal"
    >
      <Paper elevation={6} className="modal-paper">
        <Box className="modal-header">
          <Box className="header-content">
            <TranslateIcon className="header-icon" />
            <Typography variant="h6" component="h2">
              New Intl Coordinator Request
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box className="user-info">
          <Box className="info-item">
            <PersonIcon fontSize="small" />
            <Typography variant="body2">{currentUser}</Typography>
          </Box>
          <Box className="info-item">
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">{currentDateTime}</Typography>
          </Box>
        </Box>

        <Divider className="divider" />
        <form
          onSubmit={(e) => handleSubmit(e, formData)}
          className="form-container"
        >
          <Typography variant="subtitle1" className="section-title">
            Translator Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <TranslateIcon fontSize="small" className="field-icon" />
                  Language
                </Typography>
                <Autocomplete
                  fullWidth
                  value={formData.language}
                  onChange={handleLanguageChange}
                  options={languageOptions}
                  className="form-field language-field"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search language..."
                      variant="outlined"
                      size="small"
                    />
                  )}
                  disableClearable
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <PhoneIcon fontSize="small" className="field-icon" />
                  Extension
                </Typography>
                <TextField
                  fullWidth
                  name="extension"
                  value={formData.extension}
                  onChange={handleChange}
                  disabled
                  className="form-field extension-field"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>

          <Box className="form-section">
            <Box className="field-header">
              <Typography variant="subtitle2" className="field-label">
                <PersonIcon fontSize="small" className="field-icon" />
                Translator
              </Typography>
              {formData.translatorId && (
                <Chip
                  label={
                    isTranslatorAvailable() ? "Available" : "Not Available"
                  }
                  size="small"
                  color={isTranslatorAvailable() ? "success" : "error"}
                  variant="outlined"
                  className="translator-status-chip"
                />
              )}
            </Box>
            <Select
              fullWidth
              name="translatorId"
              value={formData.translatorId}
              onChange={handleChange}
              disabled={
                !formData.language ||
                !(translatorsByLanguage[formData.language]?.length > 0)
              }
              className={`form-field translator-field ${
                !formData.language ? "disabled" : ""
              }`}
              size="small"
              MenuProps={{
                className: "translator-menu",
                TransitionProps: { timeout: 0 },
              }}
            >
              {(translatorsByLanguage[formData.language] || []).map(
                (translator) => (
                  <MenuItem
                    key={translator.id}
                    value={translator.id}
                    className={`translator-item ${
                      !translator.isAvailable ? "unavailable" : ""
                    }`}
                  >
                    <Box className="translator-item-content">
                      <PersonIcon
                        fontSize="small"
                        sx={{
                          marginRight: 1,
                          color: translator.isAvailable ? "#0071BC" : "#999",
                        }}
                      />
                      <span>{translator.name}</span>
                    </Box>
                    {!translator.isAvailable && (
                      <span className="unavailable-tag">Not Available</span>
                    )}
                    {translator.isAvailable && (
                      <CheckCircleIcon
                        fontSize="small"
                        sx={{ color: "#008000" }}
                      />
                    )}
                  </MenuItem>
                )
              )}
            </Select>
          </Box>

          <Typography variant="subtitle1" className="section-title">
            Request Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <LocationOnIcon fontSize="small" className="field-icon" />
                  Department
                  <Tooltip
                    title="Select the department that requires translation services"
                    arrow
                  >
                    <HelpOutlineIcon fontSize="small" className="help-icon" />
                  </Tooltip>
                </Typography>
                <Autocomplete
                  fullWidth
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  className="form-field department-field"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search department..."
                      variant="outlined"
                      size="small"
                    />
                  )}
                  disableClearable
                />
              </Box>
            </Grid>
          </Grid>

          <Box className="form-section">
            <Typography variant="subtitle2" className="field-label">
              <PriorityHighIcon fontSize="small" className="field-icon" />
              Urgency Level
              <Tooltip
                title="Critical: Immediate attention required. Normal: Standard response time. Low: Can be scheduled at convenience."
                arrow
              >
                <HelpOutlineIcon fontSize="small" className="help-icon" />
              </Tooltip>
            </Typography>
            <Box className="urgency-buttons">
              {["Low", "Normal", "Critical"].map((level) => (
                <Button
                  key={level}
                  variant={
                    formData.urgency === level ? "contained" : "outlined"
                  }
                  className={`urgency-button urgency-${level.toLowerCase()}`}
                  onClick={() => setFormData({ ...formData, urgency: level })}
                  startIcon={getUrgencyIcon(level)}
                  style={{
                    backgroundColor:
                      formData.urgency === level
                        ? getUrgencyColor(level)
                        : "transparent",
                    color:
                      formData.urgency === level
                        ? "white"
                        : getUrgencyColor(level),
                    borderColor: getUrgencyColor(level),
                  }}
                >
                  {level}
                </Button>
              ))}
            </Box>
          </Box>

          <Box className="patient-info-section">
            <Typography variant="subtitle2" className="section-sub-title">
              Patient Information
            </Typography>
            <Box className="patient-info">
              <Typography variant="body2">
                <strong>HN:</strong> {formData.patientHN}
              </Typography>
              <Typography variant="body2">
                <strong>Service Point:</strong> {formData.servicePointId}
              </Typography>
            </Box>
          </Box>

          {/* Hidden fields for patient_hn and service_point_id */}
          <input type="hidden" name="patientHN" value={formData.patientHN} />
          <input
            type="hidden"
            name="servicePointId"
            value={formData.servicePointId}
          />
          <Divider className="form-divider" />

          <Box className="summary-section">
            <Typography variant="subtitle2" className="summary-title">
              Request Summary
            </Typography>
            <Grid container spacing={1} className="summary-grid">
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-label">
                  Language:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-value">
                  {formData.language || "Not selected"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-label">
                  Translator:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-value">
                  {formData.coordinator || "Not selected"}
                  {formData.coordinator && !isTranslatorAvailable() && (
                    <span className="unavailable-mini-tag">Not Available</span>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-label">
                  Department:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-value">
                  {formData.department}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-label">
                  Urgency:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box className="urgency-summary">
                  {getUrgencyIcon(formData.urgency)}
                  <Typography
                    variant="body2"
                    className="summary-value urgency-text"
                    style={{ color: getUrgencyColor(formData.urgency) }}
                  >
                    {formData.urgency}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box className="button-container">
            <Button
              onClick={handleClose}
              className="cancel-button"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="submit-button"
              disabled={!formData.language || !formData.translatorId}
              style={{
                backgroundColor: getUrgencyColor(formData.urgency),
              }}
            >
              Submit Request
            </Button>
          </Box>
        </form>
      </Paper>
    </Modal>
  );
};

export default IntCoordTabsModal;