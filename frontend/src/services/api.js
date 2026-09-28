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

export async function startRolePractice(candidateId, role, difficulty = 'medium', competency = null) {
  const res = await fetch(`${BASE_URL}/api/interviews/role-practice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId, role, difficulty, competency }),
  });
  if (!res.ok) throw new Error('Failed to start role practice');
  return res.json();
}

export async function startResumeJDInterview(candidateId, targetRole, difficulty, jobDescription, resumeFile, resumeText) {
  const formData = new FormData();
  formData.append('candidate_id', candidateId);
  formData.append('target_role', targetRole || 'SDE');
  formData.append('difficulty', difficulty || 'medium');
  formData.append('job_description', jobDescription);
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

export async function startHRInterview(candidateId, difficulty = 'medium', topics = ['conflict_resolution', 'receiving_feedback']) {
  const res = await fetch(`${BASE_URL}/api/interviews/hr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId, difficulty, topics }),
  });
  if (!res.ok) throw new Error('Failed to start HR round');
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

