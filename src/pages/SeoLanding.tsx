import { useLocation } from "react-router-dom";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getSeoLandingBySlug } from "@/lib/seoLandingConfigs";
import NotFound from "@/pages/NotFound";

interface Props {
  slug?: string;
}

const SeoLanding = ({ slug }: Props) => {
  const location = useLocation();
  const resolved = slug ?? location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const config = getSeoLandingBySlug(resolved);
  if (!config) return <NotFound />;
  return <SeoLandingPage config={config} />;
};

export default SeoLanding;
