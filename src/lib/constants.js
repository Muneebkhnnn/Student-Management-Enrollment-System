export const STATUSES = ["Active", "Inactive"];

export const PAGE_SIZES = [10, 25, 50];

// [value "field:order", label]. Sorting follows the database collation for text columns.
export const SORT_OPTIONS = [
  ["created_at:desc", "Newest added"],
  ["created_at:asc", "Oldest added"],
  ["full_name:asc", "Name A–Z"],
  ["full_name:desc", "Name Z–A"],
  ["enrollment_date:desc", "Enrolled: newest"],
  ["enrollment_date:asc", "Enrolled: oldest"],
  ["course:asc", "Course A–Z"],
  ["status:asc", "Status (Active first)"],
];
