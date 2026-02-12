import AipDetailsHeader from '@/features/citizen/aips/components/AipDetailsHeader';
import AipDetailsTabs from '@/features/citizen/aips/components/AipDetailsTabs';
import { DEFAULT_AIP_ID, getCitizenAipDetails } from '@/features/citizen/aips/data/aips.data';
import { listCitizenFeedbackItems } from '@/lib/repos/feedback/citizen';
import { CITIZEN_FEEDBACK_AUTH, CITIZEN_FEEDBACK_USER } from '@/mocks/fixtures/feedback/citizen-feedback.fixture';

const CitizenAipDetailsPage = async ({ params }: { params: Promise<{ aipId: string }> }) => {
  const { aipId } = await params;
  const aipDetails = getCitizenAipDetails(aipId || DEFAULT_AIP_ID);
  const feedbackItems = await listCitizenFeedbackItems(aipDetails.id);

  return (
    <section className="space-y-6">
      <AipDetailsHeader aip={aipDetails} />
      <AipDetailsTabs
        aip={aipDetails}
        feedbackItems={feedbackItems}
        isAuthenticated={CITIZEN_FEEDBACK_AUTH}
        currentUser={CITIZEN_FEEDBACK_AUTH ? CITIZEN_FEEDBACK_USER : null}
      />
    </section>
  );
};

export default CitizenAipDetailsPage;
