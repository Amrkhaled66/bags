import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
} from "lucide-react";
import { useSession } from "@/features/auth";
import { sessionStorage } from "@/shared/api/session-storage";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { cn } from "@/shared/utils/cn";
import { navigation } from "../config/navigation";

const navigationLinkClass =
  "flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-start text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent active:font-semibold active:text-primary";

function Navigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="space-y-6 px-3 py-6">
      {navigation.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-2 px-3 text-xs text-muted-foreground">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map(({ label, path, icon: Icon, ready }) => (
              <Tooltip key={path}>
                <TooltipTrigger asChild>
                  {ready ? (
                    <NavLink
                      end
                      to={path}
                      onClick={onNavigate}
                      className={navigationLinkClass}
                      aria-label={collapsed ? label : undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && label}
                    </NavLink>
                  ) : (
                    <button
                      className={cn(navigationLinkClass, "w-full opacity-45")}
                      aria-disabled="true"
                      aria-label={label}
                      type="button"
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && label}
                    </button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {ready ? label : `${label} - coming soon`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const current = navigation
    .flatMap((group) => group.items)
    .find((item) => item.path === location.pathname);
  const label = current?.label ?? "Page";

  return (
    <nav aria-label="Breadcrumb" className="flex gap-3 text-sm">
      <span className="text-muted-foreground">Workspace</span>
      <span className="text-muted-foreground">/</span>
      <span aria-current="page">{label}</span>
    </nav>
  );
}

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { data: admin } = useSession();
  
  return (
    <div
      className={cn(
        "min-h-svh [--sidebar-width:228px]",
        collapsed && "[--sidebar-width:72px]",
      )}
    >
      <a
        href="#main-content"
        className="fixed -top-20 inset-s-4 z-100 bg-background p-3 focus:top-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 inset-s-0 hidden w-(--sidebar-width) flex-col overflow-y-auto border-e bg-background lg:flex">
        <div className="flex h-19 pt-2 items-center gap-3 border-b px-5.5 text-xl font-bold">
          <ShoppingBag className="size-6 shrink-0" />
          {!collapsed && (
            <span>
              VERONA
              <span className="text-xs font-normal text-muted-foreground ms-2">
                ADMIN
              </span>
            </span>
          )}
        </div>
        <Navigation collapsed={collapsed} />
        <div className="mt-auto flex items-center gap-2.5 border-t px-3.5 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          {!collapsed && (
            <span className="text-xs text-muted-foreground">
              Store workspace
            </span>
          )}
        </div>
      </aside>
      <div className="ms-0 flex min-h-svh flex-col lg:ms-(--sidebar-width)">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-background px-3 py-3 sm:px-8 sm:py-4 lg:min-h-[76px]">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
                <SheetTitle className="flex h-19 items-center gap-3 border-b px-[22px] text-xl font-bold">
                  <ShoppingBag className="size-6" />
                  BAGS
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Main dashboard navigation.
                </SheetDescription>
                <Navigation onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Breadcrumbs />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="max-w-64"
                aria-label="Account menu"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f0e4df] text-xs text-[#824b36]">
                  {admin?.email.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block truncate">{admin?.email}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="max-w-72 truncate">
                {admin?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setLogoutOpen(true)}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:p-8"
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <footer className="flex justify-between px-4 py-5 text-[11px] text-muted-foreground sm:px-8">
          Bags Admin<span>&copy; {new Date().getFullYear()} Bags</span>
        </footer>
      </div>
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Bags?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => sessionStorage.setToken(null)}>
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
