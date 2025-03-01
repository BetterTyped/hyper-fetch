import { Navbar } from "./navbar/navbar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full flex flex-col relative">
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};
