import {
  HeartIcon,
  ImageIcon,
  MegaphoneIcon,
  MessageIcon,
} from "@/src/components/Icons";
import type { Post, PostKind } from "./posts";

const KIND_STYLES: Record<
  PostKind,
  { label: string; pill: string; dot: string }
> = {
  achievement: {
    label: "LOGRO",
    pill: "bg-[#CFEBD8] text-[#3E9B6C]",
    dot: "bg-[#3E9B6C]",
  },
  activity: {
    label: "ACTIVIDAD",
    pill: "bg-[#C7E7F1] text-[#2E89A6]",
    dot: "bg-[#2E89A6]",
  },
  announcement: {
    label: "ANUNCIO",
    pill: "bg-[#CCD8F4] text-[#4E72C8]",
    dot: "bg-[#4E72C8]",
  },
};

export function PostCard({ post }: { post: Post }) {
  const style = KIND_STYLES[post.kind];

  return (
    <article className="rounded-card border border-line bg-card px-[22px] py-5 shadow-card">
      <header className="mb-3.5 flex items-center gap-3">
        {post.avatar ? (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[17px] font-semibold text-[#1F7A93]">
            {post.avatar}
          </div>
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#CCD8F4] text-[#4E72C8]">
            <MegaphoneIcon />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.title}
          </div>
          <div className="text-[12.5px] text-muted-2">
            {post.time} · {post.authorLabel}
          </div>
        </div>
        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-xs font-extrabold tracking-[.5px] ${style.pill}`}
        >
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.label}
        </div>
      </header>

      <div className="mb-2.5 text-[12.5px] text-muted-2">{post.audience}</div>

      <p className="text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>

      {post.photoLabel ? (
        <div className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
          <ImageIcon />
          <span className="text-[13.5px]">{post.photoLabel}</span>
        </div>
      ) : null}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-coral">
          <HeartIcon />
          {post.likes}
        </span>
        <span className="flex items-center gap-[7px] text-sm font-bold text-muted">
          <MessageIcon />
          {post.comments}
        </span>
        <span className="flex-1" />
        <span className="text-sm font-extrabold text-coral-deep">Editar</span>
      </footer>
    </article>
  );
}
