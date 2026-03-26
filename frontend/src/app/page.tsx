import TopBar from "@/components/TopBar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MainContent from "@/components/MainContent";
import BackendBridge from "@/components/BackendBridge";

export default function Home() {
  return (
    <div className="h-full">
      <BackendBridge />
      <TopBar />
      <LeftSidebar />
      <RightSidebar />
      <MainContent />
    </div>
  );
}
