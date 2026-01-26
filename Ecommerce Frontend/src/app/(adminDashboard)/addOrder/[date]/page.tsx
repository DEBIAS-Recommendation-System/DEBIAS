"use client" ;
import Image from "next/image";
import { OrderProvider } from "./context/useOrder";
import { StepProvider, useStep } from "./context/useStep";
import Navbar from "./ui/navbar";
import OrderContent from "./ui/orderContent/orderContent";
import UserInfo from "./ui/userInfo";
import { useParams } from "next/navigation";

function AddOrder() {
    const { date } = useParams();
    const { step, setStep } = useStep();
    function RenderStep() {
      switch (step) {
        case 1:
          return <UserInfo />;
        case 2:
          return <OrderContent />;
        default:
          return <UserInfo />;
      }
    }
    return (
        <>
         <div className="m-auto mt-20 flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-xl font-bold uppercase text-color5 sm:text-2xl">
          Add Order On {date} 
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
      </div>
        <div className="m-auto mt-5 flex w-[40rem] flex-col gap-5 pb-5">
       
        <Navbar />
        <RenderStep />
      </div>
        </>
       
    );
  }
  export default function Page() {
    return (
      <StepProvider>
        <OrderProvider>
          <AddOrder />
        </OrderProvider>
      </StepProvider>
    );
  }
  