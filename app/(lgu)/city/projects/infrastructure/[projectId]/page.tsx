const CityInfrastructureProject = async ({params}:ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>City Infrastructure Project {projectId}</div>
  )
}

export default CityInfrastructureProject