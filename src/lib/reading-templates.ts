// Catalogue behind the layout picker in the editor's preview. The visual
// values live in globals.css as token overrides on
// [data-reading-template="…"]; this file only names them and says what each
// one is for, so the picker has something to label the choices with.
//
// Keep `id` in step with the selectors in globals.css.

export const READING_TEMPLATES = [
  {
    id: "academic",
    name: "Học thuật",
    description: "Mặc định. Chữ serif, dấu chương treo ngoài lề, khổ 64 ký tự.",
  },
  {
    id: "classic",
    name: "Sách kinh điển",
    description: "Khổ hẹp, chữ cái đầu chương phóng lớn như sách in.",
  },
  {
    id: "novel",
    name: "Tiểu thuyết",
    description: "Các đoạn nối liền nhau, phân cách bằng thụt đầu dòng thay vì khoảng trắng.",
  },
  {
    id: "magazine",
    name: "Tạp chí",
    description: "Tiêu đề chữ sans đậm trên thân bài serif, khổ rộng hơn.",
  },
  {
    id: "minimal",
    name: "Tối giản",
    description: "Một kiểu chữ duy nhất, không dấu chương, nhiều khoảng thở.",
  },
  {
    id: "compact",
    name: "Cô đọng",
    description: "Nhiều chữ trong một màn hình, hợp bài tra cứu.",
  },
  {
    id: "large",
    name: "Dễ đọc",
    description: "Cỡ chữ lớn, giãn dòng rộng, cho người đọc xa hoặc mắt kém.",
  },
  {
    id: "manuscript",
    name: "Bản thảo",
    description: "Tiêu đề chữ mono, hợp bài mổ xẻ kỹ thuật.",
  },
] as const;

export type ReadingTemplateId = (typeof READING_TEMPLATES)[number]["id"];

export const DEFAULT_READING_TEMPLATE: ReadingTemplateId = "academic";

const VALID_IDS = new Set<string>(READING_TEMPLATES.map((t) => t.id));

/** Falls back to the default rather than trusting a stored or supplied value. */
export function normalizeTemplate(value: unknown): ReadingTemplateId {
  return typeof value === "string" && VALID_IDS.has(value)
    ? (value as ReadingTemplateId)
    : DEFAULT_READING_TEMPLATE;
}
