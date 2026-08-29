export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ vi?: string; en?: string }>;
}) {
  const { vi, en } = await searchParams;
  const messageVi = vi?.trim() || "Bảng giá hoặc hạ tầng đang được cập nhật. Vui lòng quay lại sau vài phút.";
  const messageEn = en?.trim() || "The site is under maintenance. Please try again shortly.";

  return (
    <main>
      <div>
        <p>Think & Rich</p>
        <h1>Hệ thống đang bảo trì</h1>
        <p>{messageVi}</p>
        <p>{messageEn}</p>
      </div>
    </main>
  );
}
