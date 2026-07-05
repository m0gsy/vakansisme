import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import DestinationPage, { getDestinationData } from "@/components/DestinationPage";
import { buildEntityMetadata } from "@/lib/seo";
import { destBasePath } from "@/lib/related";

type Params = Promise<{ slug: string }>;

const BASE_PATH = "/destination";

// Known kinds (mountain/trail/national_park) have dedicated routes for canonical URLs;
// redirect away from here if this slug turns out to belong to one of them.
function redirectIfDedicated(kind: string, slug: string) {
  const dedicated = destBasePath(kind);
  if (dedicated !== BASE_PATH) permanentRedirect(`${dedicated}/${slug}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { dest, hasContent } = await getDestinationData(null, slug, BASE_PATH);
  redirectIfDedicated(dest.kind, dest.slug);
  return buildEntityMetadata({
    title: `${dest.name} — VAKANSISME`,
    description: dest.description ?? `Explore ${dest.name} with Vakansisme.`,
    path: `${BASE_PATH}/${dest.slug}`,
    image: dest.image_url,
    noindex: !hasContent,
  });
}

export default async function GenericDestinationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { dest } = await getDestinationData(null, slug, BASE_PATH);
  redirectIfDedicated(dest.kind, dest.slug);
  return <DestinationPage kind={null} basePath={BASE_PATH} param={slug} />;
}
