const AIPSubmittal = async ({params}:AIPIdParameter) => {
  const {aipId} = await params;
 
  return (
    <div>AIP Submittal {aipId}</div>
  )
}

export default AIPSubmittal