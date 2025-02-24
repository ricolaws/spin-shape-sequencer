'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
        RNBO: any;
    }
}

// Define a type for our parameters
interface Parameter {
    id: string;
    name: string;
    min: number;
    max: number;
    steps: number;
    value: number;
}

const RNBODevice = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const deviceRef = useRef<any>(null);
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [, setIsLoaded] = useState(false);

    useEffect(() => {
        async function setup() {
            try {
                const WAContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new WAContext();

                const outputNode = audioContextRef.current.createGain();
                outputNode.connect(audioContextRef.current.destination);

                const response = await fetch("/spinShapeSeq.export.json");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const patcher = await response.json();

                if (!window.RNBO) {
                    await loadRNBOScript(patcher.desc.meta.rnboversion);
                }

                const device = await window.RNBO.createDevice({
                    context: audioContextRef.current,
                    patcher
                });

                deviceRef.current = device;
                device.node.connect(outputNode);

                // Get parameters from device
                setParameters(device.parameters);
                setIsLoaded(true);

                // Enable audio context on user interaction
                document.body.onclick = () => {
                    audioContextRef.current?.resume();
                }

                console.log('RNBO device setup complete');

            } catch (err) {
                console.error('Error in RNBO setup:', err);
            }
        }

        setup();

        return () => {
            if (deviceRef.current) {
                deviceRef.current.node.disconnect();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleParameterChange = (paramId: string, value: number) => {
        if (!deviceRef.current) return;
        
        // Find the parameter and update its value
        const param = deviceRef.current.parameters.find((p: Parameter) => p.id === paramId);
        if (param) {
            param.value = value;
        }
    };

    return (
        <div>
            <h1>RNBO Device</h1>
            <p>Click anywhere to start audio</p>
            
            <div id="rnbo-console">
                <div id="rnbo-parameter-sliders">
                    <h2>Parameters</h2>
                    {parameters.length === 0 ? (
                        <em id="no-param-label">No parameters</em>
                    ) : (
                        parameters.map((param) => (
                            <div key={param.id} className="parameter-container">
                                <label>{param.name}: </label>
                                <input
                                    type="range"
                                    min={param.min}
                                    max={param.max}
                                    step={param.steps > 1 ? (param.max - param.min) / (param.steps - 1) : 0.001}
                                    defaultValue={param.value}
                                    onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
                                />
                                <input
                                    type="number"
                                    value={param.value}
                                    onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
                                    min={param.min}
                                    max={param.max}
                                    step={param.steps > 1 ? (param.max - param.min) / (param.steps - 1) : 0.001}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

function loadRNBOScript(version: string) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
        }
        const el = document.createElement("script");
        el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + 
                 encodeURIComponent(version) + "/rnbo.min.js";
        el.onload = resolve;
        el.onerror = (err) => {
            console.log(err);
            reject(new Error("Failed to load rnbo.js v" + version));
        };
        document.body.append(el);
    });
}

export default RNBODevice;