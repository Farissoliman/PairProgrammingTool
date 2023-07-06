import { ButtonHTMLAttributes, PropsWithChildren } from "react";

export const Button = ({
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => {
  return (
    <button className="rounded-md bg-blue-500 px-3 py-2 text-white" {...props}>
      {children}
    </button>
  );
};
