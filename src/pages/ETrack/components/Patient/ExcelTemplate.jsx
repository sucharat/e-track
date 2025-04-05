/**
 * คอมโพเนนต์สำหรับจัดการเทมเพลต Excel
 */

// เทมเพลตสำหรับรายงานการขอรับบริการ Patient Escort
export const PATIENT_ESCORT_TEMPLATE = {
    sheetName: "Patient Escort Requests",
    title: "PATIENT ESCORT SERVICE REQUESTS",
    // กำหนดส่วนหัวตารางชัดเจน
    headers: [
      'Request ID', 'Request Date', 'Request Time', 'Patient HN', 'Patient Name',
      'Type', 'Priority', 'Department', 'Escort', 'Equipment', 'Status',
      'Finish Date', 'Finish Time', 'Requestor'
    ],
    columns: [
      { header: 'Request ID', key: 'request_id', width: 10 },
      { header: 'Request Date', key: 'request_date', width: 12 },
      { header: 'Request Time', key: 'request_time', width: 10 },
      { header: 'Patient HN', key: 'patient_hn', width: 12 },
      { header: 'Patient Name', key: 'patient_name', width: 25 },
      { header: 'Type', key: 'request_type', width: 15 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Department', key: 'base_service_point_id', width: 15 },
      { header: 'Escort', key: 'staff_name', width: 25 },
      { header: 'Equipment', key: 'equipment_name', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Finish Date', key: 'finish_date', width: 12, formatter: (item) => 
        item.last_finish ? item.last_finish.split(' ')[0] : '' },
      { header: 'Finish Time', key: 'finish_time', width: 10, formatter: (item) => 
        item.last_finish ? item.last_finish.split(' ')[1] : '' },
      { header: 'Requestor', key: 'requestor', width: 20 }
    ],
    // สถิติที่แสดงในรายงาน
    statistics: [
      { title: 'Total Requests', calculator: (data) => data.length },
      { 
        title: 'Completed Requests', 
        calculator: (data) => data.filter(item => item.status === 'finished' || item.status === 'evaluated').length 
      },
      { 
        title: 'Completion Rate', 
        calculator: (data) => {
          const total = data.length;
          const completed = data.filter(item => item.status === 'finished' || item.status === 'evaluated').length;
          return total > 0 ? `${((completed / total) * 100).toFixed(2)}%` : '0%';
        }
      },
      { 
        title: 'Pending Requests', 
        calculator: (data) => data.filter(item => item.status === 'pending' || item.status === 'created').length 
      },
      { 
        title: 'Average Handling Time (minutes)', 
        calculator: (data) => {
          const completedRequests = data.filter(item => 
            (item.status === 'finished' || item.status === 'evaluated') && item.last_finish && item.request_time && item.request_date
          );
          
          if (completedRequests.length === 0) return 'N/A';
          
          const totalMinutes = completedRequests.reduce((total, item) => {
            const requestDate = new Date(`${item.request_date}T${item.request_time}`);
            const finishDate = new Date(item.last_finish.replace(' ', 'T'));
            const diffMinutes = Math.floor((finishDate - requestDate) / (1000 * 60));
            return total + diffMinutes;
          }, 0);
          
          return (totalMinutes / completedRequests.length).toFixed(2);
        }
      }
    ]
  };
  
  
  // สามารถเพิ่มเทมเพลตอื่นๆ ได้ในอนาคต เช่น
  export const SUMMARY_REPORT_TEMPLATE = {
    // รายละเอียดของเทมเพลตสำหรับรายงานสรุป
  };
  
  // ฟังก์ชันสำหรับแปลงข้อมูลตามเทมเพลต
  export const formatDataByTemplate = (data, template) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.map(item => {
      const formattedItem = {};
      template.columns.forEach(column => {
        if (column.formatter) {
          formattedItem[column.header] = column.formatter(item);
        } else {
          formattedItem[column.header] = item[column.key];
        }
      });
      return formattedItem;
    });
  };
  // ฟังก์ชันสำหรับคำนวณสถิติ
  export const calculateStatistics = (data, template) => {
    if (!template.statistics) return null;
    
    return template.statistics.map(stat => ({
      title: stat.title,
      value: stat.calculator(data)
    }));
  };