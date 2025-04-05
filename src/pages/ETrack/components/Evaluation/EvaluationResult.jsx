const EvaluationResultsModal = ({ open, handleClose, evaluationData }) => {
    if (!evaluationData) return null;
    
    const calculateAverageScore = () => {
      if (!evaluationData.details || evaluationData.details.length === 0) return 0;
      const sum = evaluationData.details.reduce((acc, curr) => acc + curr.score, 0);
      return sum / evaluationData.details.length;
    };
    
    const averageScore = calculateAverageScore();
    // เนื่องจากเปลี่ยนเป็นดาว 5 ดาว ทุกเกณฑ์จะใช้คะแนนเต็ม 5
    const maxScore = 5;
    
    const getRatingClass = (score) => {
      const percentage = (score / maxScore) * 100;
      if (percentage >= 80) return "text-success";
      if (percentage >= 60) return "text-info";
      if (percentage >= 40) return "text-warning";
      return "text-danger";
    };
  
    // แสดงดาวตามคะแนน
    const renderStars = (score) => {
      const stars = [];
      for (let i = 1; i <= maxScore; i++) {
        stars.push(
          <i 
            key={i}
            className={`fas fa-star ${i <= score ? "star-filled" : "star-empty"}`}
          ></i>
        );
      }
      return <div className="stars-display">{stars}</div>;
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
                <div className="average-star-display">
                  {renderStars(Math.round(averageScore))}
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
                      const detailScore = detail.score;
                      let scoreClass = "";
                      if (detailScore >= 4.5) scoreClass = "text-success";
                      else if (detailScore >= 3.5) scoreClass = "text-info";
                      else if (detailScore >= 2.5) scoreClass = "text-info";
                      else if (detailScore >= 1.5) scoreClass = "text-warning";
                      else scoreClass = "text-danger";
                      
                      let scoreText = "";
                      if (detailScore >= 4.5) scoreText = "ดีเยี่ยม";
                      else if (detailScore >= 3.5) scoreText = "ดีมาก";
                      else if (detailScore >= 2.5) scoreText = "ดี";
                      else if (detailScore >= 1.5) scoreText = "พอใช้";
                      else scoreText = "ต้องปรับปรุง";
  
                      return (
                        <div className="col-12 mb-3" key={detail.criteria_id}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <p className="mb-0">
                              {detail.criteria_name || `เกณฑ์ที่ ${detail.criteria_id}`}
                            </p>
                            <span className={`badge ${scoreClass.replace('text-', 'bg-')} rounded-pill`}>
                              {detail.score}/5
                            </span>
                          </div>
                          <div className="star-result-container">
                            {renderStars(detail.score)}
                            <span className={`rating-text small ${scoreClass}`}>{scoreText}</span>
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
  
  export { EvaluationResultsModal };