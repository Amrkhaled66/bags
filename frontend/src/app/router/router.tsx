import { createBrowserRouter, Navigate } from "react-router";
import { RequireAdmin, loadLoginPage } from "@/features/auth";
import { RouteError, NotFound } from "./route-feedback";
import { AdminLayout } from "../layouts/admin-layout";

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Navigate to="/admin" replace /> },
      {
        path: "/login",
        lazy: async () => ({ Component: (await loadLoginPage()).default }),
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            path: "/admin",
            Component: AdminLayout,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("@/features/dashboard"))
                    .OverviewPage,
                }),
              },
              {
                path: "brands",
                lazy: async () => ({
                  Component: (await import("@/features/brands")).BrandsPage,
                }),
              },
              {
                path: "categories",
                lazy: async () => ({
                  Component: (await import("@/features/categories"))
                    .CategoriesPage,
                }),
              },
              {
                path: "products",
                lazy: async () => ({
                  Component: (await import("@/features/products")).ProductsPage,
                }),
              },
              {
                path: "products/:id",
                lazy: async () => ({
                  Component: (await import("@/features/products"))
                    .ProductDetailPage,
                }),
              },
              {
                path: "shipping-rates",
                lazy: async () => ({
                  Component: (await import("@/features/shipping-rates"))
                    .ShippingRatesPage,
                }),
              },
              {
                path: "coupons",
                lazy: async () => ({
                  Component: (await import("@/features/coupons")).CouponsPage,
                }),
              },
              {
                path: "orders",
                lazy: async () => ({
                  Component: (await import("@/features/orders")).OrdersPage,
                }),
              },
              {
                path: "orders/:id",
                lazy: async () => ({
                  Component: (await import("@/features/orders"))
                    .OrderDetailPage,
                }),
              },
              {
                path: "returns",
                lazy: async () => ({
                  Component: (await import("@/features/returns")).ReturnsPage,
                }),
              },
              {
                path: "returns/:id",
                lazy: async () => ({
                  Component: (await import("@/features/returns"))
                    .ReturnDetailPage,
                }),
              },
              { path: "*", Component: NotFound },
            ],
          },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
