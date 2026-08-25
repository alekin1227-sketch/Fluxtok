export function Notice({ type = "success", children }: { type?: "success" | "error" | "info"; children: React.ReactNode }) {
  return <div className={`notice notice-${type}`}>{children}</div>;
}
