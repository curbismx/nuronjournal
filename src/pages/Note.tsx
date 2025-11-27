import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveform from '@/components/AudioWaveform';
import backIcon from '@/assets/back.png';
import pauseIcon from '@/assets/pause.png';
import recordMoreIcon from '@/assets/recordmore.png';
import stopIcon from '@/assets/stop.png';
import playIcon from '@/assets/play.png';
import imageButton2 from '@/assets/image-2.png';
import rewriteButton2 from '@/assets/rewrite-2.png';
import shareButton2 from '@/assets/share-2.png';
import recordMedium from '@/assets/record-medium.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

const Note = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLTextAreaElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcribedTextRef = useRef('');
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const autoStartHandledRef = useRef(false);

  const startRecording = async () => {
    // Prevent double-starting
    if (isRecordingRef.current) return;
    
    try {
      setIsRecording(true);
      isRecordingRef.current = true;
      isPausedRef.current = false;
      
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const destination = audioContextRef.current.createMediaStreamDestination();
      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      micSource.connect(destination);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      micSource.connect(analyserRef.current);
      
      streamRef.current = micStream;

      // Simple speech recognition without complex restart logic
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

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
              transcribedTextRef.current = newText;
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
          // Use refs to avoid stale closure
          if (recognitionRef.current === recognition && isRecordingRef.current && !isPausedRef.current) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                // Ignore
              }
            }, 100);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      }

      // Audio visualization
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecordingRef.current && !isPausedRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Media recording
      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(3000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      isPausedRef.current = true;
      setIsPaused(true);
      setHasBeenPaused(true);
      
      // Stop recognition completely
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      mediaRecorderRef.current.pause();
      setAudioLevel(0);
      setIsTranscribing(false);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      setTranscribedText((prev) => {
        const newText = prev.trim() ? prev.trim() + '\n\n' : prev;
        transcribedTextRef.current = newText;
        return newText;
      });
      mediaRecorderRef.current.resume();
      isPausedRef.current = false;
      setIsPaused(false);
      
      // Restart speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

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
              transcribedTextRef.current = newText;
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
          if (recognitionRef.current === recognition && isRecordingRef.current && !isPausedRef.current) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                // Ignore
              }
            }, 100);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      }
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    setIsRecording(false);
    setIsPaused(false);
    setHasBeenPaused(false);
    setIsTranscribing(false);
    setAudioLevel(0);
    setRecordingTime(0);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (transcribedTextRef.current && transcribedTextRef.current.trim().length > 10) {
      generateTitle(transcribedTextRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.currentTime = 0; // Start from beginning
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const generateTitle = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-title', {
        body: { text },
      });

      if (error) {
        console.error('Title generation error:', error);
        return;
      }

      if (data.title) {
        setNoteTitle(data.title);
      }
    } catch (error) {
      console.error('Title generation error:', error);
    }
  };

  const rewriteText = async () => {
    if (!transcribedText || transcribedText.trim().length === 0) {
      return;
    }

    setIsRewriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rewrite-text', {
        body: { text: transcribedText },
      });

      if (error) throw error;

      if (data.rewrittenText) {
        setTranscribedText(data.rewrittenText);
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setIsRewriting(false);
    }
  };


  useEffect(() => {
    transcribedTextRef.current = transcribedText;
  }, [transcribedText]);

  useEffect(() => {
    // Prevent autostart from running multiple times
    if (autoStartHandledRef.current) return;
    
    // Only auto-start if explicitly requested with autostart=true
    const shouldAutoStart = searchParams.get('autostart') === 'true';
    if (shouldAutoStart) {
      autoStartHandledRef.current = true;
      // Clear the URL parameter without navigating (prevents race condition)
      window.history.replaceState({}, '', '/note');
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        startRecording();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Store audioUrl in a ref for cleanup
    const urlToCleanup = audioUrl;
    
    return () => {
      // Clean up blob URL when it changes or on unmount
      if (urlToCleanup) {
        URL.revokeObjectURL(urlToCleanup);
      }
    };
  }, [audioUrl]);

  // Separate cleanup for recording on unmount only
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
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

  // Auto-scroll to bottom only when final text is added (not interim)
  useEffect(() => {
    if (scrollContainerRef.current && !isRecording) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcribedText, isRecording]);

  const handleBack = () => {
    stopRecording();
    navigate('/');
  };

  const today = new Date();
  const dayNumber = today.getDate();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="fixed inset-0 flex flex-col bg-journal-header overflow-hidden">
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pr-4 pb-[30px] h-[150px] z-30">
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
        <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px] mt-[46px]">
          {monthYear}
        </h1>
      </header>

      {/* Scrollable content area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
      >
        <div style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* Date and weather */}
          <div className="px-8 pt-8 pb-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">{dayNumber}</div>
            <div className="flex flex-col">
              <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">{dayName}</div>
              {weather && (
                <div className="flex items-center gap-1.5 mt-1">
                  <weather.WeatherIcon size={20} className="text-[hsl(60,1%,66%)]" />
                  <span className="text-[16px] font-outfit font-light text-[hsl(60,1%,66%)]">{weather.temp}°C</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value || 'Note Title')}
            disabled={isRecording}
            className="text-[28px] font-outfit font-semibold text-[hsl(0,0%,25%)] outline-none bg-transparent border-none w-full disabled:opacity-100 mb-4 focus:outline-none focus:ring-0"
            placeholder="Note Title"
          />
        </div>

        {/* Body text */}
        <div className="px-8">
          <textarea
            ref={textContentRef}
            value={transcribedText}
            onChange={(e) => {
              setTranscribedText(e.target.value);
              transcribedTextRef.current = e.target.value;
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="Start speaking to transcribe..."
            className="w-full resize-none bg-transparent border-none outline-none text-[18px] font-outfit leading-relaxed text-[hsl(0,0%,25%)] placeholder:text-[hsl(0,0%,60%)] focus:outline-none focus:ring-0 overflow-hidden"
            style={{ minHeight: '100px' }}
            readOnly={isRecording}
          />
          {interimText && isRecording && (
            <span className="text-[18px] font-outfit leading-relaxed text-[hsl(0,0%,60%)] italic">
              {interimText}
            </span>
          )}
        </div>
        
        {/* Spacer to prevent content from being hidden behind bottom controls */}
        <div className="h-[160px] flex-shrink-0" />
        <div className="h-[1px]" />
        </div>
      </div>

      {/* Fixed bottom controls */}
      {isRecording ? (
        <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 w-[calc(100%-60px)] max-w-[600px] z-40">
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
                    onClick={togglePlayback}
                    className="hover:bg-white/10 p-0 h-auto w-auto"
                  >
                    <img src={isPlaying ? pauseIcon : playIcon} alt={isPlaying ? "Pause" : "Play"} className="w-[40px] h-[40px]" />
                  </Button>
                  <span className="absolute top-[45px] left-1/2 -translate-x-1/2 text-white font-outfit text-[12px] font-light whitespace-nowrap">{isPlaying ? "PAUSE" : "PLAY"}</span>
                </div>
              </div>

              <div className="flex-1 h-[60px] ml-6 min-w-0">
                <AudioWaveform isRecording={isRecording && !isPaused} audioLevel={audioLevel} recordingTime={recordingTime} hasBeenPaused={hasBeenPaused} />
              </div>

              <div className="text-white font-outfit text-[16px] font-light flex-shrink-0 ml-4">
                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-[30px] left-[30px] right-[30px] z-40 flex justify-between items-center gap-[10px]">
          <button className="flex flex-col items-center gap-2">
            <img src={imageButton2} alt="Image" className="h-auto" />
          </button>
          <button 
            onClick={rewriteText}
            disabled={isRewriting}
            className="flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <img src={rewriteButton2} alt="Rewrite" className="h-auto" />
          </button>
          <button className="flex flex-col items-center gap-2">
            <img src={shareButton2} alt="Share" className="h-auto" />
          </button>
          <button 
            onClick={startRecording} 
            className="flex flex-col items-center gap-2"
          >
            <img 
              src={recordMedium} 
              alt="Record" 
              className="h-auto" 
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default Note;
