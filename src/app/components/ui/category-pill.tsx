export type CategoryStyle = {
  text: string;
  bg: string;
};

export const expenseCategoryStyles: Record<string, CategoryStyle> = {
  Materials: { text: "#4A6FA5", bg: "#EBF0F8" },
  Fuel: { text: "#0D9488", bg: "#CCFBF1" },
  Tools: { text: "#D97706", bg: "#FEF3C7" },
  Software: { text: "#7C3AED", bg: "#EDE9FE" },
  Meals: { text: "#DC2626", bg: "#FEE2E2" },
  Travel: { text: "#0891B2", bg: "#CFFAFE" },
  Subcontractor: { text: "#A856F7", bg: "#F3E8FF" },
  "Office Supplies": { text: "#2563EB", bg: "#DBEAFE" },
  "Equipment Rental": { text: "#EA580C", bg: "#FFEDD5" },
  Other: { text: "#546478", bg: "#F3F4F6" },
};

export function getExpenseCategoryStyle(category: string): CategoryStyle {
  return expenseCategoryStyles[category] ?? expenseCategoryStyles.Other;
}

export function CategoryPill({ category, className = "" }: { category: string; className?: string }) {
  const style = getExpenseCategoryStyle(category);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[12px] leading-4 ${className}`}
      style={{ backgroundColor: style.bg, color: style.text, fontWeight: 600 }}
    >
      {category}
    </span>
  );
}
