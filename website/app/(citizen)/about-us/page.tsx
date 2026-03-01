import CitizenAboutUsView from "@/features/citizen/about-us/views/citizen-about-us-view";
import { getCitizenAboutUsContentVM } from "@/lib/content/citizen-about-us";

export const dynamic = "force-dynamic";

export default async function AboutUsPage() {
  const vm = await getCitizenAboutUsContentVM();

  return (
    <CitizenAboutUsView
      referenceDocs={vm.referenceDocs}
      quickLinksById={vm.quickLinksById}
    />
  );
}
