"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "@/lib/teachers";
import type { Teacher } from "@/lib/types";
import { FormEvent, useState } from "react";

export function Gate({ onEnter }: { onEnter: (teacher: Teacher) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const teacher = authenticate(name, password);
    if (!teacher) {
      setError("Those words do not open a door.");
      return;
    }
    setError("");
    onEnter(teacher);
  }

  return (
    <main className="gate">
      <div className="ember" aria-hidden="true" />
      <div className="gate-copy">
        <p className="eyebrow">Welcome.</p>
        <h1 className="display">This isn&apos;t a website.</h1>
        <p className="lede">It&apos;s something your students made for you.</p>
        <form className="gate-form" onSubmit={onSubmit}>
          <div className="field">
            <Label htmlFor="teacher-name">Enter your name</Label>
            <Input
              id="teacher-name"
              name="name"
              autoComplete="name"
              autoCapitalize="words"
              spellCheck={false}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              required
            />
          </div>
          <div className="field">
            <Label htmlFor="teacher-password">Enter your password</Label>
            <Input
              id="teacher-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />
          </div>
          <Button type="submit">Enter your world →</Button>
          {error ? (
            <p className="gate-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
