"use client";
import { createContext, useContext } from "react";
import { message } from "antd";
type NotificationType = "success" | "info" | "warning" | "error";
message.config({
  top: 100,
  duration: 10,
  maxCount: 3,
  rtl: true,
  prefixCls: "my-message",
});

function createToast() {
  const [messageApi, contextHolder] = message.useMessage();
  const openNotificationWithIcon = (
    type: NotificationType,
    message: string,
    description: string,
  ) => {
    messageApi.open({
      type: type,
      content: (
        <>
          <span className="my-2 mr-1 text-[1.05rem] font-semibold">
            {message}
          </span>
          <span className="my-2 ml-2 text-[1.05rem]">{description}</span>
        </>
      ),
    });
  };

  const toast = {
    success(message: string, description: string = "") {
      openNotificationWithIcon("success", description, message);
    },
    error(message: string, description: string = "") {
      openNotificationWithIcon("error", description, message);
    },
    warning(message: string, description: string = "") {
      openNotificationWithIcon("warning", description, message);
    },
    info(message: string, description: string = "") {
      openNotificationWithIcon("info", description, message);
    },
  };
  return { toast: toast, toastContainer: contextHolder };
}
export type ToastType = Partial<{
  toast: {
    success(message: string, description?: string): void;
    error(message: string, description?: string): void;
    warning(message: string, description?: string): void;
    info(message: string, description?: string): void;
  };
  toastContainer: React.ReactNode;
}>;
// Context
const toastContext = createContext<ToastType>({}); // Update the createContext type

function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, toastContainer } = createToast();
  return (
    <toastContext.Provider value={{ toast, toastContainer }}>
      {children}
    </toastContext.Provider>
  );
}
function useToast() {
  const { toast, toastContainer } = useContext(toastContext);
  if (!toast || !toastContainer)
    throw new Error("useToast must be used within a ToastProvider");
  return { toast, toastContainer };
}
function ToastContainer() {
  const { toastContainer } = useContext(toastContext);
  return <>{toastContainer}</>;
}

export { useToast, ToastProvider, ToastContainer };
