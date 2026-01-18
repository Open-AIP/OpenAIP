const AIP = async ({params}:AIPIdParameter) => {
  const {aipId} = await params;
 
  return (
    <div>AIP {aipId}</div>
  )
}

export default AIP