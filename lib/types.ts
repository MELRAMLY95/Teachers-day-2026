export type Subject =
  | "chemistry"
  | "physics"
  | "mathematics"
  | "biology"
  | "english"
  | "inner";

export type Student = {
  id: string;
  name: string;
  /** Optional photo in /public, for example "/memories/amina.jpg". */
  photo?: string;
};

export type Message = {
  studentId: string;
  line: string;
};

export type Discovery = {
  id: string;
  title: string;
  body: string;
};

export type Teacher = {
  id: string;
  name: string;
  honorific: string;
  password: string;
  subject: Subject;
  messages: Message[];
  /** Objects hidden inside that teacher's world. */
  discoveries?: Discovery[];
  /** The last page, written for this teacher only. */
  ending?: string[];
};
