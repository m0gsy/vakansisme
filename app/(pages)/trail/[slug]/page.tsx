import type { Metadata } from "next";
import DestinationPage, { getDestinationData } from "@/components/DestinationPage";
import { buildEntityMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

const BASE_PATH = "/trail";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { dest, hasContent } = await getDestinationData({ kind: "trail", param: slug, basePath: BASE_PATH });
  return buildEntityMetadata({
    title: `${dest.name} — VAKANSISME`,
    description: dest.description ?? `Explore ${dest.name} with Vakansisme.`,
    path: `${BASE_PATH}/${dest.slug}`,
    image: dest.image_url,
    noindex: !hasContent,
  });
}

export default async function TrailPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <DestinationPage kind="trail" basePath={BASE_PATH} param={slug} />;
}
