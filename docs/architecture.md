# Architecture

Open `docs/architecture.html` for the visual graph.

## System

```mermaid
flowchart TD
    World{{World<br/>verified humans}}
    Owner[Owner web<br/>human-backed agent]
    Runtime[Next.js runtime<br/>API + validation + payout routing]
    DB[(Postgres)]
    Worker[Worker mobile<br/>verified human]
    Approval[Manual approval<br/>inside runtime]
    Hedera[Hedera<br/>payout rail]

    World -. verifies .-> Owner
    World -. verifies .-> Worker

    Owner -->|create task / approve| Runtime
    Worker -->|accept / submit proof| Runtime
    Runtime <--> DB
    Runtime -->|low-risk payout| Hedera
    Runtime -->|high-risk review| Approval
    Approval -->|approved payout| Hedera
    Runtime -->|status| Owner
    Runtime -->|task feed + result| Worker
```

## Lifecycle

```mermaid
flowchart LR
    open[open] --> accepted[accepted]
    accepted --> submitted[submitted]
    submitted -->|valid + low risk| paid[paid]
    submitted -->|valid + high risk| pending[pending approval]
    pending --> paid
    submitted -->|invalid| rejected[rejected]
```

## Notes

- `frontend` = owner web app + shared Next.js runtime
- `mobile` = worker app
- `1 task -> 1 worker`
- no separate backend app
- World = human verification
- Hedera = payout rail
- manual approval lives inside the runtime today
- proof validation is currently rules-based
