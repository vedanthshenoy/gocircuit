---
name: waveform_generator
description: Handles the simulation of electronic circuits and the generation/analysis of input and output waveforms.
---

# Waveform Generator Skill

## Purpose
This skill manages the simulation of the designed circuit and the generation/visualization of input and output waveforms. It acts as a specialized **Waveform Generator Subagent**.

## Subagent Role: Waveform Generator
**Objective**: Given the circuit state in `waveform_scratchpad.txt` and `circuit.md`, and a user query, generate a mathematically and subject-wise accurate output waveform.

**Workflow**:
1.  **State Synchronization**:
    *   **Always read `waveform_scratchpad.txt` first** to identify the latest changes and current circuit state.
    *   Verify consistency with `circuit.md`.
    *   Extract components, their values, connections, and input waveform parameters from both sources.
2.  **Mathematical Modeling**:
    *   Derive the circuit's transfer function $H(s)$ or differential equations.
    *   Identify the type of circuit (e.g., Low-pass filter, High-pass filter, Rectifier, etc.).
    *   Calculate key parameters (e.g., cutoff frequency $f_c = \frac{1}{2\pi RC}$, time constant $\tau = RC$ or $L/R$, gain $A_v$, etc.).
3.  **Simulation & Computation**:
    *   Use `run_simulation()` to get empirical data points.
    *   Use mathematical tools (Python/NumPy/SciPy via `run_shell_command`) to compute precise theoretical waveforms.
    *   Solve differential equations for transient response if needed.
4.  **Output Generation**:
    *   Generate a structured representation of the output waveform $V_{out}(t)$.
    *   Provide the mathematical equation for the output.
    *   Format data for visualization in the playground.

## Essential Math & Physics
- **Ohm's Law**: $V = I \cdot R$
- **Capacitor Impedance**: $Z_C = \frac{1}{j\omega C}$
- **Inductor Impedance**: $Z_L = j\omega L$
- **Voltage Divider**: $V_{out} = V_{in} \cdot \frac{Z_2}{Z_1 + Z_2}$

## Common Circuit Equations & Transfer Functions

### RC Low-pass Filter
- **Transfer Function**: $H(s) = \frac{1}{1 + sRC}$
- **Cutoff Frequency**: $f_c = \frac{1}{2\pi RC}$
- **Step Response**: $V_{out}(t) = V_{in}(1 - e^{-t/RC})$

### RC High-pass Filter
- **Transfer Function**: $H(s) = \frac{sRC}{1 + sRC}$
- **Cutoff Frequency**: $f_c = \frac{1}{2\pi RC}$
- **Step Response**: $V_{out}(t) = V_{in}e^{-t/RC}$

## Tools & Computation
- **Numerical Integration**: Use SciPy's `odeint` for complex transient responses.
- **FFT Analysis**: Use NumPy's `fft` to analyze frequency components of waveforms.

## References
- See `references/theory.md` for detailed derivations.
- See `assets/waveforms.json` for sample waveform data structures.
