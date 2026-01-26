"use client";
import { RiCarLine } from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { FaClockRotateLeft } from "react-icons/fa6";
import { MdOutlineVpnLock } from "react-icons/md";
import { EMAIL, PHONE_NUMBER } from "@/constants/Admin";
import useTranslation from "@/translation/useTranslation";
export default function Policies() {
  const { data: translation } = useTranslation();
  const className =
    "mt-1 size-[1.75rem] text-color8 max-[1170px]:size-[1.5rem]";
  const policies = [
    {
      title: translation?.lang["FREE SHIPPING"],
      description: translation?.lang["SHIPPING POLICY"],
      icon: <RiCarLine className={className} />,
    },
    {
      title: translation?.lang["SUPPORT"],
      description: translation?.lang["SUPPORT POLICY"]
        .replace("{EMAIL}", EMAIL)
        .replace("{PHONE_NUMBER}", PHONE_NUMBER),
      icon: <MdOutlineSupportAgent className={className} />,
    },
    {
      title: translation?.lang["REFUND"],
      description: translation?.lang["REFUND POLICY"],
      icon: <FaClockRotateLeft className={className} />,
    },
    {
      title: translation?.lang["PAYMENT"],
      description: translation?.lang["PAYMENT POLICY"],
      icon: <MdOutlineVpnLock className={className} />,
    },
  ];
  return (
    <div dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} className="flex flex-col items-center justify-center gap-8">
      <div className="text-2xl font-extrabold uppercase text-slate-700 max-[420px]:text-lg">
        {translation?.lang["DELIVERY AND RETURN OF GOODS"]}
      </div>
      <div className="mx-auto flex w-fit max-w-[75rem] flex-row items-start justify-between gap-2 px-2 max-[800px]:grid max-[800px]:grid-cols-2 max-[800px]:grid-rows-2 max-[420px]:gap-0">
        {policies.map((policy, index) => (
          <Policy key={index} {...policy} />
        ))}
      </div>
    </div>
  );
}

function Policy(policy: {
  title: string | undefined;
  description: string | undefined;
  icon: JSX.Element;
}) {
  return (
    <div className="flex w-fit flex-row items-start gap-4 max-[1170px]:gap-2">
      {policy.icon}
      <div className="flex w-[15rem] flex-col items-start justify-center max-[1170px]:w-[10rem] max-[420px]:w-[7.5rem]">
        <span className="font-bold uppercase text-slate-700 max-[1170px]:text-sm">
          {policy.title}
        </span>
        <span className="text-sm max-[1170px]:text-[0.65rem]">
          {policy.description}
        </span>
      </div>
    </div>
  );
}
