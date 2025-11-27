import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveform from '@/components/AudioWaveform';
import backIcon from '@/assets/back.png';
import pauseIcon from '@/assets/pause.png';
import recordMoreIcon from '@/assets/recordmore.png';
import stopIcon from '@/assets/stop.png';
import playIcon from '@/assets/play.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

const Note = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [noteTitle, setNoteTitle] = useState('Note Title');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      // Request microphone first
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to get system audio (optional)
      let systemAudioTrack: MediaStreamTrack | null = null;
      try {
        const systemStream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: true,
          video: {
            width: 1,
            height: 1,
            frameRate: 1
          }
        });
        
        systemAudioTrack = systemStream.getAudioTracks()[0];
        
        // Stop video track immediately as we don't need it
        systemStream.getVideoTracks().forEach(track => track.stop());
      } catch (displayError) {
        console.log('System audio not available, using microphone only:', displayError);
      }
      
      // Create audio context to merge streams
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const audioContext = audioContextRef.current;
      
      // Create destination to merge audio
      const destination = audioContext.createMediaStreamDestination();
      
      // Always connect microphone
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
      
      // Set up audio analysis for visualization
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      micSource.connect(analyserRef.current);
      
      // Connect system audio if available
      if (systemAudioTrack) {
        const systemSource = audioContext.createMediaStreamSource(
          new MediaStream([systemAudioTrack])
        );
        systemSource.connect(destination);
        systemSource.connect(analyserRef.current);
        
        // Store both tracks
        streamRef.current = new MediaStream([
          ...micStream.getTracks(),
          systemAudioTrack
        ]);
        
        toast({ title: 'Recording started', description: 'Capturing microphone and system audio' });
      } else {
        // Store only microphone track
        streamRef.current = micStream;
        toast({ title: 'Recording started', description: 'Capturing microphone audio only' });
      }

      // Set up Web Speech API for transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript;
              setTranscribedText((prev) => prev + transcript + ' ');
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setIsTranscribing(false);
            toast({ 
              title: 'Transcription error', 
              description: event.error, 
              variant: 'destructive' 
            });
          }
        };

        recognition.onend = () => {
          // Restart if still recording
          if (isRecording && !isPaused) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      } else {
        toast({ 
          title: 'Speech recognition unavailable', 
          description: 'Your browser does not support speech recognition',
          variant: 'destructive'
        });
      }

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

      // Use the merged stream for recording (in case we want to save the audio later)
      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(3000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ 
        title: 'Recording failed', 
        description: error instanceof Error ? error.message : 'Failed to access audio devices',
        variant: 'destructive'
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsPaused(true);
      setAudioLevel(0);
      setIsTranscribing(false);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      // Add a line break before resuming transcription
      setTranscribedText((prev) => prev ? prev + '\n\n' : prev);
      
      mediaRecorderRef.current.resume();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsTranscribing(true);
        } catch (e) {
          console.log('Failed to resume recognition:', e);
        }
      }
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      setRecordingTime(0);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Generate title from the full transcribed text after stopping
    if (transcribedText && transcribedText.trim().length > 10) {
      generateTitle(transcribedText);
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
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    // Fetch weather data
    const fetchWeather = async () => {
      try {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Fetch weather from Open-Meteo (free, no API key)
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`
            );
            const data = await response.json();
            
            // Map weather codes to Lucide icons
            const weatherCode = data.current.weather_code;
            let WeatherIcon = Sun; // default sunny
            
            if (weatherCode >= 61 && weatherCode <= 67) WeatherIcon = CloudRain; // rain
            else if (weatherCode >= 71 && weatherCode <= 77) WeatherIcon = CloudSnow; // snow
            else if (weatherCode >= 80 && weatherCode <= 82) WeatherIcon = CloudRain; // showers
            else if (weatherCode >= 51 && weatherCode <= 57) WeatherIcon = CloudDrizzle; // drizzle
            else if (weatherCode >= 2 && weatherCode <= 3) WeatherIcon = Cloud; // partly cloudy
            else if (weatherCode === 45 || weatherCode === 48) WeatherIcon = CloudFog; // fog
            else if (weatherCode >= 95) WeatherIcon = CloudLightning; // thunderstorm
            
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              WeatherIcon
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
          }
        );
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };
    
    fetchWeather();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

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
      <header className="bg-journal-header pl-[30px] pt-[50px] pr-4 pb-[30px] flex flex-col h-[170px]">
        <div className="flex items-center justify-between mb-auto">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-0 h-auto w-auto"
          >
            <img src={backIcon} alt="Back" className="w-[30px] h-[30px]" />
          </Button>
          <div className="flex-1" />
        </div>
        
        <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
          {monthYear}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 bg-journal-content rounded-t-[30px] -mt-0 px-8 pt-8 pb-32">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(0,0%,0%)]">{dayNumber}</div>
          <div className="flex flex-col">
            <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(0,0%,0%)] mt-[2px]">{dayName}</div>
            {weather && (
              <div className="flex items-center gap-1.5 mt-1">
                <weather.WeatherIcon size={20} className="text-[hsl(0,0%,0%)]" />
                <span className="text-[16px] font-outfit font-light text-[hsl(0,0%,0%)]">{weather.temp}°C</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-[28px] font-outfit font-semibold mb-4 text-[hsl(0,0%,0%)] -mt-2">{noteTitle}</h2>

        <div className="text-[18px] font-outfit leading-relaxed text-[hsl(0,0%,0%)] -mt-[5px]">
          {transcribedText || 'Start speaking to transcribe...'}
        </div>
      </main>

      {/* Recording Control */}
      {!isRecording ? (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <Button
            onClick={startRecording}
            className="bg-[hsl(4,73%,62%)] hover:bg-[hsl(4,73%,52%)] text-white rounded-[20px] px-8 py-6 text-[18px] font-outfit"
          >
            Start Recording
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-64px)] max-w-[600px]">
          <div className="bg-[hsl(4,73%,62%)] rounded-[20px] p-6 flex items-center gap-4 h-[108px]">
            {!isPaused ? (
              <>
                <Button
                  variant="ghost"
                  onClick={pauseRecording}
                  className="hover:bg-white/10 p-0 h-auto w-auto flex-shrink-0"
                >
                  <img src={pauseIcon} alt="Pause" className="w-[40px] h-[40px]" />
                </Button>
                
                <div className="flex-1 h-[60px]">
                  <AudioWaveform isRecording={isRecording && !isPaused} audioLevel={audioLevel} recordingTime={recordingTime} />
                </div>

                <div className="text-white font-outfit text-[16px] font-light flex-shrink-0">
                  {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-[10px]">
                <Button
                  variant="ghost"
                  onClick={resumeRecording}
                  className="hover:bg-white/10 p-0 h-auto w-auto"
                >
                  <img src={recordMoreIcon} alt="Record More" className="w-[40px] h-[40px]" />
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={stopRecording}
                  className="hover:bg-white/10 p-0 h-auto w-auto"
                >
                  <img src={stopIcon} alt="Stop" className="w-[40px] h-[40px]" />
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={resumeRecording}
                  className="hover:bg-white/10 p-0 h-auto w-auto"
                >
                  <img src={playIcon} alt="Play" className="w-[40px] h-[40px]" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Note;
