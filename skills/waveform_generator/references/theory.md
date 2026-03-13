# Circuit Theory & Waveform Derivations

## Laplace Transforms for Circuit Analysis
Using the Laplace transform $V(s) = \mathcal{L}\{v(t)\}$, circuit components can be modeled as impedances:
- Resistor: $Z(s) = R$
- Capacitor: $Z(s) = \frac{1}{Cs}$
- Inductor: $Z(s) = Ls$

## Transient Analysis
### RC Charging
The differential equation for an RC circuit is:
$V_{in} = i(t)R + \frac{1}{C}\int i(t)dt$
Solution for step input $V_s$:
$V_c(t) = V_s(1 - e^{-t/RC})$

## Frequency Response
Bode plots are used to visualize the magnitude and phase of $H(j\omega)$.
- $20\log_{10}|H(j\omega)|$ in dB.
- Phase $\angle H(j\omega)$ in degrees.
