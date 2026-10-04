import type { Student } from "@/lib/types";

/**
 * The shared class. Add a photo only with that student's permission —
 * this site is public, so anyone with the address can see it.
 */
export const classroom: Student[] = [
  { id: "amina", name: "Amina Yusuf" },
  { id: "leo", name: "Leo Park" },
  { id: "hana", name: "Hana Iqbal" },
  { id: "mateo", name: "Mateo Silva" },
  { id: "noor", name: "Noor Rahman" },
  { id: "jonah", name: "Jonah Adeyemi" },
  { id: "safa", name: "Safa Qureshi" },
  { id: "elias", name: "Elias Berg" },
  { id: "miriam", name: "Miriam Costa" },
  { id: "yusuf", name: "Yusuf Demir" },
  { id: "chloe", name: "Chloe Nguyen" },
  { id: "ibrahim", name: "Ibrahim Diallo" },
];

export function studentById(id: string) {
  return classroom.find((student) => student.id === id);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
