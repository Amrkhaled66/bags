import loginPhoto from "@/assets/login-backpack.jpg";

export function LoginArtwork() {
  return (
    <div className="relative h-[470px] overflow-hidden rounded-md bg-[#e7e9e7] max-sm:hidden">
      <img
        className="size-full object-cover"
        src={loginPhoto}
        alt="Black backpack with travel essentials"
      />
      <span className="absolute bottom-5 start-5 bg-[#242824b0] px-2.5 py-1.5 text-[11px] text-white">
        BAGS COLLECTION
      </span>
    </div>
  );
}
