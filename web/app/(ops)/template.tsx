import { PageTransition } from "@/components/PageTransition";

export default function OpsTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
