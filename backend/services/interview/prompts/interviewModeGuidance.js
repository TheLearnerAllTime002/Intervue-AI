const interviewModeGuidance = ({ difficultyMode = "intermediate", companyName = "" }) => {
  if (difficultyMode === "company-specific") {
    return `Interview mode: company-specific for ${companyName}. Use the target role and the company's widely known products, domain, and public hiring themes where relevant. Do not claim to know private interview questions or internal evaluation criteria. If company-specific details are uncertain, use realistic role and industry questions instead.`;
  }

  const guidance = {
    beginner: "Interview mode: beginner. Start with fundamentals, use clear wording, avoid trick questions, and build complexity gradually. Assume the candidate is early-career.",
    intermediate: "Interview mode: intermediate. Use realistic role-level questions that balance fundamentals, practical application, and trade-offs.",
    advanced: "Interview mode: advanced. Probe depth, trade-offs, edge cases, architecture, and ambiguous real-world scenarios while staying relevant to the candidate's role.",
  };
  return guidance[difficultyMode] || guidance.intermediate;
};

export default interviewModeGuidance;
