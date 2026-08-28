# Model routing decision

The release routes by job shape, not by prestige:

| Role | Requested model | Effective snapshot | Why |
| --- | --- | --- | --- |
| 3 document workers | `gpt-4.1-mini` | `gpt-4.1-mini-2025-04-14` | High-volume, bounded extraction with strict Structured Outputs |
| 1 offline judge batch | `gpt-5.5` | `gpt-5.5-2026-04-23` | Stronger qualitative review after deterministic gates |

`gpt-4.1-mini` was the cheapest model enabled for this OpenAI project that supported the existing Responses API and strict schema contract. It passed all 15 live extraction calls and all five deterministic routes. It did not pass the calibrated judge anchors, so the release keeps `gpt-5.5` only for that single offline batch instead of weakening the gate.

## Measured release comparison

| Path | Previous all-`gpt-5.5` | Routed release | Reduction |
| --- | ---: | ---: | ---: |
| Public case, 3 workers | US$0.03627 | US$0.001752 | 95.2% |
| Full 5-case eval + judge | US$0.2422 | US$0.063389 | 73.8% |

The routed run used 4,233 worker input tokens, 4,416 worker output tokens, 4,692 judge input tokens and 1,039 judge output tokens. Estimates use the published standard rates of US$0.40/M input and US$1.60/M output for [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), and US$5/M input and US$30/M output for [GPT-5.5](https://developers.openai.com/api/docs/models/gpt-5.5).

This is regression evidence over five synthetic cases, not a production-cost forecast. Model or prompt changes must rerun the exact suite; reuse also requires the effective snapshot to match.

## Rejected routes

- `gpt-5.4-nano` workers + `gpt-5.4-mini` judge: lower theoretical cost, but unavailable to the current project; fail closed rather than silently substituting.
- `gpt-4.1-mini` judge: cheaper, but failed the labeled calibration anchors.
- `gpt-5.5` for every call: passed, but spent strong-model capacity on a bounded extraction task.
