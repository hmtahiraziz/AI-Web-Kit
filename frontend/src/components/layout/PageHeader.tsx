export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold text-ink-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-[14px] text-ink-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
