"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { useSound } from "@/components/sound";
import { Button } from "@/components/ui/button";
import { lineFor } from "@/lib/teachers";
import { plaque } from "@/lib/session";
import type { WorldProps } from "@/lib/types";
import { useEffect, useState } from "react";

type Reagent = "cuso4" | "naoh" | "hcl" | "phenol" | "unknown";

const shelf: { id: Reagent; name: string; hint: string }[] = [
  { id: "cuso4", name: "Copper sulfate", hint: "Blue, and already dissolved." },
  { id: "naoh", name: "Sodium hydroxide", hint: "Clear. Treat it as if it matters." },
  { id: "hcl", name: "Hydrochloric acid", hint: "Clear. Stronger than it looks." },
  { id: "phenol", name: "Phenolphthalein", hint: "An indicator with a secret." },
  { id: "unknown", name: "Sample 14", hint: "Your handwriting, then ours." },
];

type Observation = { id: string; text: string };

function reaction(contents: Reagent[], heated: boolean, teacherName: string, notes: (id: string) => string): {
  color: string;
  height: string;
  observation: Observation | null;
  status: string;
} {
  const has = (id: Reagent) => contents.includes(id);
  if (contents.length === 0) {
    return {
      color: "transparent",
      height: "0%",
      observation: null,
      status: "The beaker is empty.",
    };
  }
  if (has("unknown")) {
    return {
      color: "#e6d3a8",
      height: "62%",
      observation: {
        id: "unknown",
        text: notes("noor"),
      },
      status: "Sample 14 clouds, then clears around a folded note.",
    };
  }
  if (has("cuso4") && has("naoh")) {
    return {
      color: "#8ec4de",
      height: "70%",
      observation: { id: "precip", text: notes("mateo") },
      status: "A pale blue solid falls out of the solution.",
    };
  }
  if (has("phenol") && has("naoh") && !has("hcl")) {
    return {
      color: "#e45b9a",
      height: "64%",
      observation: { id: "pink", text: notes("hana") },
      status: "The indicator turns a sudden pink.",
    };
  }
  if (has("phenol") && has("hcl")) {
    return {
      color: "rgba(255,255,255,0.18)",
      height: "60%",
      observation: { id: "acid", text: notes("miriam") },
      status: "The indicator stays colourless in the acid.",
    };
  }
  if (has("cuso4") && heated) {
    return {
      color: "#1f4f86",
      height: "66%",
      observation: { id: "heat", text: notes("jonah") },
      status: "The blue solution shivers over the flame.",
    };
  }
  if (has("cuso4")) {
    return {
      color: "#1d4e89",
      height: "58%",
      observation: null,
      status: `Copper sulfate waits in ${teacherName}'s beaker.`,
    };
  }
  if (heated) {
    return {
      color: "rgba(255,244,220,0.45)",
      height: "58%",
      observation: { id: "warm", text: notes("elias") },
      status: "Small bubbles climb the glass.",
    };
  }
  return {
    color: "rgba(226, 236, 242, 0.28)",
    height: "54%",
    observation: null,
    status: "A clear mixture. Nothing visible yet.",
  };
}

export function ChemistryWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const sound = useSound();
  const [stage, setStage] = useState<"intro" | "lab" | "finale">(skipIntro ? "lab" : "intro");
  const [step, setStep] = useState(skipIntro || reducedMotion ? 7 : 0);
  const [holding, setHolding] = useState<Reagent | null>(null);
  const [contents, setContents] = useState<Reagent[]>([]);
  const [heated, setHeated] = useState(false);
  const [bonds, setBonds] = useState<[boolean, boolean]>([false, false]);
  const [arm, setArm] = useState<number | null>(null);
  const [moleculeNote, setMoleculeNote] = useState("");
  const [found, setFound] = useState<Observation[]>([]);

  useEffect(() => {
    if (stage !== "intro" || reducedMotion || step >= 7) return;
    const delay = step === 0 ? 700 : 1300;
    const timer = window.setTimeout(() => setStep((value) => value + 1), delay);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, stage, step]);

  useEffect(() => {
    if (stage !== "intro") return;
    if (step === 1) sound.clink();
    if (step === 2 || step === 3) sound.ignite();
  }, [sound, stage, step]);

  useEffect(() => {
    if (stage !== "intro" || reducedMotion || step < 7) return;
    const timer = window.setTimeout(() => {
      setStage("lab");
      onIntroSeen();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [onIntroSeen, reducedMotion, stage, step]);

  const noteFor = (id: string) => lineFor(teacher, id);
  const mix = reaction(contents, heated, teacher.name, noteFor);

  function remember(observation: Observation | null) {
    if (!observation) return;
    setFound((current) =>
      current.some((item) => item.id === observation.id) ? current : [...current, observation],
    );
  }

  function pour() {
    if (!holding) {
      setMoleculeNote("Pick up a reagent from the shelf, then pour it here.");
      return;
    }
    if (contents.includes(holding)) {
      setMoleculeNote("That one is already in the glass.");
      return;
    }
    sound.clink();
    const next = [...contents, holding];
    setContents(next);
    setHolding(null);
    setMoleculeNote("");
    remember(reaction(next, heated, teacher.name, noteFor).observation);
  }

  function touchAtom(index: number) {
    if (arm === null) {
      setArm(index);
      setMoleculeNote("Choose the atom it should meet.");
      return;
    }
    if (arm === index) {
      setArm(null);
      return;
    }
    const pair = [arm, index].sort().join("");
    setArm(null);
    if (pair === "02") {
      setMoleculeNote("Those two hydrogens do not reach. The oxygen sits between them.");
      return;
    }
    const nextBonds: [boolean, boolean] = [bonds[0], bonds[1]];
    if (pair === "01") nextBonds[0] = !nextBonds[0];
    if (pair === "12") nextBonds[1] = !nextBonds[1];
    setBonds(nextBonds);
    if (nextBonds[0] && nextBonds[1]) {
      setMoleculeNote("The bonds hold. Water.");
      remember({ id: "water", text: lineFor(teacher, "safa") });
      return;
    }
    setMoleculeNote(nextBonds[0] || nextBonds[1] ? "One bond is holding." : "The bond breaks.");
  }

  if (stage === "intro") {
    return (
      <main className="chem-intro">
        <div className={`burner-row ${step >= 2 ? "lit" : ""} ${step >= 3 ? "both" : ""}`} aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="intro-copy">
          {step >= 4 ? <p className="plaque">{plaque(teacher)}</p> : null}
          {step >= 5 ? <p className="mono system">System initialising...</p> : null}
          {step >= 6 ? <h1 className="display">Welcome to your laboratory.</h1> : null}
          {reducedMotion ? (
            <Button
              type="button"
              className="enter-lab"
              onClick={() => {
                setStage("lab");
                onIntroSeen();
              }}
            >
              Enter the laboratory
            </Button>
          ) : null}
        </div>
        {reducedMotion ? null : (
          <Button
            type="button"
            variant="ghost"
            className="skip"
            onClick={() => {
              setStage("lab");
              onIntroSeen();
            }}
          >
            Skip
          </Button>
        )}
      </main>
    );
  }

  if (stage === "finale") {
    return (
      <main className="finale chem-finale">
        <RevealLines
          reducedMotion={reducedMotion}
          lines={[
            "ONE TEACHER",
            "30 STUDENTS",
            "COUNTLESS REACTIONS",
            "Some reactions happen in a laboratory.",
            "Others happen in people.",
          ]}
        >
          {(done) =>
            done ? (
              <Onward onClick={onMemory}>A door in the far wall of the laboratory.</Onward>
            ) : null
          }
        </RevealLines>
      </main>
    );
  }

  return (
    <main className="lab">
      <header className="world-heading">
        <p className="mono">{plaque(teacher)}</p>
        <h1 className="display">The laboratory</h1>
      </header>
      <div className="lab-grid">
        <section className="notebook" aria-live="polite">
          <h2>Observations</h2>
          <p>{mix.status}</p>
          {moleculeNote ? <p>{moleculeNote}</p> : null}
          {holding ? <p>Holding {shelf.find((item) => item.id === holding)?.name}.</p> : null}
          <ul>
            {found.map((item) => (
              <li key={item.id}>
                <span>Observation recorded</span>
                {item.text}
              </li>
            ))}
          </ul>
          {found.length >= 3 ? (
            <Onward onClick={() => setStage("finale")}>Begin the final reaction</Onward>
          ) : (
            <p className="hint">Three observations open the last reaction. {found.length} recorded.</p>
          )}
        </section>

        <section className="bench">
          <button
            type="button"
            className={`burner-control ${heated ? "lit" : ""}`}
            onClick={() => {
              const nextHeat = !heated;
              setHeated(nextHeat);
              if (nextHeat) sound.ignite();
              remember(reaction(contents, nextHeat, teacher.name, noteFor).observation);
            }}
          >
            <span className="flame" aria-hidden="true" />
            {heated ? "Burner lit" : "Light the burner"}
          </button>
          <button type="button" className="beaker" onClick={pour}>
            <span
              className={`liquid ${heated ? "bubbling" : ""}`}
              style={{ background: mix.color, height: mix.height }}
            />
            <span className="sr-only">Beaker</span>
          </button>
          <div className="bench-actions">
            <Button
              type="button"
              variant="ghost"
              className="bar-button"
              onClick={() => {
                setContents([]);
                setHeated(false);
                setHolding(null);
              }}
            >
              Empty the beaker
            </Button>
          </div>
          <div className="molecule" aria-label="Build a water molecule">
            <p className="mono">Break or form a bond</p>
            <div className="atoms">
              {["H", "O", "H"].map((symbol, index) => (
                <span key={`${symbol}-${index}`} className="atom-wrap">
                  {index > 0 ? (
                    <i className={(index === 1 ? bonds[0] : bonds[1]) ? "bond on" : "bond"} />
                  ) : null}
                  <button
                    type="button"
                    className={arm === index ? "atom held" : "atom"}
                    onClick={() => touchAtom(index)}
                  >
                    {symbol}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="shelf" aria-label="Reagents">
          <h2>Shelf</h2>
          {shelf.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              aria-pressed={holding === item.id}
              className={`reagent ${holding === item.id ? "is-held" : ""}`}
              onClick={() => {
                sound.clink();
                setHolding(item.id);
              }}
            >
              <strong>{item.name}</strong>
              <span>{item.hint}</span>
            </Button>
          ))}
        </section>
      </div>
    </main>
  );
}
