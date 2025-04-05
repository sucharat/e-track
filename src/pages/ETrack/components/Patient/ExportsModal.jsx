import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { exportToExcel } from './ExcelService';
import { PATIENT_ESCORT_TEMPLATE, formatDataByTemplate } from './ExcelTemplate';
import './ExportModal.css';

const ExportModal = ({ open, handleClose, exportData, title = "Export Data" }) => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportType, setExportType] = useState('full'); // full, summary
  
  // ตัวเลือกรูปแบบรายงาน
  const reportTypes = [
    { value: 'full', label: 'รายงานละเอียด (Detailed Report)' },
    { value: 'summary', label: 'รายงานสรุป (Summary Report)' }
  ];

  const handleExport = async () => {
    // ตรวจสอบข้อมูลวันที่
    if (!startDate || !endDate) {
      setError("กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด");
      return;
    }

    if (endDate.isBefore(startDate)) {
      setError("วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ดึงข้อมูลตามช่วงวันที่
      const data = await exportData(startDate, endDate);
      
      if (!data || data.length === 0) {
        setError("ไม่พบข้อมูลในช่วงวันที่ที่เลือก");
        setIsLoading(false);
        return;
      }

      // เตรียมข้อมูลสำหรับการส่งออก
      const formattedStartDate = startDate.format('YYYY-MM-DD');
      const formattedEndDate = endDate.format('YYYY-MM-DD');
      
      // เลือกเทมเพลตและสร้างไฟล์
      if (exportType === 'full') {
        // รายงานแบบละเอียด
        exportToExcel(data, {
          title: PATIENT_ESCORT_TEMPLATE.title,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          sheetName: PATIENT_ESCORT_TEMPLATE.sheetName,
          fileName: `Patient_Escort_Detailed_${formattedStartDate}_to_${formattedEndDate}.xlsx`
        });
      } else {
        // รายงานสรุป - ใช้เทมเพลตที่แตกต่าง
        const formattedData = formatDataByTemplate(data, PATIENT_ESCORT_TEMPLATE);
        
        exportToExcel(formattedData, {
          title: "PATIENT ESCORT SERVICE - SUMMARY REPORT",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          sheetName: "Summary",
          fileName: `Patient_Escort_Summary_${formattedStartDate}_to_${formattedEndDate}.xlsx`
        });
      }
      
      handleClose();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล:", error);
      setError(`ไม่สามารถส่งออกข้อมูลได้: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="export-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 450,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2
      }}>
        <Typography id="export-modal-title" variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="report-type-label">รูปแบบรายงาน</InputLabel>
            <Select
              labelId="report-type-label"
              id="report-type"
              value={exportType}
              label="รูปแบบรายงาน"
              onChange={(e) => setExportType(e.target.value)}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" mb={1}>เลือกช่วงวันที่</Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DatePicker
                label="วันที่เริ่มต้น"
                value={startDate}
                onChange={(newDate) => setStartDate(newDate)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
              <DatePicker
                label="วันที่สิ้นสุด"
                value={endDate}
                onChange={(newDate) => setEndDate(newDate)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'กำลังส่งออก...' : 'ส่งออกเป็น Excel'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExportModal;