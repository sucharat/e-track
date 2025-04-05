import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Chip,
  
  FormHelperText,
  Autocomplete,
  Paper,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import "./PatientModal.css";

const PatientModal = ({
  open,
  handleClose,
  handleSubmit,
  currentUser,
  equipmentList,
  translatorOptions,
  escortRequests,
  onRefreshData 
}) => {

  const initialFormData = {
    patient: "",
    department: "After: Checkup Contract",
    priority: "Normal",
    escort: "",
    item: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({
    patient: false,
    item: false,
  });
  const [selectedEscort, setSelectedEscort] = useState(null);
  const [availableEscorts, setAvailableEscorts] = useState([]);

  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok"
  }).replace(",", ""));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
      }).replace(",", ""));
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);

  // Define department options array
  const departmentOptions = [
    "ER",
    "ICU",
    "IVF",
    "OPD",
    "IPD",
    "After: Checkup Contract",
    "After: Dermatology Department",
    "After: Heart Clinic",
    "Anesthesiology Department",
    "BadalVeda Diving Medical Center",
    "C.C.U."
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Reset form data
      setFormData(initialFormData);
      setErrors({
        patient: false,
        item: false,
      });
      selectPriorityBasedEscort();
    }
  }, [open, translatorOptions, escortRequests]);

  useEffect(() => {
    if (
      equipmentList &&
      equipmentList.length > 0 &&
      formData.item.length === 0
    ) {
      setFormData((prev) => ({
        ...prev,
        item: [equipmentList[0].id.toString()],
      }));
    }
  }, [equipmentList]);

// Add to PatientModal.js
const refreshData = async () => {
  try {
    // Call the parent component's refresh function if provided
    if (onRefreshData) {
      await onRefreshData();
    }
    // After refreshing data, rerun the escort selection logic
    selectPriorityBasedEscort();
  } catch (error) {
    console.error("Error refreshing data:", error);
  }
};

// Update useEffect to refresh data when modal opens
useEffect(() => {
  if (open) {
    setFormData(initialFormData);
    setErrors({
      patient: false,
      item: false,
    });
    
    refreshData();
  }
}, [open]); 

const selectPriorityBasedEscort = () => {
  if (!translatorOptions || translatorOptions.length === 0) {
    setAvailableEscorts([]);
    return;
  }

  // Filter only available escorts (those with is_free === "1")
  const availEscorts = translatorOptions.filter(escort => escort.is_free === "1");
  
  if (availEscorts.length === 0) {
    console.warn("No available escorts found");
    setSelectedEscort(null);
    setAvailableEscorts([]);
    return;
  }

  setAvailableEscorts(availEscorts);

  // Create a mapping of escort IDs to their last finish times
  const escortLastFinishTimes = {};
  
  if (escortRequests && escortRequests.length > 0) {
    escortRequests.forEach(request => {
      if (request.staff_id && request.last_finish) {
        if (!escortLastFinishTimes[request.staff_id] || 
            new Date(request.last_finish) > new Date(escortLastFinishTimes[request.staff_id])) {
          escortLastFinishTimes[request.staff_id] = request.last_finish;
        }
      }
    });
  }

  // Sort escorts by idle time (those with no records first, then by oldest finish time)
  const sortedEscorts = [...availEscorts].sort((a, b) => {
    const aLastFinish = escortLastFinishTimes[a.eid];
    const bLastFinish = escortLastFinishTimes[b.eid];

    if (!aLastFinish && !bLastFinish) return 0;

    if (!aLastFinish) return -1;
    if (!bLastFinish) return 1;

    return new Date(aLastFinish) - new Date(bLastFinish);
  });

  // Select the escort with longest idle time (first in sorted array)
  if (sortedEscorts.length > 0) {
    const priorityEscort = sortedEscorts[0];

    let idleTimeText = "";
    if (escortLastFinishTimes[priorityEscort.eid]) {
      const lastFinish = new Date(escortLastFinishTimes[priorityEscort.eid]);
      const now = new Date();
      const diffMs = now - lastFinish;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffHours > 0) {
        idleTimeText = ` - Idle for ${diffHours}h ${diffMins % 60}m`;
      } else {
        idleTimeText = ` - Idle for ${diffMins}m`;
      }
    } else {
      idleTimeText = " - No previous tasks";
    }
    
    setSelectedEscort({
      ...priorityEscort,
      idleTimeText: idleTimeText
    });

    setFormData(prev => ({
      ...prev,
      escort: priorityEscort.eid
    }));
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'escort') return;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEscortChange = (e) => {
    const selectedId = e.target.value;
    const escort = availableEscorts.find(e => e.eid === selectedId);
    
    if (escort) {
      setSelectedEscort(escort);
      setFormData({
        ...formData,
        escort: selectedId
      });
    }
  };

  // Department Autocomplete handler
  const handleDepartmentChange = (event, newValue) => {
    setFormData({
      ...formData,
      department: newValue || "",
    });
  };

  // Equipment Autocomplete handler
  const handleEquipmentChange = (event, newValues) => {
    setFormData({
      ...formData,
      item: newValues.map(value => value.id.toString()),
    });
  };

  const getEquipmentNameById = (id) => {
    if (!equipmentList) return "Loading...";
    const equipment = equipmentList.find((item) => item.id.toString() === id);
    return equipment ? equipment.equipment_name : "Unknown Equipment";
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // ตรวจสอบ HN ผู้ป่วย
    if (!formData.patient.trim()) {
      newErrors.patient = true;
      isValid = false;
    }
    // เลือกอุปกรณ์อย่างน้อย 1 ชิ้น
    if (!formData.item || formData.item.length === 0) {
      newErrors.item = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    handleSubmit(e, formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="md"
      className="patient-modal"
    >
      <Paper elevation={6} className="modal-paper">
        <Box className="modal-header">
          <Box className="header-content">
            <MedicalServicesIcon className="header-icon" />
            <Typography variant="h6" component="h2">
              New Patient Escort Request
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

        <Divider />

        <Box
          component="form"
          onSubmit={handleFormSubmit}
          noValidate
          className="form-container"
        >
          <Typography variant="subtitle1" className="section-title">
            Patient Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <MedicalServicesIcon fontSize="small" className="field-icon" />
                  Patient HN
                </Typography>
                <TextField
                  fullWidth
                  name="patient"
                  value={formData.patient}
                  onChange={handleChange}
                  required
                  error={errors.patient}
                  helperText={errors.patient ? "Patient HN is required" : ""}
                  className="form-field"
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <LocationOnIcon fontSize="small" className="field-icon" />
                  Department
                </Typography>
                <Autocomplete
                  fullWidth
                  options={departmentOptions}
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      size="small"
                      className="form-field"
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>

          <Typography variant="subtitle1" className="section-title">
            Request Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <PriorityHighIcon fontSize="small" className="field-icon" />
                  Priority Level
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`priority-select priority-${formData.priority.toLowerCase()}`}
                  >
                    <MenuItem value="Normal">Normal</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box className="form-section">
                <Typography variant="subtitle2" className="field-label">
                  <DirectionsWalkIcon fontSize="small" className="field-icon" />
                  Assigned Escort
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    name="escort"
                    value={formData.escort}
                    onChange={handleEscortChange}
                    disabled
                    className="escort-select"
                  >
                    {availableEscorts.length > 0 ? (
                      availableEscorts.map(escort => (
                        <MenuItem key={escort.eid} value={escort.eid}>
                          {escort.full_name} ({escort.tel || "No Ext."})
                          {escort.eid === selectedEscort?.eid && (
                            <Chip
                              size="small"
                              label={selectedEscort.idleTimeText}
                              className="idle-time-chip"
                            />
                          )}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">
                        <em>No available escorts</em>
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {selectedEscort 
                      ? `Auto-assigned to ${selectedEscort.full_name}${selectedEscort.idleTimeText}` 
                      : "No available escorts found - please try again later"}
                  </FormHelperText>
                </FormControl>
              </Box>
            </Grid>
          </Grid>

          <Box className="form-section">
            <Typography variant="subtitle2" className="field-label">
              <MedicalServicesIcon fontSize="small" className="field-icon" />
              Equipment Required
            </Typography>
            <FormControl fullWidth error={errors.item}>
              <Autocomplete
                multiple
                options={equipmentList || []}
                getOptionLabel={(option) => option.equipment_name}
                value={(equipmentList || []).filter(equipment => 
                  formData.item.includes(equipment.id.toString())
                )}
                onChange={handleEquipmentChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={errors.item}
                    helperText={errors.item ? "Please select at least one item" : ""}
                    size="small"
                    className="form-field"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.equipment_name}
                      {...getTagProps({ index })}
                      className="equipment-chip"
                    />
                  ))
                }
              />
            </FormControl>
          </Box>

          <Box className="summary-section">
            <Typography variant="subtitle2" className="summary-title">
              Request Summary
            </Typography>
            <Grid container spacing={1} className="summary-grid">
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-label">
                  Patient HN:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" className="summary-value">
                  {formData.patient || "Not provided"}
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
                  Priority:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box className="priority-summary">
                  <PriorityHighIcon fontSize="small" className={`priority-icon-${formData.priority.toLowerCase()}`} />
                  <Typography variant="body2" className={`summary-value priority-text-${formData.priority.toLowerCase()}`}>
                    {formData.priority}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box className="button-container">
            <Button onClick={handleClose} className="cancel-button">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!selectedEscort}
              className={`submit-button priority-${formData.priority.toLowerCase()}`}
            >
              Submit Request
            </Button>
          </Box>
        </Box>
      </Paper>
    </Dialog>
  );
};

export default PatientModal;