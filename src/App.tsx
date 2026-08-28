import { Pitch } from './ui/Pitch.tsx';
import { samplePlay } from './ui/samplePlay.ts';

export default function App() {
  return <Pitch play={samplePlay} />;
}
