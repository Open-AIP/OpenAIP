import AipDetailsHeader from '@/features/citizen/aips/components/AipDetailsHeader';
import AipDetailsTabs from '@/features/citizen/aips/components/AipDetailsTabs';
import { getCitizenAipDetails, getCitizenAipFilters } from '@/features/citizen/aips/data/aips.data';
import { getCitizenFeedbackSession, listCitizenFeedbackItems } from '@/lib/repos/feedback/citizen';

const CitizenAipDetailsPage = async ({ params }: { params: Promise<{ aipId: string }> }) => {
  const { aipId } = await params;
  const filters = await getCitizenAipFilters();
  const aipDetails = await getCitizenAipDetails(aipId || filters.defaultAipId);
  const feedbackItems = await listCitizenFeedbackItems(aipDetails.id);
  const feedbackSession = await getCitizenFeedbackSession();

  return (
    <section className="space-y-6">
      <AipDetailsHeader aip={aipDetails} />
      <AipDetailsTabs
        aip={aipDetails}
        feedbackItems={feedbackItems}
        isAuthenticated={feedbackSession.isAuthenticated}
        currentUser={feedbackSession.isAuthenticated ? feedbackSession.currentUser : null}
      />
    </section>
  );
};

export default CitizenAipDetailsPage;
