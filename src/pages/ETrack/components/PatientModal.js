import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import "./ManagerModal.css";

const PatientModal = ({
  open,
  handleClose,
  handleSubmit,
  currentUser,
  currentDateTime,
  equipmentList,
}) => {
  const initialFormData = {
    patient: "",
    department: "After: Checkup Contract",
    priority: "Normal",
    escort: "นิคม วรรณเลิศอุดม",
    item: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({
    patient: false,
    item: false,
  });

  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setErrors({
        patient: false,
        item: false,
      });
    }
  }, [open]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors({ ...errors, [name]: false });

    if (name === "item") {
      setFormData({ ...formData, item: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
    <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" id="modal-title" gutterBottom>
          New Patient Escort Request
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          Date: {currentDateTime || "2025-03-07 08:54:15"} • User:{" "}
          {currentUser || "TEST"}
        </Typography>
        <form onSubmit={handleFormSubmit}>
          <TextField
            fullWidth
            label="Patient HN"
            name="patient"
            value={formData.patient}
            onChange={handleChange}
            margin="normal"
            required
            error={errors.patient}
            helperText={errors.patient ? "กรุณาระบุหมายเลข HN ของผู้ป่วย" : ""}
            placeholder="ระบุหมายเลข HN ของผู้ป่วย"
          />

          <Typography variant="subtitle1" gutterBottom>
            Department:
          </Typography>
          <Select
            fullWidth
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            <MenuItem value="After: Checkup Contract">
              After: Checkup Contract
            </MenuItem>
            <MenuItem value="After: Dermatology Department">
              After: Dermatology Department
            </MenuItem>
            <MenuItem value="After: Heart Clinic">After: Heart Clinic</MenuItem>
            <MenuItem value="After: Intervention X-Ray">
              Anesthesiology Department
            </MenuItem>
            <MenuItem value="BadalVeda Diving Medical Center">
              BadalVeda Diving Medical Center
            </MenuItem>
            <MenuItem value="C.C.U.">C.C.U.</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom>
            Priority:
          </Typography>
          <Select
            fullWidth
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom>
            Escort:
          </Typography>
          <Select
            fullWidth
            name="escort"
            value={formData.escort}
            onChange={handleChange}
          >
            <MenuItem value="นิคม วรรณเลิศอุดม">นิคม วรรณเลิศอุดม</MenuItem>
            <MenuItem value="มะราวี ลือโบะ">มะราวี ลือโบะ</MenuItem>
            <MenuItem value="พงษ์ภิสิทธิ์ รักษาเขตร์">
              พงษ์ภิสิทธิ์ รักษาเขตร์
            </MenuItem>
            <MenuItem value="ภรเทพ หมันกุล">ภรเทพ หมันกุล</MenuItem>
            <MenuItem value="อภิวัฒน์ ฟองพิทักษ์">อภิวัฒน์ ฟองพิทักษ์</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
            Equipment:
            {errors.item && (
              <Typography
                component="span"
                color="error"
                variant="caption"
                sx={{ ml: 1 }}
              >
                กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ
              </Typography>
            )}
          </Typography>
          <Select
            fullWidth
            multiple
            name="item"
            value={formData.item}
            onChange={handleChange}
            input={<OutlinedInput />}
            renderValue={(selected) =>
              selected.map((id) => getEquipmentNameById(id)).join(", ")
            }
            error={errors.item}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {equipmentList && equipmentList.length > 0 ? (
              equipmentList.map((equipment) => (
                <MenuItem key={equipment.id} value={equipment.id.toString()}>
                  <Checkbox
                    checked={
                      formData.item.indexOf(equipment.id.toString()) > -1
                    }
                  />
                  <ListItemText primary={equipment.equipment_name} />
                </MenuItem>
              ))
            ) : (
              <MenuItem value="1">
                <Checkbox checked={true} />
                <ListItemText primary="ไม่ระบุ (Not Specified)" />
              </MenuItem>
            )}
          </Select>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!formData.patient || formData.item.length === 0}
          >
            Submit Request
          </Button>
          <Button
            onClick={handleClose}
            color="secondary"
            fullWidth
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default PatientModal;
