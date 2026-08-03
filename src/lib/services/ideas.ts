import { SEED_IDEAS } from "@/lib/data";
import { delay } from "@/lib/access";
import type { Idea, IdeaStatus } from "@/lib/types";

let ideasDb: Idea[] = structuredClone(SEED_IDEAS);

export type IdeaListParams = {
  category?: string;
  sort?: "newest" | "trending" | "views";
  page?: number;
  pageSize?: number;
  q?: string;
  status?: IdeaStatus | "ALL";
};

export async function listIdeas(params: IdeaListParams = {}) {
  await delay();
  const {
    category = "Tất cả",
    sort = "newest",
    page = 1,
    pageSize = 9,
    q = "",
    status = "PUBLISHED",
  } = params;

  let list = ideasDb.filter((i) =>
    status === "ALL" ? true : i.status === status
  );

  if (category && category !== "Tất cả") {
    list = list.filter((i) => i.category === category);
  }
  if (q.trim()) {
    const needle = q.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.shortDescription.toLowerCase().includes(needle)
    );
  }

  if (sort === "trending") {
    list = [...list].sort(
      (a, b) => Number(b.isTrending) - Number(a.isTrending) || b.views - a.views
    );
  } else if (sort === "views") {
    list = [...list].sort((a, b) => b.views - a.views);
  } else {
    list = [...list].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { items, total, page: safePage, totalPages, pageSize };
}

export async function getIdea(id: string) {
  await delay(120);
  return ideasDb.find((i) => i.id === id) ?? null;
}

export async function upsertIdea(
  input: Partial<Idea> & { title: string; shortDescription: string }
) {
  await delay();
  if (input.id) {
    ideasDb = ideasDb.map((i) =>
      i.id === input.id ? { ...i, ...input, updatedAt: new Date().toISOString() } as Idea : i
    );
    return ideasDb.find((i) => i.id === input.id)!;
  }
  const idea: Idea = {
    id: String(Date.now()),
    title: input.title,
    shortDescription: input.shortDescription,
    fullContent: input.fullContent ?? "<p></p>",
    thumbnailUrl:
      input.thumbnailUrl ??
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    category: input.category ?? "SaaS",
    status: input.status ?? "DRAFT",
    isPremiumOnly: input.isPremiumOnly ?? false,
    requiresPremium: input.requiresPremium ?? true,
    views: 0,
    location: input.location ?? "Việt Nam",
    createdAt: new Date().toISOString().slice(0, 10),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoImage: input.seoImage,
  };
  ideasDb = [idea, ...ideasDb];
  return idea;
}

export async function importIdeasCsv(
  rows: Array<Record<string, string>>
): Promise<{ imported: number; errors: string[] }> {
  await delay(400);
  const errors: string[] = [];
  let imported = 0;
  for (const [idx, row] of rows.entries()) {
    const title = row.title || row.Title || row["Tên ý tưởng"];
    const shortDescription =
      row.shortDescription || row.description || row["Mô tả"];
    if (!title || !shortDescription) {
      errors.push(`Dòng ${idx + 1}: thiếu title hoặc description`);
      continue;
    }
    await upsertIdea({
      title,
      shortDescription,
      category: row.category || row["Phân loại"] || "SaaS",
      fullContent: row.fullContent || `<p>${shortDescription}</p>`,
      status: "DRAFT",
      requiresPremium: row.requiresPremium !== "false",
      isPremiumOnly: row.isPremiumOnly === "true",
    });
    imported++;
  }
  return { imported, errors };
}

export function resetIdeasDb() {
  ideasDb = structuredClone(SEED_IDEAS);
}
