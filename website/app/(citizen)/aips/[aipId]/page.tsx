import AipDetailsHeader from '@/features/citizen/aips/components/AipDetailsHeader';
import AipDetailsTabs from '@/features/citizen/aips/components/AipDetailsTabs';
import { DEFAULT_AIP_ID, getCitizenAipDetails } from '@/features/citizen/aips/data/aips.data';

const CitizenAipDetailsPage = async ({ params }: { params: Promise<{ aipId: string }> }) => {
  const { aipId } = await params;
  const aipDetails = getCitizenAipDetails(aipId || DEFAULT_AIP_ID);

  return (
    <section className="space-y-6">
      <AipDetailsHeader aip={aipDetails} />
      <AipDetailsTabs aip={aipDetails} />
    </section>
  );
};

export default CitizenAipDetailsPage;
