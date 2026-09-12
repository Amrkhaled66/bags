import {
  LayoutDashboard,
  Package,
  Tags,
  Award,
  ShoppingCart,
  RotateCcw,
  Users,
  Ticket,
  Truck,
  Shield,
} from "lucide-react";

export const navigation = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/admin", icon: LayoutDashboard, ready: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Products",
        path: "/admin/products",
        icon: Package,
        ready: true,
      },
      {
        label: "Categories",
        path: "/admin/categories",
        icon: Tags,
        ready: true,
      },
      { label: "Brands", path: "/admin/brands", icon: Award, ready: true },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Orders",
        path: "/admin/orders",
        icon: ShoppingCart,
        ready: true,
      },
      {
        label: "Returns",
        path: "/admin/returns",
        icon: RotateCcw,
        ready: true,
      },
      {
        label: "Customers",
        path: "/admin/customers",
        icon: Users,
        ready: false,
      },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Coupons", path: "/admin/coupons", icon: Ticket, ready: true },
      {
        label: "Shipping rates",
        path: "/admin/shipping-rates",
        icon: Truck,
        ready: true,
      },
      {
        label: "Administrators",
        path: "/admin/admins",
        icon: Shield,
        ready: false,
      },
    ],
  },
];
