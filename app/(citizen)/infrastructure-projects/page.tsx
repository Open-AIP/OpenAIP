const InfrastructureProjects = async ({params} : ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>AIP {projectId}</div>
  )
}
export default InfrastructureProjects