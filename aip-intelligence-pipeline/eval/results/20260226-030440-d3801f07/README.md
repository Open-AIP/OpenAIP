# Eval Run Artifact

## Reproduce

```powershell
python 'C:\Users\Cj\Documents\College\4th Year 2nd Sem\CPP122 CpE Practice and Design 2\open-aip\aip-intelligence-pipeline\eval\run_eval.py' --input eval/questions/v2/questions.jsonl --max 10 --concurrency 3
```

## Run Context

- Input path: `C:\Users\Cj\Documents\College\4th Year 2nd Sem\CPP122 CpE Practice and Design 2\open-aip\aip-intelligence-pipeline\eval\questions\v2\questions.jsonl`
- Input SHA256: `d3801f074897478850ebcd11ec590b43425b2247d2ec462bb062d651299b2db9`
- Base URL: `http://localhost:3000`
- Auth mode: `cookie`

## Environment Variables

- `OPENAIP_WEBSITE_BASE_URL`
- `OPENAIP_EVAL_BEARER_TOKEN` (optional)
- `OPENAIP_EVAL_COOKIE_HEADER` (optional)

## Notes

- Route checks are heuristic-strict when route metadata is absent.
- Missing optional response fields are treated as mismatches, not runner crashes.
