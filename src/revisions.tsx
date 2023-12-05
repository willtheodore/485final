"use client";

import { useContext } from "react";
import RevisionsContext from "./context";
import { ArrowDownIcon } from "@primer/octicons-react";
import { RevisionKey } from "./app/page";

const names = {
    rephrase: "Rephrase Suggestions",
    factCheck: "Fact Check Suggestions",
    tone: "Tone Suggestions",
};

const varStyles = {
    rephrase: "bg-red-100 hover:bg-red-200",
    factCheck: "bg-blue-100 hover:bg-blue-200",
    tone: "bg-green-100 hover:bg-green-200",
};

export default function Revisions({ keyword }: { keyword: RevisionKey }) {
    const { state: { revisions, isLoading, revisionAccepted }, dispatch } =
        useContext(RevisionsContext) ??
        { state: { revisions: null }, dispatch: () => { } };

    const currentRevisions = revisions ? revisions[keyword] ?? [] : [];

    return (
        <div className="flex flex-col items-center w-full px-2">
            <p className="border-b-2 border-black mb-2">{names[keyword]}</p>
            {currentRevisions.map((rephrase: any) => (
                <button
                    disabled={isLoading || revisionAccepted}
                    onClick={() =>
                        dispatch({
                            type: "accept",
                            key: keyword,
                            revision: rephrase,
                        })}
                    className={"flex flex-col w-full border-b-1 border-black items-center mb-2 rounded p-2 hover:pointer " +
                        varStyles[keyword]}
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
