const BarangayInfrastructureProject = async ({params}:ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>Barangay Infrastructure Project {projectId}</div>
  )
}

export default BarangayInfrastructureProject