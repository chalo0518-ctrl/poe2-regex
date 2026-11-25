import type { ChapterId } from "@poe2-regex/data";
import {
  CAMPAIGN_FLOW_INTRO,
  CAMPAIGN_FLOW_TITLE,
  campaignFlowFor,
  type CampaignFlowStep,
} from "./campaignFlow.ts";

const PRIORITY = "（優先）";

function FlowText({ text }: { text: string }) {
  if (!text.includes(PRIORITY)) return text;
  const parts = text.split(PRIORITY);
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <span className="text-gold" data-priority="">
          {PRIORITY}
        </span>
      )}
    </span>
  ));
}

function FlowStep({ step }: { step: CampaignFlowStep }) {
  const named = Boolean(step.name || step.aside);
  return (
    <li>
      {step.name && <strong className="text-paper">{step.name}</strong>}
      {step.aside}
      {named ? "\u3000" : null}
      <FlowText text={step.text} />
    </li>
  );
}

export function CampaignFlow({ chapterId }: { chapterId: ChapterId }) {
  const flow = campaignFlowFor(chapterId);
  return (
    <section
      lang="zh-Hant"
      aria-labelledby="campaign-flow-title"
      data-campaign-flow={chapterId}
      className="mt-8 rounded border border-line bg-raised p-4"
    >
      <h2 id="campaign-flow-title" className="text-lg text-gold">
        {CAMPAIGN_FLOW_TITLE}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        {CAMPAIGN_FLOW_INTRO.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {flow.kicker && <p className="mt-4 text-sm font-medium text-paper">{flow.kicker}</p>}
      {flow.lead.length > 0 && (
        <div className="mt-3 space-y-2 text-sm leading-relaxed">
          {flow.lead.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed">
        {flow.steps.map((step) => (
          <FlowStep key={`${step.name ?? ""}:${step.text}`} step={step} />
        ))}
      </ul>
      {flow.tail.length > 0 && (
        <div className="mt-3 space-y-2 text-sm leading-relaxed">
          {flow.tail.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {flow.footnote && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{flow.footnote}</p>
      )}
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-gold">
        {flow.sources.map((source) => (
          <a
            key={source.href + source.label}
            href={source.href}
            className="underline decoration-gold/40 underline-offset-2 hover:text-paper"
          >
            {source.label}
          </a>
        ))}
      </p>
    </section>
  );
}
