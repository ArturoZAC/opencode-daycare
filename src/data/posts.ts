export type PostKind = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  kind: PostKind;
  title: string;
  avatar: string | null;
  time: string;
  authorLabel: string;
  audience: string;
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;
};

export const POSTS: Post[] = [
  {
    id: "mateo-orinal",
    kind: "achievement",
    title: "Mateo",
    avatar: "M",
    time: "14:20",
    authorLabel: "publicado por vos",
    audience: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "mateo-temperas",
    kind: "activity",
    title: "Mateo",
    avatar: "M",
    time: "09:40",
    authorLabel: "publicado por vos",
    audience: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    photoLabel: "Foto · pintando con témperas",
  },
  {
    id: "anuncio-parque",
    kind: "announcement",
    title: "Anuncio general",
    avatar: null,
    time: "07:50",
    authorLabel: "publicado por vos",
    audience: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
