# Circuit Playground

Welcome to the **Circuit Playground**, an interactive, browser-based electronics circuit simulator. This playground allows you to design, simulate, and analyze basic electronic circuits in real-time.

## Key Features

- **Interactive Canvas**: Drag and drop components to build your circuit.
- **Real-time Simulation**: Visualize voltage and current waveforms as you modify the circuit.
- **Component Toolbox**: A variety of basic electronic components at your fingertips:
  - **Resistors**: Control current flow and drop voltage.
  - **Capacitors**: Store electrical energy in an electric field.
  - **Inductors**: Store energy in a magnetic field.
  - **Diodes**: Allow current to flow in one direction.
  - **Voltage Sources**: Provide the driving force for the circuit.
  - **Ground**: The reference point for zero potential.
- **Custom Waveforms**: Configure input voltage waveforms (Sine, Square, Triangle, DC) with custom amplitude, frequency, and phase.
- **Visual Feedback**: Real-time graphing of output waveforms using integrated charting.

## Chat Interface & Agent
The playground includes an intelligent **Circuit Agent** to assist you.
- Click the **Message Icon** (bottom-right) to open the chat.
- Describe your desired circuit (e.g., "Create a low pass filter with a cutoff of 1kHz").
- The agent will guide you through requirements, design, and simulation.

## Getting Started

1. **Add Components**: Select a component from the toolbox on the left and click/drag it onto the canvas.
2. **Connect Components**: Click on the connection ports of components and drag to another port to create a wire.
3. **Configure Properties**: Click on any component to open the properties panel on the right. Here you can change values (e.g., resistance in Ohms, capacitance in Farads).
4. **Run Simulation**: Once your circuit is connected, the simulation runs automatically or can be triggered via the simulation button.
5. **Analyze Results**: View the output waveforms in the bottom panel to see how your circuit behaves.

## Technologies Used

- **React**: Modern UI library for a responsive experience.
- **React Flow**: Powerful library for building node-based editors.
- **Recharts**: For high-performance charting of simulation results.
- **TypeScript**: Ensuring type safety and better developer experience.
- **Lucide-React**: Beautiful and consistent iconography.

---

Happy Building! ⚡🔌
