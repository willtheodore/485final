import * as React from "react";
import type { RevisionsActions, RevisionsState } from "./app/page";

export interface RevisionsContextValue {
    state: RevisionsState;
    dispatch: React.Dispatch<RevisionsActions>;
}

const RevisionsContext = React.createContext<RevisionsContextValue | null>(
    null,
);

export default RevisionsContext;
