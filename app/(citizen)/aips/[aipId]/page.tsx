import AipDetailsHeader from '@/features/citizen/aips/components/AipDetailsHeader';
import AipDetailsTabs from '@/features/citizen/aips/components/AipDetailsTabs';
import { getCitizenAipRepo } from '@/lib/repos/citizen-aips';
import { getCitizenFeedbackSession, listCitizenFeedbackItems } from '@/lib/repos/feedback/citizen';

const CitizenAipDetailsPage = async ({ params }: { params: Promise<{ aipId: string }> }) => {
  const { aipId } = await params;
  const repo = getCitizenAipRepo();
  const [defaultAipId, aipDetailsFromParam] = await Promise.all([
    repo.getDefaultAipId(),
    aipId ? repo.getAipDetails(aipId) : Promise.resolve(null),
  ]);
  const aipDetails = aipDetailsFromParam ?? (await repo.getAipDetails(defaultAipId));
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
