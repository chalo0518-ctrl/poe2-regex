import { EmptyState } from "../components/PageChrome.tsx";
import { useLocale } from "../i18n.tsx";

export default function BuildsPage() {
  const { t } = useLocale();
  return <EmptyState title={t.buildsTitle} description={t.buildsBody} />;
}
