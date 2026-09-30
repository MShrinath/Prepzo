const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function fetchRoles() {
  const res = await fetch(`${BASE_URL}/api/interview-modes/role-practice/roles`);
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
}

export async function fetchCandidateProfile(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateCandidateProfile(candidateId, data) {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function loginCandidate(loginData) {
  const res = await fetch(`${BASE_URL}/api/candidates/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData),
  });
  if (!res.ok) throw new Error('Failed to log in');
  return res.json();
}

export async function uploadCandidateResume(candidateId, file, resumeText, jobDescription, targetRole) {
  const formData = new FormData();
  if (file) {
    formData.append('resume_file', file);
  }
  if (resumeText) {
    formData.append('resume_text', resumeText);
  }
  if (jobDescription) {
    formData.append('job_description', jobDescription);
  }
  if (targetRole) {
    formData.append('target_role', targetRole);
  }
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/resume`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to upload and parse resume');
  }
  return res.json();
}

export async function analyzeResumeAndJD(candidateId, file, resumeText, jobDescription, targetRole) {
  return uploadCandidateResume(candidateId, file, resumeText, jobDescription, targetRole);
}

export async function fetchCandidateCapabilities(candidateId) {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/capabilities`);
  if (!res.ok) throw new Error('Failed to fetch capabilities');
  return res.json();
}

export async function startRolePractice(candidateId, role, competency = null) {
  const res = await fetch(`${BASE_URL}/api/interviews/role-practice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId, role, competency }),
  });
  if (!res.ok) throw new Error('Failed to start role practice');
  return res.json();
}

export async function startResumeJDInterview(candidateId, targetRole, jobDescription, resumeFile, resumeText, isConversational = false) {
  const formData = new FormData();
  formData.append('candidate_id', candidateId);
  formData.append('target_role', targetRole || 'SDE');
  formData.append('job_description', jobDescription);
  if (isConversational) {
    formData.append('is_conversational', 'true');
  }
  if (resumeFile) {
    formData.append('resume_file', resumeFile);
  }
  if (resumeText) {
    formData.append('resume_text', resumeText);
  }

  const res = await fetch(`${BASE_URL}/api/interviews/resume-jd`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to start resume-jd interview');
  return res.json();
}

export async function startHRInterview(candidateId, topics = ['conflict_resolution', 'receiving_feedback']) {
  const res = await fetch(`${BASE_URL}/api/interviews/hr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId, topics }),
  });
  if (!res.ok) throw new Error('Failed to start HR round');
  return res.json();
}

export async function startCompanyArchetype(candidateId, company = 'amazon', subTopic = null, difficulty = 'medium', isConversational = false, questionCount = 5) {
  const res = await fetch(`${BASE_URL}/api/interviews/company-archetype`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidateId,
      company,
      sub_topic: subTopic,
      topics: subTopic ? [company, subTopic] : [company],
      difficulty,
      is_conversational: isConversational,
      question_count: questionCount,
    }),
  });
  if (!res.ok) throw new Error('Failed to start Company Archetype interview');
  return res.json();
}

export async function submitTextResponse(sessionId, responseText, questionText, questionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response: responseText,
      question_text: questionText,
      question_id: questionId,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit response');
  return res.json();
}

export async function submitVoiceResponse(sessionId, audioBlob, questionText, questionId) {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.wav');
  formData.append('question_text', questionText || 'General Question');
  if (questionId) formData.append('question_id', questionId);

  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/response/voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to submit voice response');
  return res.json();
}

export async function submitFollowUpAnswer(sessionId, responseText, followUpQuestion) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response: responseText,
      follow_up_question: followUpQuestion,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit follow-up');
  return res.json();
}

export async function fetchCandidateProgress(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/progress`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

export async function fetchRecurringGaps(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/recurring-gaps`);
  if (!res.ok) throw new Error('Failed to fetch recurring gaps');
  return res.json();
}

export async function fetchImprovementPlan(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/improvement-plan`);
  if (!res.ok) throw new Error('Failed to fetch improvement plan');
  return res.json();
}

export async function regenerateImprovementPlan(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/regenerate-plan`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to regenerate improvement plan');
  return res.json();
}

export async function fetchNextQuestion(sessionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/question`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to fetch next question');
  return res.json();
}

export async function fetchSessionFeedback(sessionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/feedback`);
  if (!res.ok) throw new Error('Failed to fetch session feedback');
  return res.json();
}

export async function clearCandidateSessions(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/sessions`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear candidate sessions');
  return res.json();
}

// ===== Conversational Interview APIs =====

export async function startConversationalInterview(candidateId, mode = 'role_practice', targetRole = 'SDE', competency = null) {
  const params = new URLSearchParams({
    candidate_id: candidateId,
    mode,
    target_role: targetRole,
  });
  if (competency) params.append('competency', competency);

  const res = await fetch(`${BASE_URL}/api/interviews/conversational?${params.toString()}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start conversational interview');
  return res.json();
}

export async function fetchNextConversationalQuestion(sessionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/next`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to fetch next question');
  return res.json();
}

export async function fetchSessionSummary(sessionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/summary`);
  if (!res.ok) throw new Error('Failed to fetch session summary');
  return res.json();
}

// ===== Story Bank APIs =====

export async function fetchStories(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function saveStory(candidateId, storyData) {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storyData),
  });
  if (!res.ok) throw new Error('Failed to save story');
  return res.json();
}

export async function updateStory(candidateId, storyId, storyData) {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/stories/${storyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storyData),
  });
  if (!res.ok) throw new Error('Failed to update story');
  return res.json();
}

export async function deleteStory(candidateId, storyId) {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/stories/${storyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete story');
  return res.json();
}

// ===== Export & Benchmarking APIs =====

export async function exportSessionPDF(sessionId) {
  const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/export/pdf`);
  if (!res.ok) throw new Error('Failed to export PDF');
  return res.blob();
}

export async function exportDossierPDF(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/dossier/pdf`);
  if (!res.ok) throw new Error('Failed to export dossier PDF');
  return res.blob();
}

export async function fetchPercentileRanking(candidateId = 'candidate_001') {
  const res = await fetch(`${BASE_URL}/api/candidates/${candidateId}/percentile`);
  if (!res.ok) throw new Error('Failed to fetch percentile ranking');
  return res.json();
}

// ===== LLM Health & Fallback Diagnostic APIs =====

export async function fetchLLMStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/llm/status`);
    if (!res.ok) throw new Error('Failed to fetch LLM status');
    return res.json();
  } catch (err) {
    return {
      status: 'fallback',
      fallback_mode: true,
      provider: 'offline',
      is_healthy: false,
      last_error: 'Unable to reach backend API',
    };
  }
}

export async function verifyLLMConnection() {
  const res = await fetch(`${BASE_URL}/api/llm/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to verify LLM connection');
  return res.json();
}

export async function resetLLMCircuit() {
  const res = await fetch(`${BASE_URL}/api/llm/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reset LLM circuit');
  return res.json();
}

