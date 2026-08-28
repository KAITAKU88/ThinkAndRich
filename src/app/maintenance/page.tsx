export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ vi?: string; en?: string }>;
}) {
  const { vi, en } = await searchParams;
  const messageVi = vi?.trim() || "Bảng giá hoặc hạ tầng đang được cập nhật. Vui lòng quay lại sau vài phút.";
  const messageEn = en?.trim() || "The site is under maintenance. Please try again shortly.";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
      <div className="max-w-md text-center space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Think & Rich</p>
        <h1 className="font-display text-3xl font-bold">Hệ thống đang bảo trì</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{messageVi}</p>
        <p className="text-sm text-muted-foreground">{messageEn}</p>
      </div>
    </main>
  );
}
