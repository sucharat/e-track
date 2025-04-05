import * as XLSX from 'xlsx';

// สีที่ใช้ในการตกแต่ง Excel
const EXCEL_STYLES = {
  headers: {
    fill: { fgColor: { rgb: "4F81BD" } },
    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  },
  subHeaders: {
    fill: { fgColor: { rgb: "DCE6F1" } },
    font: { bold: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  },
  oddRows: {
    fill: { fgColor: { rgb: "F2F2F2" } }
  },
  evenRows: {
    fill: { fgColor: { rgb: "FFFFFF" } }
  },
  cells: {
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  },
  title: {
    font: { sz: 16, bold: true },
    alignment: { horizontal: "center" }
  },
  dateRange: {
    font: { sz: 12, italic: true },
    alignment: { horizontal: "center" }
  }
};

// ฟังก์ชันสำหรับจัดรูปแบบข้อมูล
export const formatExcelData = (rawData) => {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return [];
  }
  
  return rawData.map(item => ({
    'Request ID': item.request_id,
    'Request Date': item.request_date,
    'Request Time': item.request_time,
    'Patient HN': item.patient_hn,
    'Patient Name': item.patient_name,
    'Type': item.request_type,
    'Priority': item.priority,
    'Department': item.base_service_point_id,
    'Escort': item.staff_name,
    'Equipment': item.equipment_name,
    'Status': item.status,
    'Finish Date': item.last_finish ? item.last_finish.split(' ')[0] : '',
    'Finish Time': item.last_finish ? item.last_finish.split(' ')[1] : '',
    'Requestor': item.requestor
  }));
};

// สร้างไฟล์ Excel ที่มีการจัดรูปแบบ
export const generateStyledExcel = (data, options = {}) => {
  const {
    title = "Patient Escort Requests",
    startDate,
    endDate,
    sheetName = "Patient Escort Requests"
  } = options;
  
  // สร้าง Workbook และ Worksheet
  const workbook = XLSX.utils.book_new();
  
  // สร้างอาร์เรย์สำหรับข้อมูลหัวตาราง
  const headers = Object.keys(data[0] || {});
  
  // สร้าง worksheet จาก headers และ data
  const worksheet = XLSX.utils.aoa_to_sheet([
    [`${title}`],
    [`Date Range: ${startDate} to ${endDate}`],
    [],  // เว้นบรรทัด
    headers, // หัวข้อตาราง
  ]);
  
  // เพิ่มข้อมูลลงในแผ่นงาน (เริ่มจากแถวที่ 5 เพราะมีส่วนหัว 4 แถว)
  XLSX.utils.sheet_add_json(worksheet, data, { 
    origin: { r: 4, c: 0 },  // เริ่มจากแถวที่ 5 (index 4) 
    skipHeader: true  // ข้ามส่วนหัวตาราง เพราะเราเพิ่มไปแล้ว
  });
  
  // กำหนดขนาดความกว้างของคอลัมน์
  const columnWidths = [
    { wch: 10 },  // Request ID
    { wch: 12 },  // Request Date
    { wch: 10 },  // Request Time
    { wch: 12 },  // Patient HN
    { wch: 25 },  // Patient Name
    { wch: 15 },  // Type
    { wch: 10 },  // Priority
    { wch: 15 },  // Department
    { wch: 25 },  // Escort
    { wch: 20 },  // Equipment
    { wch: 12 },  // Status
    { wch: 12 },  // Finish Date
    { wch: 10 },  // Finish Time
    { wch: 20 },  // Requestor
  ];

  // ปรับแต่ง header และพื้นที่
  if (worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // รวมเซลล์และตกแต่งส่วนหัว
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },  // ชื่อรายงาน
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },  // ช่วงวันที่
    ];
    
    // ตกแต่ง header และเซลล์
    for (let r = 0; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        
        if (!worksheet[cellAddress]) continue;
        
        if (r === 0) {
          worksheet[cellAddress].s = EXCEL_STYLES.title;
        } else if (r === 1) {
          worksheet[cellAddress].s = EXCEL_STYLES.dateRange;
        } else if (r === 3) {
          // ส่วนหัวของตาราง
          worksheet[cellAddress].s = EXCEL_STYLES.headers;
        } else if (r > 3) {
          // แถวข้อมูล
          const style = r % 2 === 0 ? EXCEL_STYLES.evenRows : EXCEL_STYLES.oddRows;
          worksheet[cellAddress].s = { ...EXCEL_STYLES.cells, ...style };
        }
      }
    }
  }
  
  // กำหนดความกว้างของคอลัมน์
  worksheet['!cols'] = columnWidths;
  
  // เพิ่ม worksheet ใน workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  return workbook;
};

// ฟังก์ชันสำหรับดาวน์โหลดไฟล์ Excel
export const downloadExcel = (workbook, fileName) => {
  XLSX.writeFile(workbook, fileName);
};

// ฟังก์ชันรวมสำหรับการส่งออกข้อมูล
export const exportToExcel = (rawData, options = {}) => {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error("No data available to export");
  }
  
  // จัดรูปแบบข้อมูล
  const formattedData = formatExcelData(rawData);
  
  // สร้าง Excel ที่มีการตกแต่ง
  const workbook = generateStyledExcel(formattedData, options);
  
  // ชื่อไฟล์
  const fileName = options.fileName || 
    `Patient_Escort_Requests_${options.startDate}_to_${options.endDate}.xlsx`;
  
  // ดาวน์โหลด
  downloadExcel(workbook, fileName);
  
  return true;
};