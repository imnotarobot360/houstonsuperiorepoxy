# AI visibility measurement plan

This is a repeatable observation process, not a promise that an assistant will mention Houston Superior Epoxy.

## Baseline protocol

1. Run each prompt in a fresh conversation with no prior company context.
2. Use the same account, browsing setting and approximate location when comparing dates.
3. Do not edit a prompt in place. Add a new stable ID when wording changes.
4. Record the platform and visible model/version.
5. Record a mention only when the answer actually names Houston Superior Epoxy.
6. Save the exact cited URL. A mention without a company URL is not a citation.
7. Record competitors in the order returned and flag factual errors.
8. Report branded and unbranded results separately. Branded lookups do not count as discovery visibility.

Recommended platforms: ChatGPT, Google AI Mode, Gemini, Claude, Perplexity and Grok.

## Recording a result

```bash
npm run aeo:record -- add \
  --prompt AEO-HOU-GAR-REC \
  --platform ChatGPT \
  --model "model shown in UI" \
  --mentioned yes \
  --position 3 \
  --cited-url https://houstonsuperiorepoxy.com/garage-floor-coatings-houston/ \
  --competitors "Competitor One;Competitor Two" \
  --accuracy accurate \
  --source-types "website;reviews" \
  --notes "Fresh chat; browsing on"
```

Generate a roll-up with:

```bash
npm run aeo:record -- summary
```

## Metrics

- Unbranded mention rate: unbranded prompts naming the company / unbranded prompts tested.
- Citation rate: prompts linking a Houston Superior Epoxy URL / prompts tested.
- Average position: mean position where the company is named in an ordered shortlist.
- Factual accuracy: accurate, mixed, incorrect or unknown.
- Coverage by city, service, intent and platform.

Keep screenshots or copied answers outside the repository when they contain personal account information. Store only the structured observation here.
