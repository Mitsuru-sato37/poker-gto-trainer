# Solver integration

Phase 0 uses [`ucsandman/postflop`](https://github.com/ucsandman/postflop) behind a solver-specific adapter. `SOLVER.lock` pins the inspected candidate source and `configs/btn-vs-bb-srp-flop.toml` pins the first BTN-vs-BB proof spot.

## Native CLI

With a Windows Rust toolchain and MSVC/Windows SDK available:

```powershell
git clone https://github.com/ucsandman/postflop.git .local/solver/postflop
git -C .local/solver/postflop checkout 5fc7ee3d92b823b6c58e4f58cbee7d50d5e9e6de
cargo build --release --manifest-path .local/solver/postflop/Cargo.toml
.local/solver/postflop/target/release/solver.exe solve `
  --config solver/configs/btn-vs-bb-srp-flop.toml `
  --report-every 50 `
  --out .local/solutions/btn-vs-bb-srp-flop.json
```

The current machine has Rust but not the MSVC linker/Windows SDK, so the native build was not runnable without a large system installation. The first actual solve was therefore executed in the upstream project's official hosted WebAssembly workbench, which states that it uses the same Rust engine but runs single-threaded.

## Proof artifacts

`proof/btn-bb-srp-flop/` records the actual run, the audited raw decision, canonical output, and trainer question. Run:

```powershell
npm run proof
```

This reruns the adapter and question reader and compares their results to the committed artifacts. It does not rerun the hosted solve. Full CLI solve/export/adapter automation remains the next data-foundation task.

## EV-bearing extraction boundary

The repository exposes `npm run extract:postflop -- RAW_EXPORT_JSON JOBS_JSON OUTPUT_JSON` for an export whose requested combo rows contain both `frequency` and `ev` for every source action. The command rejects missing EVs and validates every result through the existing adapter and canonical validator. The upstream Workbench's downloaded full JSON currently contains strategy frequencies but not those per-action EV rows, so it cannot be used as trainer ground truth by itself; retain it under ignored `.local/` storage and use an official EV-bearing export or audited Inspector rows.
