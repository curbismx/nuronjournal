import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveform from '@/components/AudioWaveform';
import backIcon from '@/assets/back.png';
import pauseIcon from '@/assets/pause.png';
import recordMoreIcon from '@/assets/recordmore.png';
import stopIcon from '@/assets/stop.png';
import playIcon from '@/assets/play.png';
import imageButton from '@/assets/image-button.png';
import rewriteButton from '@/assets/rewrite-button.png';
import shareButton from '@/assets/share-button.png';
import recordButton from '@/assets/record-button.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

const Note = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasBeenPaused, setHasBeenPaused] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [interimText, setInterimText] = useState('');
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
      // Request microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const audioContext = audioContextRef.current;
      
      // Create destination to handle audio
      const destination = audioContext.createMediaStreamDestination();
      
      // Connect microphone
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
      
      // Set up audio analysis for visualization
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      micSource.connect(analyserRef.current);
      
      // Store microphone track
      streamRef.current = micStream;

      // Set up Web Speech API for transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Enable real-time transcription
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          
          if (final) {
            setTranscribedText((prev) => {
              const newText = prev + final;
              // Generate title when we have enough text (first 10+ words)
              if (newText.trim().split(/\s+/).length >= 10 && noteTitle === 'Note Title') {
                generateTitle(newText);
              }
              return newText;
            });
            setInterimText('');
          } else {
            setInterimText(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          // Only restart if recording and not paused (with a small delay to check state)
          setTimeout(() => {
            if (recognitionRef.current && !isPaused && isRecording) {
              try {
                recognition.start();
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }
          }, 100);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
          setIsTranscribing(true);
        } catch (e) {
          console.error('Failed to start recognition:', e);
        }
      } else {
        console.log('Speech recognition unavailable');
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

      // Use the stream for recording
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
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Immediately stop recognition and capture any interim text
      if (recognitionRef.current) {
        // Force any interim text to become final
        setTranscribedText(prev => prev + (interimText ? ' ' + interimText : ''));
        setInterimText('');
        recognitionRef.current.stop();
      }
      
      // Then pause recording and update states
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setHasBeenPaused(true);
      setAudioLevel(0);
      setIsTranscribing(false);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      // Add line break before resuming
      setTranscribedText((prev) => prev.trim() ? prev.trim() + '\n\n' : prev);
      
      // Resume media recorder
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Restart speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsTranscribing(true);
        } catch (e) {
          console.log('Failed to resume recognition:', e);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setHasBeenPaused(false);
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
      // Cleanup when component unmounts
      if (isRecording) {
        stopRecording();
      }
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
          {transcribedText || (isRecording ? '' : 'Start speaking to transcribe...')}
          {interimText && <span className="opacity-60">{interimText}</span>}
        </div>
      </main>

      {/* Recording Control */}
      {!isRecording ? (
        <div className="fixed bottom-[30px] left-0 right-0 flex justify-between items-center px-[30px]">
          <button className="flex flex-col items-center gap-2">
            <img src={imageButton} alt="Image" className="w-auto h-[60px]" />
          </button>
          <button className="flex flex-col items-center gap-2">
            <img src={rewriteButton} alt="Rewrite" className="w-auto h-[60px]" />
          </button>
          <button className="flex flex-col items-center gap-2">
            <img src={shareButton} alt="Share" className="w-auto h-[60px]" />
          </button>
          <button onClick={startRecording} className="flex flex-col items-center gap-2">
            <img src={recordButton} alt="Record" className="w-auto h-[60px]" />
          </button>
        </div>
      ) : (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-64px)] max-w-[600px]">
          <div className="bg-[hsl(4,73%,62%)] rounded-[20px] p-6 h-[108px]">
            <div className="flex items-center gap-4 h-full relative">
              <div className="flex items-center gap-[30px]">
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="hover:bg-white/10 p-0 h-auto w-auto"
                  >
                    <img src={isPaused ? recordMoreIcon : pauseIcon} alt={isPaused ? "Record More" : "Pause"} className="w-[40px] h-[40px]" />
                  </Button>
                  <span className="absolute top-[45px] left-1/2 -translate-x-1/2 text-white font-outfit text-[12px] font-light whitespace-nowrap">
                    {isPaused ? "REC" : "PAUSE"}
                  </span>
                </div>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={stopRecording}
                    className="hover:bg-white/10 p-0 h-auto w-auto"
                  >
                    <img src={stopIcon} alt="Stop" className="w-[40px] h-[40px]" />
                  </Button>
                  <span className="absolute top-[45px] left-1/2 -translate-x-1/2 text-white font-outfit text-[12px] font-light whitespace-nowrap">STOP</span>
                </div>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={resumeRecording}
                    className="hover:bg-white/10 p-0 h-auto w-auto"
                  >
                    <img src={playIcon} alt="Play" className="w-[40px] h-[40px]" />
                  </Button>
                  <span className="absolute top-[45px] left-1/2 -translate-x-1/2 text-white font-outfit text-[12px] font-light whitespace-nowrap">PLAY</span>
                </div>
              </div>

              <div className="flex-1 h-[60px] ml-6 min-w-0">
                <AudioWaveform isRecording={isRecording && !isPaused} audioLevel={audioLevel} recordingTime={recordingTime} />
              </div>

              <div className="text-white font-outfit text-[16px] font-light flex-shrink-0 ml-4">
                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Note;
