import { useState, useCallback, useEffect } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateCircuit } from '../../utils/circuit-validator';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

type ChatState = {
  messages: Message[];
  isTyping: boolean;
  step: 'idle' | 'requirements' | 'summary' | 'design' | 'validation' | 'simulation';
  requirementText: string;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-pro";

export const useChat = () => {
  const { components, edges, inputWaveform, setNodes, setEdges, setComponents, setInputWaveform, runSimulation, setHighlightedIds } = useCircuit();
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your Circuit Assistant. What circuit would you like to build or modify today?",
        timestamp: Date.now(),
      },
    ],
    isTyping: false,
    step: 'idle',
    requirementText: '',
  });

  // Effect to handle highlighting based on bold text in assistant messages
  useEffect(() => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const matches = [...lastMessage.content.matchAll(boldRegex)];
      const labelsToHighlight = matches.map(m => m[1].trim().toUpperCase());
      
      if (labelsToHighlight.length > 0) {
        const idsToHighlight = Object.entries(components)
          .filter(([_, comp]) => labelsToHighlight.includes(comp.label.toUpperCase()))
          .map(([id]) => id);
        
        setHighlightedIds(idsToHighlight);
        
        // Auto-clear after 10 seconds
        const timer = setTimeout(() => setHighlightedIds([]), 10000);
        return () => clearTimeout(timer);
      } else {
        setHighlightedIds([]);
      }
    }
  }, [state.messages, components, setHighlightedIds]);

  const generateWithFallback = async (prompt: string, history: any[] = []) => {
    if (!genAI) throw new Error("GenAI not initialized");

    try {
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      if (!result || !result.response) {
        throw new Error("Empty response from model");
      }
      return result.response.text();
    } catch (error) {
      console.warn(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL})...`, error);
      try {
        const model = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(prompt);
        if (!result || !result.response) {
          throw new Error("Empty response from fallback model");
        }
        return result.response.text();
      } catch (fallbackError) {
        console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackError);
        throw fallbackError;
      }
    }
  };

  const addMessage = (role: Message['role'], content: string) => {
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: Math.random().toString(36).substring(7),
          role,
          content,
          timestamp: Date.now(),
        },
      ],
    }));
  };

  const extractJson = (text: string) => {
    // Try to find a JSON block first
    const match = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/{[\s\S]*}/);
    if (!match) return null;
    const jsonStr = match[0].includes('```json') ? match[1] : match[0];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse extracted JSON", e, jsonStr);
      return null;
    }
  };

  const processUserMessage = useCallback(async (content: string) => {
    if (!genAI) {
      addMessage('assistant', "Error: Gemini API Key not found. Please check your .env file.");
      return;
    }

    const currentMessages = [...state.messages, { id: Math.random().toString(36).substring(7), role: 'user' as const, content, timestamp: Date.now() }];

    setState((prev) => ({
        ...prev,
        messages: currentMessages,
        isTyping: true
    }));

    try {
      let prompt = "";
      let nextStep = state.step;
      let nextReqText = state.requirementText;

      const history = state.messages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const currentCircuitContext = JSON.stringify({ components, connections: edges, inputWaveform });

      if (state.step === 'idle') {
        nextStep = 'requirements';
        nextReqText = content;
        prompt = `User wants to: "${content}".
        Current circuit state: ${currentCircuitContext}.
        If they want to modify the existing circuit, acknowledge it.
        Ask clarifying questions to gather all necessary details for the electronic circuit design/modification (voltage magnitude, specific component values, goals).
        Keep the response concise and helpful.`;
      } else if (state.step === 'requirements') {
        nextStep = 'summary';
        nextReqText = state.requirementText + " " + content;
        prompt = `Based on these requirements: "${nextReqText}",
        summarize the circuit design/modification requirements clearly.
        Current circuit state: ${currentCircuitContext}.
        End by asking "Does this look correct? (Yes/No)"`;
      } else if (state.step === 'summary') {
        if (content.toLowerCase().includes('yes')) {
          nextStep = 'design';
          prompt = `Based on these requirements: "${state.requirementText}",
          design or modify the circuit.
          Current circuit state: ${currentCircuitContext}.
          
          WIRING GUIDELINES:
          - Ensure the circuit is ALWAYS CLOSED with NO OPEN ENDS. Every pin of every component must be connected to something.
          - MANDATORY: Every single component must have a valid electrical path to Ground. No isolated "islands" are allowed.
          - Strictly generate a NEAT circuit:
            - Align components to a 20px grid (X and Y must be multiples of 20).
            - Maintain a minimum spacing of 200px between components to avoid crowding.
            - Ensure wires (paths between components) do not pass THROUGH other components.
            - Use a grid-based layout. X increments by 200px, Y is constant for series components.
          - Rail layout: Positive rail at Y=100, Negative/Ground rail at Y=400.
          - WIRING PATTERNS:
            - SERIES: Connect Source(b) to Target(a). Example: [V1(a)->R1(a), R1(b)->R2(a), R2(b)->GND(a)].
            - PARALLEL: Connect BOTH components to the same two nodes. Example: [R1(a)->R2(a), R1(b)->R2(b)].
          - ROTATION RULES:
            - Components in horizontal paths (series): rotation 0 (for R, C, L, D).
            - Components in vertical paths (shunt to ground): rotation 1 or 3 (for R, C, L, D).
            - VoltageSource and Ground are VERTICAL by default at rotation 0.
          - Use handle 'a' for Input/Positive and 'b' for Output/Negative.
          - For Ground, use handle 'a'.
          - GROUND POLICY: 
            - Prefer a single Ground component.
            - If multiple Ground components are used for layout neatness, they MUST be connected together with wires to ensure they represent the same electrical node.

          Return ONLY a JSON object with the following structure:
          {
            "components": [
              { "id": "v1", "type": "VoltageSource", "label": "V1", "value": number, "unit": "V", "position": { "x": number, "y": number }, "rotation": 0 | 1 | 2 | 3 },
              ...
            ],
            "connections": [
              { "source": "v1", "sourceHandle": "a" | "b", "target": "d1", "targetHandle": "a" | "b" },
              ...
            ],
            "inputWaveform": { "type": "Sine" | "Square" | "Triangle" | "DC", "amplitude": number, "frequency": number, "offset": number, "phase": number },
            "explanation": "Brief explanation of the design/changes"
          }
          Ensure the circuit is electrically sound and connected to Ground. Use consistent IDs.
          VoltageSource handles: 'a' (+), 'b' (-).
          Resistor/Capacitor/Inductor handles: 'a', 'b'.
          Diode handles: 'a' (anode), 'b' (cathode).
          Ground handle: 'a'.`;
        } else {
          nextStep = 'requirements';
          nextReqText = "";
          addMessage('assistant', "Understood. Please provide the corrected requirements.");
          setState(prev => ({ ...prev, isTyping: false, step: 'requirements', requirementText: '' }));
          return;
        }
      }

      const response = await generateWithFallback(prompt, history);
      
      if (nextStep === 'design') {
        try {
          const design = extractJson(response);
          if (!design) {
            throw new Error("Could not find valid JSON in the model response.");
          }
          
          addMessage('assistant', `Design complete: ${design.explanation}\n\nValidating circuit topology...`);
          
          // 1. Validation Logic
          const tempComponents: Record<string, any> = {};
          design.components.forEach((c: any) => {
            tempComponents[c.id] = c;
          });

          const tempEdges = design.connections.map((c: any, i: number) => ({
            id: `e${i}`,
            source: c.source,
            sourceHandle: c.sourceHandle,
            target: c.target,
            targetHandle: c.targetHandle,
          }));

          const validation = validateCircuit([], tempEdges, tempComponents);

          if (!validation.isValid) {
            addMessage('assistant', `⚠️ Validation failed:\n${validation.errors.join('\n')}\n\nI will attempt to fix the design...`);
            
            // Re-prompt for fix
            const fixPrompt = `The previous design has errors: ${validation.errors.join(', ')}. 
            Please fix the design and return the corrected JSON. 
            Requirement: ${state.requirementText}`;
            const fixResponse = await generateWithFallback(fixPrompt, history);
            const fixedDesign = extractJson(fixResponse);
            
            if (!fixedDesign) {
                throw new Error("Could not find valid JSON in the fix response.");
            }
            
            // Re-validate fixed design
            const fixedComponents: Record<string, any> = {};
            fixedDesign.components.forEach((c: any) => fixedComponents[c.id] = c);
            const fixedEdges = fixedDesign.connections.map((c: any, i: number) => ({
                id: `e${i}`,
                source: c.source,
                sourceHandle: c.sourceHandle,
                target: c.target,
                targetHandle: c.targetHandle,
            }));
            const secondValidation = validateCircuit([], fixedEdges, fixedComponents);
            
            if (!secondValidation.isValid) {
                addMessage('assistant', "I'm still having trouble creating a valid circuit. Let's start over or try a simpler requirement.");
                setState(prev => ({ ...prev, isTyping: false, step: 'idle', requirementText: '' }));
                return;
            }
            
            // If valid, use fixed design
            design.components = fixedDesign.components;
            design.connections = fixedDesign.connections;
            design.inputWaveform = fixedDesign.inputWaveform;
          }

          addMessage('assistant', "Topology valid! Performing internal simulation check...");

          // 2. Simulation Verification (Theoretical)
          const verifyPrompt = `Analyze this circuit for verification: ${JSON.stringify(design)}.
          Does it meet the original requirement: "${state.requirementText}"?
          Briefly explain why or why not. If it works, end with 'VERIFICATION_SUCCESSFUL'. If it doesn't, explain why.`;
          
          const verificationResponse = await generateWithFallback(verifyPrompt);
          addMessage('assistant', verificationResponse);

          if (verificationResponse.includes('VERIFICATION_SUCCESSFUL')) {
            // Apply design to store
            setComponents(tempComponents);
            setNodes(design.components.map((c: any) => ({
                id: c.id,
                type: 'circuitComponent',
                position: c.position,
                data: c
            })));
            setEdges(design.connections.map((c: any, i: number) => ({
                id: `e${i}`,
                source: c.source,
                sourceHandle: c.sourceHandle,
                target: c.target,
                targetHandle: c.targetHandle,
                // Removed type: 'step' to use defaultEdgeOptions from CircuitCanvas
            })));
            setInputWaveform(design.inputWaveform);
            
            addMessage('assistant', "Circuit successfully updated in the playground.");
            setTimeout(() => runSimulation(), 500);
          } else {
             addMessage('assistant', "The simulation check failed. I'll need to rethink the design.");
          }

          // Reset to idle after design is processed
          nextStep = 'idle';
          nextReqText = '';

        } catch (e: any) {
          console.error("Circuit Design Error", e);
          addMessage('assistant', `I encountered an error while designing the circuit: ${e.message}. Let's try to refine the requirements.`);
          nextStep = 'idle';
          nextReqText = '';
        }
      } else {
        addMessage('assistant', response);
      }

      setState((prev) => ({
        ...prev,
        isTyping: false,
        step: nextStep,
        requirementText: nextReqText,
      }));


    } catch (error: any) {
      console.error("Gemini API Error:", error);
      addMessage('assistant', `Sorry, I'm having trouble connecting to my brain right now. Error: ${error.message || JSON.stringify(error)}`);
      setState((prev) => ({ ...prev, isTyping: false }));
    }
  }, [state, components, edges, inputWaveform, setNodes, setEdges, setComponents, setInputWaveform, runSimulation]);

  return {
    messages: state.messages,
    isTyping: state.isTyping,
    sendMessage: processUserMessage,
  };
};
