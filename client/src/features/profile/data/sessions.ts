import { Monitor, Laptop, Smartphone, Tablet } from "lucide-react";

export type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current?: boolean;
  icon: typeof Monitor;
};

export const SESSIONS: Session[] = [
  {
    id: "s1",
    device: "MacBook Pro 16”",
    browser: "Chrome 128 · macOS",
    location: "Mumbai, IN",
    ip: "103.24.•.•",
    lastActive: "Active now",
    current: true,
    icon: Laptop,
  },
  {
    id: "s2",
    device: "iPhone 15 Pro",
    browser: "DesiStorage iOS 4.2",
    location: "Mumbai, IN",
    ip: "49.207.•.•",
    lastActive: "12 min ago",
    icon: Smartphone,
  },
  {
    id: "s3",
    device: "iPad Air",
    browser: "Safari 17 · iPadOS",
    location: "Pune, IN",
    ip: "182.76.•.•",
    lastActive: "2 hours ago",
    icon: Tablet,
  },
  {
    id: "s4",
    device: "Windows Desktop",
    browser: "Edge 128 · Windows 11",
    location: "Bengaluru, IN",
    ip: "117.99.•.•",
    lastActive: "Yesterday",
    icon: Monitor,
  },
  {
    id: "s5",
    device: "MacBook Air",
    browser: "Firefox 130 · macOS",
    location: "Delhi, IN",
    ip: "43.241.•.•",
    lastActive: "3 days ago",
    icon: Laptop,
  },
];
