"use client"

import dynamic from "next/dynamic"

// This MUST import the actual file, NOT a folder
const Sidebar = dynamic(() => import("./dashboard-sidebar").then(mod => mod.DashboardSidebar), {
  ssr: false,
})

export default function DashboardSidebarClient(props: any) {
  return <Sidebar {...props} />
}
