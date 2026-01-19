const CityHealthProject = async ({params}:ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>City Health Project {projectId}</div>
  )
}

export default CityHealthProject