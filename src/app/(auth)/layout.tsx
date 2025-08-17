interface prop{
  children: React.ReactNode
}

function Layout({children}: prop) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl md:h-[50%]">
            {children}
        </div>
    </div>
  // <div className="bg-muted flex h-screen flex-col items-center justify-center p-6 md:p-10">
  //   <div className="w-full max-w-sm md:max-w-3xl h-[90vh] overflow-y-auto  no-scrollbar">
  //    {children}
  //   </div>
  // </div>


  
  )
}

export default Layout
