import { ShoppingBag } from "lucide-react";

export function LoginBrand() {
  return (
    <header className="flex items-center gap-3 px-[6%] py-8 text-xl font-bold max-sm:py-6">
      <ShoppingBag className="size-6" />
      <span>
        BAGS<span className="mx-[18px] font-normal text-[#c7cdc9]">/</span>
        <span className="text-muted-foreground font-normal text-sm">Admin</span>
      </span>
    </header>
  );
}
