import { LaptopIcon, MonitorIcon, Smartphone, TabletIcon } from "lucide-react";

export type DeviceName =
  | "Mobile"
  | "Tablet"
  | "Windows Desktop"
  | "Mac"
  | "Linux Desktop"
  | "Desktop";

const GetIconByDeviceName = ({
  deviceName,
  className,
}: {
  deviceName: DeviceName;
  className: string;
}) => {
  switch (deviceName) {
    case "Mobile":
      return <Smartphone className={className} />;
      break;
    case "Mac":
      return <LaptopIcon className={className} />;
      break;
    case "Tablet":
      return <TabletIcon className={className} />;
      break;
    default:
      return <MonitorIcon className={className} />;
      break;
  }
};

export default GetIconByDeviceName;
