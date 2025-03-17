

import React, { useState } from "react";
import { Modal, Box, Button, TextField, Select, MenuItem, Typography } from "@mui/material";
import './ManagerModal.css'

const ManagerModal = ({ open, handleClose, handleSubmit }) => {
  const [formData, setFormData] = useState({
    patient: "",
    department: "After: Checkup Contract",
    priority: "Normal",
    escort: "นิคม วรรณเลิศอุดม",
    item: "ไม่ระบุ (Not Specified)",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <Typography variant="h5" id="modal-title" gutterBottom>
          New Manager Request
        </Typography>
        <form onSubmit={(e) => handleSubmit(e, formData)}>
          <TextField
            fullWidth
            label="Patient Name"
            name="patient"
            value={formData.patient}
            onChange={handleChange}
            margin="normal"
            required
            
          />

          <Typography variant="subtitle1" gutterBottom>
            Department:
          </Typography>
          <Select fullWidth name="department" value={formData.department} onChange={handleChange}>
            <MenuItem value="After: Checkup Contract">After: Checkup Contract</MenuItem>
            <MenuItem value="After: Dermatology Department">After: Dermatology Department</MenuItem>
            <MenuItem value="After: Heart Clinic">After: Heart Clinic</MenuItem>
            <MenuItem value="After: Intervention X-Ray">Anesthesiology Department</MenuItem>
            <MenuItem value="BadalVeda Diving Medical Center">BadalVeda Diving Medical Center</MenuItem>
            <MenuItem value="C.C.U.">C.C.U.</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom>
            Priority:
          </Typography>
          <Select fullWidth name="priority" value={formData.priority} onChange={handleChange}>
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom>
            Escort:
          </Typography>
          <Select fullWidth name="escort" value={formData.escort} onChange={handleChange}>
            <MenuItem value="นิคม วรรณเลิศอุดม">นิคม วรรณเลิศอุดม</MenuItem>
            <MenuItem value="มะราวี ลือโบะ">มะราวี ลือโบะ</MenuItem>
            <MenuItem value="พงษ์ภิสิทธิ์ รักษาเขตร์">พงษ์ภิสิทธิ์ รักษาเขตร์</MenuItem>
            <MenuItem value="ภรเทพ หมันกุล">ภรเทพ หมันกุล</MenuItem>
            <MenuItem value="อภิวัฒน์ ฟองพิทักษ์">อภิวัฒน์ ฟองพิทักษ์</MenuItem>
          </Select>

          <Typography variant="subtitle1" gutterBottom>
            Item:
          </Typography>
          <Select fullWidth name="item" value={formData.item} onChange={handleChange}>
            <MenuItem value="ไม่ระบุ (Not Specified)">ไม่ระบุ (Not Specified)</MenuItem>
            <MenuItem value="รถนั่ง">รถนั่ง</MenuItem>
            <MenuItem value="รถนอน">รถนอน</MenuItem>
            <MenuItem value="เสาน้ำเกลือ">เสาน้ำเกลือ</MenuItem>
            <MenuItem value="รถขนของ">รถขนของ</MenuItem>
            <MenuItem value="ถัง Oxygen">ถัง Oxygen</MenuItem>
            <MenuItem value="Padslide">Padslide</MenuItem>
          </Select>

          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
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

export default ManagerModal;

