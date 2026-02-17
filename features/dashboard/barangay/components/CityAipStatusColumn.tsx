import type {
  CityAipByYearVM,
  CityAipCoverageVM,
  PublicationTimelinePointVM,
  RecentActivityItemVM,
} from "../types";
import CityAipCoverageCard from "./CityAipCoverageCard";
import PublicationTimelineCard from "./PublicationTimelineCard";
import CityAipsByYearTable from "./CityAipsByYearTable";
import RecentActivityFeed from "./RecentActivityFeed";

type CityAipStatusColumnProps = {
  cityAipCoverage: CityAipCoverageVM;
  publicationTimeline: PublicationTimelinePointVM[];
  cityAipsByYear: CityAipByYearVM[];
  recentActivity: RecentActivityItemVM[];
  onUploadCityAip?: () => void;
  onViewAudit?: () => void;
};

export default function CityAipStatusColumn({
  cityAipCoverage,
  publicationTimeline,
  cityAipsByYear,
  recentActivity,
  onUploadCityAip,
  onViewAudit,
}: CityAipStatusColumnProps) {
  return (
    <div className="space-y-6">
      <CityAipCoverageCard cityAipCoverage={cityAipCoverage} onUploadCityAip={onUploadCityAip} />
      <PublicationTimelineCard publicationTimeline={publicationTimeline} />
      <CityAipsByYearTable cityAipsByYear={cityAipsByYear} />
      <RecentActivityFeed recentActivity={recentActivity} onViewAudit={onViewAudit} />
    </div>
  );
}
