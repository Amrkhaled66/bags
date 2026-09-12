export interface Overview {
  orders: {
    total: number;
    grossSales: string;
    byStatus: Record<string, number>;
    recent: {
      id: string;
      orderNumber: string | null;
      customerName: string | null;
      total: string | null;
      status: string | null;
      createdAt: string | null;
    }[];
  };
  payments: { collected: string; refunded: string; netCollected: string };
  customers: { total: number; newInPeriod: number };
  returns: { totalInPeriod: number; pending: number };
  catalog: {
    products: number;
    lowStockVariants: number;
    outOfStockVariants: number;
    lowStockThreshold: number;
  };
}
