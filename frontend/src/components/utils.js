export const API_BASE = "http://localhost:5000/api";
export const LABEL_OPTIONS = ["High", "Bug", "Feature", "Enhancement", "Demo"];

export const isOverdue = (d) => {
  if (!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(d); due.setHours(0,0,0,0);
  return due < today;
};
