import { NotebookWorkstation } from "@/app/notebook/notebook-workstation";
import { NOTEBOOK_SAMPLE_PAGES } from "@/app/notebook/notebook-sample-pages";

export default function NotebookPage() {
  return <NotebookWorkstation initialPages={NOTEBOOK_SAMPLE_PAGES} />;
}
