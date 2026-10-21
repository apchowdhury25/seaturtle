import { ContentView } from "@/components/content-view";

export const metadata = { title: "Size Guide" };

const rows = [
  ["XS", "86", "66"],
  ["S", "91", "71"],
  ["M", "97", "76"],
  ["L", "104", "84"],
  ["XL", "112", "92"],
];

export default function SizeGuidePage() {
  return (
    <>
      <ContentView slug="size-guide" />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <table className="w-full text-left text-sm">
          <caption className="mb-3 text-left text-muted">Illustrative body measurements in centimeters. Not a certified size standard.</caption>
          <thead><tr className="border-b border-line"><th className="py-2">Label</th><th>Chest</th><th>Waist</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row[0]} className="border-b border-line"><td className="py-2">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
