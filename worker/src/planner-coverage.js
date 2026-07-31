// Shared direct-recommend coverage contract. Keep this module dependency-free so
// both the template planner and named-recipe matcher consume one exact boundary.
export function minimumRecommendCoverageCount(totalSubmitted) {
  if (totalSubmitted <= 0) return 0;
  if (totalSubmitted <= 2) return totalSubmitted;
  if (totalSubmitted === 3) return 2;
  if (totalSubmitted === 4) return 3;
  if (totalSubmitted <= 6) return 4;
  return Math.ceil(totalSubmitted * 0.6);
}
