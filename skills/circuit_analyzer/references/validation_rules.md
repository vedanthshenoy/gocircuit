# Circuit Validation Rules

## Critical Errors
1.  **Missing Ground**: Every circuit needs a reference point (Node 0).
2.  **Floating Node**: Every component pin must be connected to at least one other pin or ground.
3.  **Source Short**: A voltage source connected directly to ground or itself.
4.  **Dangling Source**: A voltage source not connected to a complete loop.

## Performance Deviations
1.  **Frequency Mismatch**: $f_{calculated} \neq f_{target}$.
2.  **Gain Mismatch**: Output magnitude at passband does not meet requirements.
3.  **Impedance Mismatch**: Input/Output impedance outside specified limits.
