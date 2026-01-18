import React from 'react'

const CitizenLayout = ({children} : {children: React.ReactNode}) => {
  return (
    <div>
      <p>Citizen Website</p>
      {children}
    </div>
  )
}

export default CitizenLayout