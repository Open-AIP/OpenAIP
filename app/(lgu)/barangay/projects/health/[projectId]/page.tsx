const BarangayHealthProject = async ({params}:ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>Barangay Health Project {projectId}</div>
  )
}

export default BarangayHealthProject