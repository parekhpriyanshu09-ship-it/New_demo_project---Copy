import { Button } from '@/components/ui/button'

const ButtonGroupShineDemo = () => {
  const commonButtonClass = "bg-[#5f62f1] hover:bg-[#4f46e5] text-white font-bold text-[15px] tracking-wide px-7 h-11 border-0 shadow-sm relative overflow-hidden transition-all duration-300 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] focus-visible:z-10 dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%,transparent_100%)] cursor-pointer";

  return (
    <div className="inline-flex w-fit rounded-xl overflow-hidden shadow-md divide-x divide-white/20 select-none">
      <Button 
        className={`${commonButtonClass} rounded-none rounded-l-xl`}
        style={{ backgroundColor: "#5f62f1" }}
      >
        Upload
      </Button>
      <Button 
        className={`${commonButtonClass} rounded-none`}
        style={{ backgroundColor: "#5f62f1" }}
      >
        Download
      </Button>
      <Button 
        className={`${commonButtonClass} rounded-none rounded-r-xl`}
        style={{ backgroundColor: "#5f62f1" }}
      >
        Share
      </Button>
    </div>
  )
}

export default ButtonGroupShineDemo
