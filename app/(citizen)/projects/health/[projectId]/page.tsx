import type { ProjectIdParameter } from "@/types";

const CitizenHealthProject = async ({params}:ProjectIdParameter) => {
  const {projectId} = await params;
 
  return (
    <div>AIP {projectId}</div>
  )
}

export default CitizenHealthProject
