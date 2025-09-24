
export default function AssignmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      {children}
    </div>
  );
}
