import OpenAI from "openai";
import type {
  Revision,
  RevisionKey,
  RevisionsActions,
  RevisionsState,
} from "./app/page";
import type Quill from "quill";

const FORMAT_COLORS = {
  rephrase: "#f7c8d5",
  tone: "#1313ab",
  factCheck: "#acfaaf",
};

const REPHRASE_SYSTEM_PROMPT =
  "You are an experienced editor at a reputable newspaper. \
You provide feedback on brevity for writers. You don't provide suggestions unless it is necessary to make changes. \
You respond in JSON format only.";

const REPHRASE_USER_PROMPT = `Analyze the following text and list 0-3 sentences that should be rephrased for brevity.
    Only include meaningful revisions: omit any that only change a few words.
    If there are no revisions to the draft, please respond:
{
"response": "no revisions needed"
}
Otherwise, use the format:
{
"response": {
    "1": {
        "quote": "quote from text",
        "revision": "revised version"
    },
   "2": {
        ...
   },
   ...
}

"`;

const TONE_USER_PROMPT = `Analyze the following text for emotional tone and list 0-3 sentences that should be rephrased to better match the desired emotional tone.
    If there are no revisions to the draft, please respond:
    {
        "response": "no revisions needed"
    }
    Otherwise, use the format:
    {
        "response": {
            "1": {
                "quote": "quote from text",
                "revision": "revised version"
            },
            "2": {
                ...
            },
            ...
        }
    }
    Desired Tone: `;

const FACT_CHECK_USER_PROMPT = `Analyze the following text for factual accuracy and list 0-3 sentences that should be revised.
    If there are no factual inaccuracies, please respond:
    {
        "response": "no revisions needed"
    }
    Otherwise, use the format:
    {
        "response": {
            "1": {
                "quote": "quote from text",
                "revision": "revised version"
            },
            "2": {
                ...
            },
            ...
        }
    }
    `;

export const getRephrases = async (text: string, apiKey: string) => {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPrompt = REPHRASE_USER_PROMPT + text + '"';

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: REPHRASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const rawText = response.choices[0]
      ? response.choices[0].message.content
      : null;
    if (!rawText) {
      return "ERROR";
    }

    if (rawText.includes("no revisions needed")) return "no revisions needed";

    const rephrases = JSON.parse(rawText).response;
    console.log(rephrases);
    const res = [];
    for (const key in rephrases) {
      res.push(rephrases[key]);
    }
    return res;
  } catch (error) {
    console.error(error);
    return "ERROR";
  }
};

// Function to get tone adjustments
export const getTone = async (
  text: string,
  desiredTone: string,
  apiKey: string,
) => {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const userPrompt = TONE_USER_PROMPT + `${desiredTone}.\n\n${text}"`;

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: REPHRASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const rawText = response.choices[0]
      ? response.choices[0].message.content
      : null;
    if (!rawText) return "ERROR";
    if (rawText.includes("no revisions needed")) return "no revisions needed";

    const toneRevisions = JSON.parse(rawText).response;
    const res = [];
    for (const key in toneRevisions) res.push(toneRevisions[key]);
    console.log("tone", res);
    return res;
  } catch (error) {
    console.error(error);
    return "ERROR";
  }
};

// Function to get fact-check revisions
export const getFacts = async (text: string, apiKey: string) => {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const userPrompt = FACT_CHECK_USER_PROMPT + text + '"';

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: REPHRASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const rawText = response.choices[0]
      ? response.choices[0].message.content
      : null;
    if (!rawText) return "ERROR";
    if (rawText.includes("no revisions needed")) return "no revisions needed";

    const factRevisions = JSON.parse(rawText).response;
    const res = [];
    for (const key in factRevisions) res.push(factRevisions[key]);
    return res;
  } catch (error) {
    console.error(error);
    return "ERROR";
  }
};

export const acceptRevision = (quill: Quill, revision: Revision) => {
  const { quote: oldText, revision: newText } = revision;
  const content = quill.root.innerHTML;
  const plainContent = content
    .replace(/<\/p><p>/g, "\n")
    .replace(/<[^>]*>/g, "");
  const index = plainContent.indexOf(oldText);

  debugger;

  quill.removeFormat(index, oldText.length);
  quill.deleteText(index, oldText.length);
  quill.insertText(index, newText);
};

export const publishRevisions = (
  quill: Quill,
  revisions: Revision[],
  content: string,
  keyword: RevisionKey,
  dispatch: React.Dispatch<RevisionsActions>,
) => {
  for (const suggestion of revisions) {
    const { quote } = suggestion;
    const plainContent = content
      .replace(/<\/p><p>/g, "\n")
      .replace(/<[^>]*>/g, "");
    const index = plainContent.indexOf(quote);
    if (keyword === "rephrase") {
      quill.formatText(
        index,
        quote.length,
        "background",
        FORMAT_COLORS[keyword],
      );
    } else if (keyword === "tone") {
      quill.formatText(index, quote.length, "color", FORMAT_COLORS[keyword]);
      quill.formatText(index, quote.length, "bold", "true");
    } else {
      quill.formatText(index, quote.length, "bold", "true");
      quill.formatText(index, quote.length, "underline", "true");
    }
  }
  dispatch({
    type: "set",
    key: keyword,
    revisions,
  });
};

export const update = async (
  state: RevisionsState,
  dispatch: React.Dispatch<RevisionsActions> | undefined | null,
) => {
  const { quill, selectedTone } = state;
  if (!quill) {
    console.log("quill undefined");
    return;
  }
  if (!dispatch) {
    console.log("dispatch undefined");
    return;
  }

  const content = quill.root.innerHTML;

  if (state.enabled.rephrase) {
    const rephrases = await getRephrases(content, state.apiKey);
    if (typeof rephrases !== "string") {
      publishRevisions(quill, rephrases, content, "rephrase", dispatch);
    }
  }
  if (state.enabled.tone) {
    const toneSuggestions = await getTone(
      content,
      selectedTone ?? "neutral",
      state.apiKey,
    );
    if (typeof toneSuggestions !== "string") {
      publishRevisions(quill, toneSuggestions, content, "tone", dispatch);
    }
  }
  if (state.enabled.factCheck) {
    const factSuggestions = await getFacts(content, state.apiKey);
    if (typeof factSuggestions !== "string") {
      publishRevisions(quill, factSuggestions, content, "factCheck", dispatch);
    }
  }

  dispatch({
    type: "finished",
  });
};
