import "./EvaluationModal.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import { url, getLocalData } from "../../../../helper/help";
import Rating from "@mui/material/Rating";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Staff Evaluation Modal Component
const EvaluationModal = ({
  open,
  handleClose,
  request,
  onSubmitEvaluation,
  currentUser
}) => {
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
    request_id: "",
    details: [],
  });

  const fetchEvaluationCriteria = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(
        `${url}/api/Evaluation/OnGetEvaluationCriteria`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `ไม่สามารถดึงข้อมูลเกณฑ์การประเมินได้: ${response.status}`
        );
      }

      const criteria = await response.json();
      return criteria;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลเกณฑ์การประเมิน:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!open) return;
      const loadCriteria = async () => {
      const criteria = await fetchEvaluationCriteria();
      setEvaluationCriteria(criteria);
    };
    loadCriteria();
  }, [fetchEvaluationCriteria, open]);

  useEffect(() => {
    if (open && request) {
      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const period = `${year}-${month}`;

      setFormData({
        employee_id: request?.staff_id || "",
        evaluator_id: currentUser,
        evaluation_date: formattedDate,
        evaluation_period: period,
        status: "draft",
        comments: "",
        active: "1",
        request_id: request?.request_id || "",
        details: [],
      });
    }
  }, [open, request]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "comments" ? value : Number(value),
    }));
  }, []);
const validateFormData = (data) => {
    if (!data.employee_id) {
      alert("โปรดเลือกพนักงานที่ต้องการประเมิน");
      return false;
    }
    if (!data.evaluator_id) {
      alert("ไม่พบข้อมูลผู้ประเมิน กรุณาเข้าสู่ระบบใหม่");
      return false;
    }
    if (!data.request_id) {
      alert("ไม่พบรหัสคำขอ (request_id)");
      return false;
    }
    if (!data.details.length) {
      alert("กรุณาให้คะแนนอย่างน้อย 1 เกณฑ์");
      return false;
    }
    for (const detail of data.details) {
      if (
        !detail.criteria_id ||
        detail.score === undefined ||
        detail.score < 1
      ) {
        alert(
          `คะแนนของเกณฑ์ "${detail.criteria_name || "ไม่ทราบชื่อ"}" ไม่ถูกต้อง`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  try {
    const completeDetails = formData.details.map((detail) => {
      const criterion = evaluationCriteria.find(
        (c) => c.criteria_id === detail.criteria_id
        );
        return {
          criteria_id: detail.criteria_id,
          criteria_name: criterion?.criteria_name || "ไม่ทราบชื่อ",
          score: detail.score,
          comments: detail.comments || "",
        };
      });
    const completeFormData = {
        ...formData,
        request_id: parseInt(formData.request_id) || null,
        details: completeDetails,
      };
  
      if (!validateFormData(completeFormData)) {
        setIsSubmitting(false);
        return;
      }
    console.log("🟢 ส่งข้อมูลการประเมิน:", completeFormData);
      const response = await fetch(`${url}/api/Evaluation/OnCreateEvaluation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getLocalData("token")}`,
        },
        body: JSON.stringify(completeFormData),
      });
  
      if (!response.ok) {
        const responseText = await response.text();
        
        let errorMessage = "เกิดข้อผิดพลาดในการส่งแบบประเมิน";

        try {
          const resultObj = JSON.parse(responseText);
          errorMessage = resultObj.message || resultObj.title || errorMessage;
        } catch (jsonError) {
          errorMessage = responseText || errorMessage; }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      await onSubmitEvaluation(request.request_id, completeFormData);
      handleClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCriterionChange = useCallback(
    (criteriaId, value) => {
      setFormData((prevData) => {
      const criterion = evaluationCriteria.find(
          (c) => c.criteria_id === criteriaId
        );
        if (!criterion) return prevData;
      const newDetails = [...prevData.details];
      const existingIndex = newDetails.findIndex(
          (d) => d.criteria_id === criteriaId
        );

        if (existingIndex >= 0) {
          newDetails[existingIndex] = {
            ...newDetails[existingIndex],
            criteria_id: criteriaId,
            criteria_name: criterion.criteria_name,
            score: Number(value),
          };
        } else {
          newDetails.push({
            criteria_id: criteriaId,
            criteria_name: criterion.criteria_name,
            score: Number(value),
            comments: "",
          });
        }

        return {
          ...prevData,
          details: newDetails,
        };
      });
    },
    [evaluationCriteria]
  );
  // ผลการประเมิน
  const getScoreText = useMemo(
    () => (score) => {
      if (score === 5) return "ดีเยี่ยม";
      else if (score === 4) return "ดีมาก";
      else if (score === 3) return "ดี";
      else if (score === 2) return "พอใช้";
      else if (score === 1) return "ต้องปรับปรุง";
      else return "ยังไม่ได้ประเมิน";
    },
    []
  );

  const getScoreClass = useMemo(
    () => (score) => {
      if (score === 5) return "score-excellent";
      else if (score === 4) return "score-good";
      else if (score === 3) return "score-good";
      else if (score === 2) return "score-average";
      else if (score === 1) return "score-poor";
      else return "";
    },
    []
  );

  const renderCriteriaInputs = () => {
    return (
      <div className="criteria-card">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center space-x-3 border-b pb-3 mb-4">
            <i className="fas fa-star text-yellow-500 text-xl"></i>
            <h3 className="text-xl font-semibold text-gray-900">
               🌟 ให้คะแนนตามเกณฑ์การประเมิน 
            </h3>
          </div>
        </div>

        <div className="criteria-card-body">
          {evaluationCriteria.map((criterion) => {
            // คะแนนเต็ม 5 ดาว
            const currentScore =
              formData.details.find(
                (d) => d.criteria_id === criterion.criteria_id
              )?.score || 0;

            const scoreText = getScoreText(currentScore);
            const scoreClass = getScoreClass(currentScore);

            return (
              <div className="rating-container" key={criterion.criteria_id}>
                <div className="rating-header">
                  <p className="rating-title">{criterion.criteria_name}</p>
                  <div
                    className={`rating-score ${currentScore ? scoreClass : ""}`}
                  >
                    {currentScore ? `${currentScore}/5` : "ยังไม่ได้ประเมิน"}
                  </div>
                </div>

                <div className="mui-rating-container">
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Rating
                      name={`rating-${criterion.criteria_id}`}
                      value={currentScore}
                      onChange={(event, newValue) => {
                        if (newValue === currentScore) return;
                        requestAnimationFrame(() => {
                          handleCriterionChange(
                            criterion.criteria_id,
                            newValue
                          );
                        });
                      }}
                      size="large"
                      precision={1}
                      sx={{
                        fontSize: "2.5rem",
                        "& .MuiRating-iconFilled": {
                          color: "#ffc107",
                        },
                        "& .MuiRating-iconHover": {
                          color: "#ffac33",
                        },
                        "& .MuiRating-icon": {
                          willChange: "transform, color",
                          transition:
                            "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        },
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ต่ำ
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        สูง
                      </Typography>
                    </Box>
                  </Box>

                  {currentScore > 0 && (
                    <span
                      className={`rating-text ${scoreClass}`}
                      style={{ opacity: 1, transform: "translateY(0)" }}
                    >
                      {scoreText}
                    </span>
                  )}
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
    <div
      className={`modal fade ${open ? "show d-block" : "d-none"}`}
      tabIndex="-1"
      aria-hidden={!open}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-star-half-alt me-2 text-warning"></i>
              ประเมินผลการปฏิบัติงาน
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* แสดงข้อมูลพนักงานและรหัสคำขอ */}
              <div className="d-flex align-items-center mb-4">
                <div className="avatar-circle me-3 bg-light">
                  <i className="fas fa-user-tie text-primary"></i>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    Staff : {request.staff_name || "ไม่ระบุ"}
                  </h4>
                  <small className="text-gray-500"> 
                    รหัสคำขอ: #{request.request_id}
                    {request.request_type && ` • ประเภท: ${request.request_type}`}
                  </small>
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

            {/* แสดงรหัสคำขอที่กำลังประเมินแบบ hidden field */}
            <input 
                type="hidden" 
                name="request_id" 
                value={formData.request_id} 
              />
            <div className="modal-footer">
              <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                >
                  ยกเลิก
              </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการประเมิน"}
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
    if (evaluationData.total_score && (!evaluationData.details || evaluationData.details.length === 0)) {
      return evaluationData.total_score / 20; 
    }

    if (!evaluationData.details || evaluationData.details.length === 0)
      return 0;
    const sum = evaluationData.details.reduce(
      (acc, curr) => acc + (parseFloat(curr.score) || 0),
      0
    );
    return sum / evaluationData.details.length;
  };

  const averageScore = calculateAverageScore();
  const maxScore = 5;

  const getRatingClass = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-info";
    if (percentage >= 40) return "text-warning";
    return "text-danger";
  };

  const getScoreText = (score) => {
    if (score >= 4.5) return "ดีเยี่ยม";
    else if (score >= 3.5) return "ดีมาก";
    else if (score >= 2.5) return "ดี";
    else if (score >= 1.5) return "พอใช้";
    else return "ต้องปรับปรุง";
  };

  return (
    <div
      className={`modal fade ${open ? "show d-block" : "d-none"}`}
      tabIndex="-1"
      aria-hidden={!open}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-chart-bar me-2 text-info"></i>
              ผลการประเมิน
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* แสดงข้อมูลคำขอและพนักงาน */}
            <div className="alert alert-info mb-4">
              <div className="d-flex align-items-center">
                <i className="fas fa-info-circle me-2"></i>
                <div>
                  <strong>ข้อมูลคำขอ :</strong> #{evaluationData.request_id || evaluationData.requestId}
                  {evaluationData.request_type &&  ` • ${evaluationData.request_type}`}
                </div>
              </div>
              {evaluationData.employee_name && (
                <div className="d-flex align-items-center mt-2">
                  <i className="fas fa-user me-2"></i>
                  <div>
                    <strong>พนักงาน :</strong> {evaluationData.employee_name}
                    {evaluationData.employee_id && ` (${evaluationData.employee_id})`}
                  </div>
                </div>
              )}
              <div className="d-flex align-items-center mt-2">
                <i className="fas fa-calendar-alt me-2"></i>
                <div>
                  <strong>วันที่ประเมิน :</strong> {evaluationData.evaluation_date || 'ไม่ระบุ'}
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="mb-2">คะแนนรวมเฉลี่ย</div>
              <div
                className={`display-3 fw-bold ${getRatingClass(averageScore)}`}
              >
                {averageScore.toFixed(1)}
                <small className="text-muted fs-6">/{maxScore}</small>
              </div>
              <div className="average-star-display">
                <Rating
                  value={averageScore}
                  readOnly
                  precision={0.5}
                  size="large"
                  sx={{
                    fontSize: "3rem",
                    "& .MuiRating-iconFilled": {
                      color: "#ffd207",
                    },
                  }}
                />
              </div>
              <div
                className={`rating-badge ${getRatingClass(averageScore).replace(
                  "text-",
                  "bg-"
                )}`}
              >
                {getScoreText(averageScore)}
              </div>
            </div>

            {/* แสดงข้อมูลรายละเอียดการประเมิน ถ้ามี */}
            {evaluationData.details && evaluationData.details.length > 0 ? (
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="card-title mb-0">
                    <i className="fas fa-list-ul me-2"></i>
                    คะแนนแยกตามเกณฑ์
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    {evaluationData.details.map((detail) => {
                      const detailScore = parseFloat(detail.score) || 0;
                      let scoreClass = "";
                      if (detailScore >= 4.5) scoreClass = "text-success";
                      else if (detailScore >= 3.5) scoreClass = "text-info";
                      else if (detailScore >= 2.5) scoreClass = "text-info";
                      else if (detailScore >= 1.5) scoreClass = "text-warning";
                      else scoreClass = "text-danger";

                      return (
                        <div className="col-12 mb-3" key={detail.criteria_id}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <p className="mb-0">
                              {detail.criteria_name ||
                                `เกณฑ์ที่ ${detail.criteria_id}`}
                            </p>
                            <span
                              className={`badge ${scoreClass.replace(
                                "text-",
                                "bg-"
                              )} rounded-pill`}
                            >
                              {detailScore}/5
                            </span>
                          </div>
                          <div className="star-result-container">
                            <Rating
                              value={detailScore}
                              readOnly
                              size="medium"
                              sx={{
                                "& .MuiRating-iconFilled": {
                                  color: "#ffc107",
                                },
                              }}
                            />
                            <span className={`rating-text small ${scoreClass}`}>
                              {getScoreText(detailScore)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning mb-4">
                <div className="d-flex align-items-center">
                  <i className="fas fa-info-circle me-2"></i>
                  <div>
                    {/* <strong>ข้อมูลรายละเอียดการประเมิน:</strong> ไม่พบรายละเอียดเกณฑ์การประเมิน แสดงข้อมูลคะแนนรวมเท่านั้น */}
                  </div>
                </div>
              </div>
            )}

            {/* แสดงความคิดเห็นเพิ่มเติม ถ้ามี */}
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
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleClose}
            >
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