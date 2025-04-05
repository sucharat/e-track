// components/Evaluation/EvaluationService.js
import { url, getLocalData } from "../../../../helper/help";
export const submitEvaluation = async (requestId, evaluationData) => {
  try {
    const token = getLocalData("token");
    // Add requestId to the evaluation data if needed
    const payload = {
      ...evaluationData,
      request_id: requestId
    };
    const response = await fetch(`${url}/api/Evaluation/OnCreateEvaluation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    // First check for non-200 responses
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.title || errorData;
        console.log("API Error:", errorMessage);
      } catch {
        // If we can't parse JSON, use the status text
        errorMessage = `Server returned ${response.status}: ${response.statusText || 'Unknown error'}`;
        console.log("API Error:", errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    // Parse the successful response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};