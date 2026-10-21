import { ContactForm } from "@/components/account-forms";
import { ContentView } from "@/components/content-view";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <ContentView slug="contact" />
      <div className="mx-auto max-w-3xl px-4 pb-16"><ContactForm /></div>
    </>
  );
}
