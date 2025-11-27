import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveform from '@/components/AudioWaveform';
import backIcon from '@/assets/back.png';
import pauseIcon from '@/assets/pause.png';

const Note = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [noteTitle, setNoteTitle] = useState('Note Title');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start visualizing audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording && !isPaused) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(3000); // Collect data every 3 seconds
      setIsRecording(true);

      toast({
        title: 'Recording started',
        description: 'Speak clearly for best transcription results',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setAudioLevel(0);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data.text) {
          setTranscribedText(prev => prev + ' ' + data.text);
          
          // Generate title if this is the first transcription
          if (!transcribedText && data.text.length > 20) {
            generateTitle(data.text);
          }
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: 'Could not transcribe audio',
        variant: 'destructive',
      });
    }
  };

  const generateTitle = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-title', {
        body: { text },
      });

      if (error) throw error;

      if (data.title) {
        setNoteTitle(data.title);
      }
    } catch (error) {
      console.error('Title generation error:', error);
    }
  };

  useEffect(() => {
    startRecording();

    return () => {
      stopRecording();
    };
  }, []);

  const handleBack = () => {
    stopRecording();
    navigate('/');
  };

  const today = new Date();
  const dayNumber = today.getDate();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-journal-header pl-[30px] pt-[50px] pr-[30px] pb-[30px] flex items-start justify-between h-[150px]">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-0 h-auto w-auto"
        >
          <img src={backIcon} alt="Back" className="w-[40px] h-[40px]" />
        </Button>
        <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider flex-1 text-center mr-[40px]">
          {monthYear}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 bg-journal-content px-8 pt-8 pb-32">
        <div className="flex items-baseline gap-4 mb-6">
          <div className="text-[72px] font-outfit font-light leading-none">{dayNumber}</div>
          <div className="text-[18px] font-outfit font-light tracking-wide">{dayName}</div>
        </div>

        <h2 className="text-[20px] font-outfit font-semibold mb-4">{noteTitle}</h2>

        <div className="text-[16px] font-outfit leading-relaxed text-foreground/90">
          {transcribedText || 'Start speaking to transcribe...'}
        </div>
      </main>

      {/* Recording Control */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-64px)] max-w-[600px]">
        <div className="bg-[hsl(4,73%,62%)] rounded-[20px] p-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="hover:bg-white/10 p-0 h-auto w-auto flex-shrink-0"
          >
            <img src={pauseIcon} alt="Pause" className="w-[40px] h-[40px]" />
          </Button>
          
          <div className="flex-1 h-[60px]">
            <AudioWaveform isRecording={isRecording && !isPaused} audioLevel={audioLevel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Note;
