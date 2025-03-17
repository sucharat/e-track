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
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./ManagerModal.css";

const PatientModal = ({
  open,
  handleClose,
  handleSubmit,
  currentUser,
  currentDateTime,
  equipmentList,
  translatorOptions,
}) => {
  // Update initial form data without escort
  const initialFormData = {
    patient: "",
    department: "After: Checkup Contract",
    priority: "Normal",
    escort: "", // Will be set randomly from available escorts
    item: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({
    patient: false,
    item: false,
  });
  const [selectedEscort, setSelectedEscort] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Reset form data
      setFormData(initialFormData);
      setErrors({
        patient: false,
        item: false,
      });
      
      // Select random available escort when modal opens
      selectRandomAvailableEscort();
    }
  }, [open, translatorOptions]);

  // Set default equipment when equipment list loads
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

  // Function to select a random available escort
  const selectRandomAvailableEscort = () => {
    if (!translatorOptions || translatorOptions.length === 0) {
      return;
    }

    // Filter only available escorts (is_free === "1")
    const availableEscorts = translatorOptions.filter(escort => escort.is_free === "1");

    if (availableEscorts.length === 0) {
      // No available escorts, show message or handle this case
      console.warn("No available escorts found");
      setSelectedEscort(null);
      return;
    }

    // Select random escort from available ones
    const randomIndex = Math.floor(Math.random() * availableEscorts.length);
    const randomEscort = availableEscorts[randomIndex];

    // Set the selected escort in the form data
    setFormData(prev => ({
      ...prev,
      escort: randomEscort.eid
    }));

    // Store the selected escort object for display
    setSelectedEscort(randomEscort);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Skip escort changes as it's handled by random selection
    if (name === 'escort') return;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Multi-select handler for equipment for MUI
  const handleItemChange = (event) => {
    const selectedValues = event.target.value;
    setFormData({
      ...formData,
      item: selectedValues,
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

    // ตรวจสอบว่าเลือกอุปกรณ์อย่างน้อย 1 ชิ้น
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

    // ส่งข้อมูลไปยัง parent component
    handleSubmit(e, formData);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        New Patient Escort Request
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          noValidate
          sx={{ mt: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient HN"
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                required
                variant="outlined"
                margin="normal"
                error={errors.patient}
                helperText={errors.patient ? "Patient HN is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
                >
                  <MenuItem value="">
                    <em>Select Department</em>
                  </MenuItem>
                  <MenuItem value="ER">ER</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                  <MenuItem value="OPD">OPD</MenuItem>
                  <MenuItem value="IPD">IPD</MenuItem>
                  <MenuItem value="After: Checkup Contract">
                    After: Checkup Contract
                  </MenuItem>
                  <MenuItem value="After: Dermatology Department">
                    After: Dermatology Department
                  </MenuItem>
                  <MenuItem value="After: Heart Clinic">
                    After: Heart Clinic
                  </MenuItem>
                  <MenuItem value="Anesthesiology Department">
                    Anesthesiology Department
                  </MenuItem>
                  <MenuItem value="BadalVeda Diving Medical Center">
                    BadalVeda Diving Medical Center
                  </MenuItem>
                  <MenuItem value="C.C.U.">C.C.U.</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="escort-label">Assigned Escort</InputLabel>
                <Select
                  labelId="escort-label"
                  id="escort"
                  name="escort"
                  value={formData.escort}
                  onChange={handleChange}
                  label="Assigned Escort"
                  disabled={true} // Disable the dropdown
                  sx={{ 
                    '& .MuiSelect-select': { 
                      color: selectedEscort ? 'text.primary' : 'text.secondary',
                      fontStyle: selectedEscort ? 'normal' : 'italic'
                    },
                    bgcolor: (theme) => selectedEscort ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                  }}
                >
                  {selectedEscort ? (
                    <MenuItem value={selectedEscort.eid}>
                      {selectedEscort.full_name} ({selectedEscort.tel || "No Ext."}) - Available
                    </MenuItem>
                  ) : (
                    <MenuItem value="">
                      <em>No available escorts</em>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  {selectedEscort 
                    ? "Escort automatically assigned from available staff" 
                    : "No available escorts found - please try again later"}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          <FormControl fullWidth required margin="normal" error={errors.item}>
            <InputLabel id="equipment-label">Equipment Required</InputLabel>
            <Select
              labelId="equipment-label"
              id="equipment"
              multiple
              name="item"
              value={formData.item}
              onChange={handleItemChange} 
              input={<OutlinedInput label="Equipment Required" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const equipment = equipmentList.find(
                      (eq) => eq.id.toString() === value.toString()
                    );
                    return equipment ? (
                      <Chip key={value} label={equipment.equipment_name} />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {equipmentList &&
                equipmentList.map((equipment) => (
                  <MenuItem key={equipment.id} value={equipment.id.toString()}>
                    <Checkbox
                      checked={
                        formData.item.indexOf(equipment.id.toString()) > -1
                      }
                    />
                    <ListItemText primary={equipment.equipment_name} />
                  </MenuItem>
                ))}
            </Select>
            {errors.item && <FormHelperText>Please select at least one item</FormHelperText>}
          </FormControl>

          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="h6" component="h5">
              Request Details
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <Box component="span" fontWeight="fontWeightBold">
                Requestor:
              </Box>{" "}
              {currentUser}
            </Typography>
            <Typography variant="body1">
              <Box component="span" fontWeight="fontWeightBold">
                Date/Time:
              </Box>{" "}
              {currentDateTime}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={handleClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!selectedEscort} // Disable submit if no escort available
            >
              Submit Request
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PatientModal;