"use client";

import { useContext } from "react";
import RevisionsContext from "../context";
import { ArrowDownIcon } from "@primer/octicons-react";
import type { RevisionKey } from "../app/page";

// Labels above revisions
const names = {
  rephrase: "Rephrase Suggestions",
  factCheck: "Fact Check Suggestions",
  tone: "Tone Suggestions",
};

// styles for different types of revisions
const varStyles = {
  rephrase: "bg-red-100 hover:bg-red-200",
  factCheck: "bg-green-100 hover:bg-green-200",
  tone: "bg-blue-100 hover:bg-blue-200",
};

export default function Revisions({ keyword }: { keyword: RevisionKey }) {
  // Access global state
  const {
    state: { revisions, isLoading, revisionAccepted },
    dispatch,
  } = useContext(RevisionsContext) ?? {
    state: { revisions: null },
    dispatch: () => {},
  };

  const currentRevisions = revisions ? revisions[keyword] ?? [] : [];

  return (
    <div className="flex w-full flex-col items-center px-2">
      <p className="mb-2 border-b-2 border-black">{names[keyword]}</p>
      {currentRevisions.map((rephrase: any) => (
        <button
          disabled={(isLoading ?? false) || (revisionAccepted ?? false)}
          onClick={() =>
            dispatch({
              type: "accept",
              key: keyword,
              revision: rephrase,
            })
          }
          className={
            "border-b-1 hover:pointer mb-2 flex w-full flex-col items-center rounded border-black p-2 " +
            varStyles[keyword]
          }
          key={rephrase.quote}
        >
          <p className="text-sm">{rephrase.quote}</p>
          <ArrowDownIcon size={16} />
          <p className="text-sm">{rephrase.revision}</p>
        </button>
      ))}
    </div>
  );
}
