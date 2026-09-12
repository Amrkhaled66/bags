export function LoginFooter() {
  return (
    <footer className="flex justify-between px-[6%] py-7 text-xs text-muted-foreground">
      Bags &copy; {new Date().getFullYear()}
      <span className="max-sm:hidden">Store administration</span>
    </footer>
  );
}
