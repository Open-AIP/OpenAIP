const CitizenHealthProject = async ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await params;
 
  return (
    <div>AIP {projectId}</div>
  )
}

export default CitizenHealthProject
