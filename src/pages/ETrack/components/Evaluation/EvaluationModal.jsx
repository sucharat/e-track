import './EvaluationModal.css';
import { useState, useEffect, useCallback } from 'react';
import { url, getLocalData } from "../../../../helper/help";

// Staff Evaluation Modal Component
const EvaluationModal = ({ open, handleClose, request, onSubmitEvaluation }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluationCriteria, setEvaluationCriteria] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: "",
        evaluator_id: "",
        evaluation_date: "",
        evaluation_period: "",
        status: "draft",
        comments: "",
        active: "1",
        details: [],
    });
    
    // เตรียม callback function สำหรับการดึงข้อมูลเกณฑ์การประเมิน
    const fetchEvaluationCriteria = useCallback(async () => {
        try {
            const token = getLocalData("token");
            const response = await fetch(`${url}/api/Evaluation/OnGetEvaluationCriteria`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        
            if (!response.ok) {
                throw new Error(`ไม่สามารถดึงข้อมูลเกณฑ์การประเมินได้: ${response.status}`);
            }
        
            const criteria = await response.json();
            return criteria;
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูลเกณฑ์การประเมิน:", error);
            return [];
        }
    }, []);

    // โหลดข้อมูลเกณฑ์การประเมินเมื่อคอมโพเนนต์ถูกโหลด
    useEffect(() => {
        const loadCriteria = async () => {
            const criteria = await fetchEvaluationCriteria();
            setEvaluationCriteria(criteria);
        };
        loadCriteria();
    }, [fetchEvaluationCriteria]);

    // รีเซ็ตฟอร์มเมื่อโมดอลเปิด
    useEffect(() => {
        if (open) {
            // Get current date in YYYY-MM-DD format
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            // Get current period in YYYY-MM format
            const period = `${year}-${month}`;
            
            // Get current user's login (assuming it's available from localStorage or elsewhere)
            const currentUser = localStorage.getItem("userId");
            console.log("👤 ผู้ใช้ปัจจุบัน:", currentUser);
            
            setFormData({
                employee_id: request?.staff_id || "",
                evaluator_id: currentUser,
                evaluation_date: formattedDate,
                evaluation_period: period,
                status: "draft",
                comments: "",
                active: "1",
                details: [],
            });
        }
    }, [open, request]);
    
    // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "comments" ? value : Number(value),
        });
    };
    
   // ฟังก์ชันตรวจสอบค่าก่อน Submit
const validateFormData = (data) => {
  if (!data.employee_id) {
      alert("โปรดเลือกพนักงานที่ต้องการประเมิน");
      return false;
  }
  if (!data.evaluator_id) {
      alert("ไม่พบข้อมูลผู้ประเมิน กรุณาเข้าสู่ระบบใหม่");
      return false;
  }
  if (!data.details.length) {
      alert("กรุณาให้คะแนนอย่างน้อย 1 เกณฑ์");
      return false;
  }
  for (const detail of data.details) {
      if (!detail.criteria_id || detail.score === undefined || detail.score < 1) {
          alert(`คะแนนของเกณฑ์ "${detail.criteria_name || "ไม่ทราบชื่อ"}" ไม่ถูกต้อง`);
          return false;
      }
  }
  return true;
};

// ฟังก์ชัน Submit พร้อมตรวจสอบข้อมูล
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
      // เตรียมข้อมูลก่อนส่ง
      const completeDetails = formData.details.map(detail => {
          const criterion = evaluationCriteria.find(c => c.criteria_id === detail.criteria_id);
          return {
              criteria_id: detail.criteria_id,
              criteria_name: criterion?.criteria_name || "ไม่ทราบชื่อ",
              score: detail.score,
              comments: detail.comments || ""
          };
      });

      const completeFormData = {
          ...formData,
          details: completeDetails
      };

      // ตรวจสอบค่าก่อนส่ง
      if (!validateFormData(completeFormData)) {
          setIsSubmitting(false);
          return;
      }

      console.log("🟢 ส่งข้อมูลการประเมิน:", completeFormData);

      await onSubmitEvaluation(request.request_id, completeFormData);
      handleClose();
  } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่งแบบประเมิน: " + error.message);
  } finally {
      setIsSubmitting(false);
  }
};


    // จัดการการเปลี่ยนแปลงคะแนนตามเกณฑ์
    const handleCriterionChange = (criteriaId, value) => {
        const criterion = evaluationCriteria.find(c => c.criteria_id === criteriaId);
        if (!criterion) return;
        
        const newDetails = [...formData.details];
        const existingIndex = newDetails.findIndex(d => d.criteria_id === criteriaId);
        
        if (existingIndex >= 0) {
            newDetails[existingIndex] = {
                ...newDetails[existingIndex],
                criteria_id: criteriaId,
                criteria_name: criterion.criteria_name,
                score: Number(value)
            };
        } else {
            newDetails.push({
                criteria_id: criteriaId,
                criteria_name: criterion.criteria_name,
                score: Number(value),
                comments: ""
            });
        }
        
        setFormData({
            ...formData,
            details: newDetails
        });
    };

 // ฟังก์ชันที่ปรับปรุงใหม่ให้ทันสมัยและกระชับมากขึ้น
const renderCriteriaInputs = () => {
    return (
        <div className="criteria-card">
            <div className="criteria-card-header">
                <h6 className="mb-0">
                    <i className="fas fa-star me-2 text-warning"></i>
                    ให้คะแนนตามเกณฑ์การประเมิน
                </h6>
            </div>
            <div className="criteria-card-body">
                {evaluationCriteria.map((criterion) => {
                    // คำนวณคะแนนปัจจุบันหรือใช้คะแนนสูงสุดเป็นค่ากลาง
                    const currentScore = formData.details.find(d => d.criteria_id === criterion.criteria_id)?.score || 
                                       Math.ceil(criterion.max_score / 2);
                    
                    // คำนวณเปอร์เซ็นต์สำหรับแสดงแถบความคืบหน้า
                    const percentage = (currentScore / criterion.max_score) * 100;
                    
                    // เลือกสีตามเปอร์เซ็นต์
                    let scoreClass = '';
                    if (percentage >= 80) scoreClass = 'score-excellent';
                    else if (percentage >= 60) scoreClass = 'score-good';
                    else if (percentage >= 40) scoreClass = 'score-average';
                    else scoreClass = 'score-poor';
                    
                    return (
                        <div className="rating-container" key={criterion.criteria_id}>
                            <div className="rating-header">
                                <p className="rating-title">{criterion.criteria_name}</p>
                                <div className={`rating-score ${scoreClass}`}>
                                    {currentScore}/{criterion.max_score}
                                </div>
                            </div>
                            
                            <div className="rating-slider-container">
                                <input
                                    type="range"
                                    className="rating-slider"
                                    min="1"
                                    max={criterion.max_score}
                                    value={currentScore}
                                    onChange={(e) => handleCriterionChange(criterion.criteria_id, e.target.value)}
                                />
                            </div>
                            
                            <div className="rating-progress-track">
                                <div 
                                    className={`rating-progress-fill ${scoreClass}`} 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            
                            {criterion.criteria_description && (
                                <div className="rating-description">
                                    {criterion.criteria_description}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

    if (!request) return null;
        
    return (
        <div className={`modal fade ${open ? "show d-block" : ""}`} tabIndex="-1" aria-hidden={!open}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-star-half-alt me-2 text-warning"></i>
                            ประเมินผลการปฏิบัติงาน
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            {/* แสดงข้อมูลพนักงาน */}
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar-circle me-3 bg-light">
                                    <i className="fas fa-user-tie text-primary"></i>
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">{request.staff_name || "ไม่ระบุ"}</h6>
                                    <small className="text-muted">รหัสคำขอ: #{request.request_id}</small>
                                </div>
                            </div>
                            
                            {/* ส่วนของการประเมิน */}
                            {renderCriteriaInputs()}
                            
                            {/* ส่วนของความคิดเห็น */}
                            <div className="form-group mb-4">
                                <label htmlFor="comments" className="form-label">
                                    <i className="fas fa-comment-dots me-2 text-primary"></i>
                                    ความคิดเห็นเพิ่มเติม
                                </label>
                                <textarea
                                    className="form-control"
                                    id="comments"
                                    name="comments"
                                    value={formData.comments}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="กรุณาระบุความคิดเห็นหรือข้อเสนอแนะ..."
                                ></textarea>
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการประเมิน'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
        

const EvaluationResultsModal = ({ open, handleClose, evaluationData }) => {
    if (!evaluationData) return null;
    
    const calculateAverageScore = () => {
      if (!evaluationData.details || evaluationData.details.length === 0) return 0;
      const sum = evaluationData.details.reduce((acc, curr) => acc + curr.score, 0);
      return sum / evaluationData.details.length;
    };
    
    const averageScore = calculateAverageScore();
    const maxScore = evaluationData.details.length > 0 ? 
      Math.max(...evaluationData.details.map(detail => detail.max_score || 5)) : 5;
    
    // Calculate rating class based on score
    const getRatingClass = (score) => {
      const percentage = (score / maxScore) * 100;
      if (percentage >= 80) return "text-success";
      if (percentage >= 60) return "text-info";
      if (percentage >= 40) return "text-warning";
      return "text-danger";
    };
    
    return (
      <div className={`modal fade ${open ? "show d-block" : ""}`} tabIndex="-1" aria-hidden={!open}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-chart-bar me-2 text-info"></i>
                ผลการประเมิน
              </h5>
              <button type="button" className="btn-close" onClick={handleClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <div className="mb-3">คะแนนรวมเฉลี่ย</div>
                <div className={`display-3 fw-bold ${getRatingClass(averageScore)}`}>
                  {averageScore.toFixed(1)}
                  <small className="text-muted fs-6">/{maxScore}</small>
                </div>
                <div className="progress mt-3" style={{ height: "10px" }}>
                  <div 
                    className={`progress-bar ${getRatingClass(averageScore).replace('text-', 'bg-')}`} 
                    role="progressbar" 
                    style={{ width: `${(averageScore / maxScore) * 100}%` }}
                    aria-valuenow={averageScore}
                    aria-valuemin="0"
                    aria-valuemax={maxScore}>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="card-title mb-0">
                    <i className="fas fa-list-ul me-2"></i>
                    คะแนนแยกตามเกณฑ์
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    {evaluationData.details.map(detail => {
                      const detailPercentage = (detail.score / (detail.max_score || 5)) * 100;
                      let scoreClass = "";
                      if (detailPercentage >= 80) scoreClass = "text-success";
                      else if (detailPercentage >= 60) scoreClass = "text-info";
                      else if (detailPercentage >= 40) scoreClass = "text-warning";
                      else scoreClass = "text-danger";
                      
                      return (
                        <div className="col-12 mb-3" key={detail.criteria_id}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <p className="mb-0">
                              {detail.criteria_name || `เกณฑ์ที่ ${detail.criteria_id}`}
                            </p>
                            <span className={`badge ${scoreClass.replace('text-', 'bg-')} rounded-pill`}>
                              {detail.score}/{detail.max_score || 5}
                            </span>
                          </div>
                          <div className="progress" style={{ height: "8px" }}>
                            <div 
                              className={`progress-bar ${scoreClass.replace('text-', 'bg-')}`} 
                              role="progressbar" 
                              style={{ width: `${detailPercentage}%` }}
                              aria-valuenow={detail.score}
                              aria-valuemin="0"
                              aria-valuemax={detail.max_score || 5}>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {evaluationData.comments && (
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">
                      <i className="fas fa-comment-dots me-2 text-primary"></i>
                      ความคิดเห็นเพิ่มเติม
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="card-text">{evaluationData.comments}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary px-4" onClick={handleClose}>
                <i className="fas fa-check me-1"></i>
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export { EvaluationModal, EvaluationResultsModal };