import WishlistHydration from "@/provider/WishlistHydration";
import Content from "./ui/Content";
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <WishlistHydration>
      <div className="my-10 flex min-h-screen flex-col gap-12">
        <Content />
      </div>
    </WishlistHydration>
  );
}
