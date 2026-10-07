import { AuthProvider } from "@/components/auth/AuthControls";
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
