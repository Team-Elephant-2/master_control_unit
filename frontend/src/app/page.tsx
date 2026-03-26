import TopBar from "@/components/TopBar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MainContent from "@/components/MainContent";

export default function Home() {
  return (
    <div className="h-full">
      <TopBar />
      <LeftSidebar />
      <RightSidebar />
      <MainContent />
    </div>
  );
}
