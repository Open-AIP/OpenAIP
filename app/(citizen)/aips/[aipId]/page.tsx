const AIP = async ({ params }: { params: Promise<{ aipId: string }> }) => {
  const { aipId } = await params;
 
  return (
    <div>AIP {aipId}</div>
  )
}

export default AIP
