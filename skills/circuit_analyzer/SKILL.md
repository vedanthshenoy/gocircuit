---
name: circuit_analyzer
description: Validates circuit designs for electrical correctness and requirements compliance.
---

# Circuit Analyzer Skill

## Purpose
This skill validates a proposed circuit design against the original requirements and electrical correctness rules, ensuring the design is viable for simulation.

## Validation Workflow
1.  **Topology Analysis**:
    -   Identify series/parallel combinations.
    -   Verify the path from source to ground.
2.  **Compliance Checks**:
    -   Does the cutoff frequency $f_c$ match requirements within ±10%?
    -   Is the DC gain correct?
3.  **Correctness Rules**:
    -   Check for floating nodes (unconnected pins).
    -   Ensure at least one **Ground** exists.
    -   Detect short circuits (e.g., source to ground direct connection).
4.  **Component Limits**:
    -   Ensure component values are not 0.
    -   Verify realistic power/voltage limits for simulated components.

## Technical Rules
-   **KCL (Kirchhoff's Current Law)**: $\sum I_{node} = 0$.
-   **KVL (Kirchhoff's Voltage Law)**: $\sum V_{loop} = 0$.

## References
- `references/validation_rules.md`: Detailed list of common electrical errors and their symptoms.
- `assets/checklists.json`: Checklists for different types of circuits (Filters, Bridges, etc.).

## Tools
- `run_simulation()`: Used for verification of theoretical performance.
