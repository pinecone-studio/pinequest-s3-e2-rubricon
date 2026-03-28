import { currentUser } from "@clerk/nextjs/server";
import SidebarClient from "./SidebarClient";

const Sidebar = async () => {
  const user = await currentUser();
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  return <SidebarClient displayName={displayName} isSignedIn={!!user} />;
};

export default Sidebar;
