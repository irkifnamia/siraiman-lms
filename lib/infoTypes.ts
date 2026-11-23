export type FieldType = "text" | "long" | "number" | "date" | "choice" | "yesno" | "phone" | "email";
export type Field = { id: string; label: string; type: FieldType; required: boolean; options?: string[] };

export const FIELD_TYPES: [FieldType, string][] = [
  ["text", "Short answer"], ["long", "Paragraph"], ["number", "Number"], ["date", "Date"],
  ["choice", "Multiple choice"], ["yesno", "Yes / No"], ["phone", "Phone number"], ["email", "Email"],
];
