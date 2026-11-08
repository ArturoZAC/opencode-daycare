import { CameraIcon } from "@/src/components/Icons";
import { AppShell } from "@/src/layouts/components/AppShell";
import { PostCard } from "@/src/modules/feed/PostCard";
import { POSTS } from "@/src/modules/feed/posts";

export default function Home() {
  return (
    <AppShell activeItem="feed">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-28 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
        <header className="mb-6">
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">
            GUARDERÍA · SALA SOLES
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Buenas, Caro
          </h1>
          <p className="mt-[5px] text-[14.5px] text-muted">
            12 niños · martes 17 jun
          </p>
        </header>

        <div className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-line bg-card px-[18px] py-3.5 shadow-composer">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
            C
          </div>
          <span className="flex-1 text-[15px] text-muted-2">
            Compartí un momento…
          </span>
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral">
            <CameraIcon />
          </span>
        </div>

        <div className="mb-3.5 flex items-center gap-3.5">
          <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
            PUBLICADO HOY
          </span>
          <span className="h-px flex-1 bg-[#E7DAC8]" />
        </div>

        <div className="flex flex-col gap-4">
          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
