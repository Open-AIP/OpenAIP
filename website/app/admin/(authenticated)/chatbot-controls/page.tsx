import { redirect } from "next/navigation";

export default function ChatbotControlsPage() {
  redirect("/admin/usage-controls?tab=chatbot");
}

