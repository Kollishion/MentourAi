import { useContext, useRef } from 'react';
import { NavbarColorContext, NavbarContext } from '../store/NavContext.tsx';
const Navbar = () => {

    const navGreenRef = useRef<HTMLDivElement | null>(null);

    const navbarCtx = useContext(NavbarContext);
    if (!navbarCtx) throw new Error("NavbarContext must be used within NavbarProvider");
    const [, setNavOpen] = navbarCtx;

    const navColorCtx = useContext(NavbarColorContext);
    if (!navColorCtx) throw new Error("NavbarColorContext must be used within NavbarProvider");

    return (
        <div className='z-4 flex fixed top-0 w-full items-start justify-between'>
            <div className='pt-3.5 lg:pl-9'>
                <div className='lg:w-40 w-15 text-3xl h-auto purple-fade-text'>	
			MentourAi
                </div>
            </div>
            <div onClick={()=>{
                setNavOpen(true)
            }} onMouseEnter={() => {
		if(navGreenRef.current) navGreenRef.current.style.height = '100%';
            }}
                onMouseLeave={() => {
	 	    if(navGreenRef.current) navGreenRef.current.style.height = '0%';
                }}
                className='lg:h-16 h-10 bg-black relative lg:w-[16vw] w-48'>
                <div ref={navGreenRef} className='bg-primary transition-all absolute top-0 h-0 w-full'></div>
                <div className='cursor-pointer relative h-full lg:px-12 px-8 flex flex-col justify-center items-end lg:gap-1.5 gap-0.5'>
                    <div className="lg:w-18 w-12 h-0.5 bg-white"></div>
                    <div className="lg:w-10 w-6 h-0.5 bg-white"></div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
