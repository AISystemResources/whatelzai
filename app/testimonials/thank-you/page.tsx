import { redirect } from "next/navigation";

export default function RedirectLegacyThankYou() {
  redirect("/feedback/thank-you");
}
