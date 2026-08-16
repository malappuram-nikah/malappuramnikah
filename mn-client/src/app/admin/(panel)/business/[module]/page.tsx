import ComingSoonPage from "@/components/admin/ComingSoonPage";

const MODULES: Record<string, { title: string; description: string }> = {
  "dress-rentals": {
    title: "Wedding Dress Rentals",
    description: "Manage wedding dress rental teams and inventory.",
  },
  photography: {
    title: "Photography & Videography",
    description: "Manage photography and videography service providers.",
  },
  "wedding-services": {
    title: "Wedding Services",
    description: "Manage mehndi, makeup, planning, and other wedding services.",
  },
  providers: {
    title: "Service Providers",
    description: "Manage registered business and service provider accounts.",
  },
  bookings: {
    title: "Business Bookings",
    description: "Manage wedding service bookings and orders.",
  },
  reviews: {
    title: "Business Reviews",
    description: "Moderate customer reviews for business services.",
  },
  commissions: {
    title: "Business Commissions",
    description: "Track platform commission from completed business orders.",
  },
};

export default async function BusinessModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const config = MODULES[module];

  if (!config) {
    return (
      <ComingSoonPage
        title="Module Not Found"
        description="This business management route is not recognized."
      />
    );
  }

  return <ComingSoonPage title={config.title} description={config.description} />;
}
