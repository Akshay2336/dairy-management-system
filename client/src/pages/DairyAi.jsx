import { useRef, useState } from "react";
import {
  Bot,
  Mic,
  Send,
  Volume2,
  LoaderCircle,
  Square,
  Sparkles,
  Trash2,
  User,
  Lightbulb,
} from "lucide-react";

import API from "../api/axios";

function DairyAI() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const answerRef = useRef(null);

  // =====================================
  // START RECORDING
  // =====================================
  const startRecording = async () => {
    try {
      if (loading) return;

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setAnswer(
          "Your browser does not support microphone access."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      // =====================================
      // AUDIO DATA
      // =====================================
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // =====================================
      // RECORDING STOPPED
      // =====================================
      recorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: recorder.mimeType || "audio/webm",
          }
        );

        console.log("🎤 Audio recorded");
        console.log("🎤 MIME:", audioBlob.type);
        console.log("🎤 Size:", audioBlob.size);

        // Stop microphone
        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          streamRef.current = null;
        }

        // =====================================
        // CHECK EMPTY RECORDING
        // =====================================
        if (audioBlob.size < 3000) {
          console.log("⚠️ Recording too small");

          setAnswer(
            "I didn't hear anything. Please speak your question and try again."
          );

          setRecording(false);
          return;
        }

        // Send valid audio
        await sendVoiceToAI(audioBlob);
      };

      recorder.onerror = (event) => {
        console.error(
          "❌ Recorder error:",
          event
        );

        setRecording(false);

        setAnswer(
          "There was a problem recording your voice."
        );
      };

      // Start recording
      recorder.start();

      setRecording(true);
      setAnswer("");

      console.log("🎙️ Recording started");
    } catch (error) {
      console.error(
        "❌ Microphone error:",
        error
      );

      setRecording(false);

      if (
        error.name === "NotAllowedError"
      ) {
        setAnswer(
          "Microphone permission was denied. Please allow microphone access in your browser."
        );
      } else {
        setAnswer(
          "Could not access microphone. Please check your microphone and try again."
        );
      }
    }
  };

  // =====================================
  // STOP RECORDING
  // =====================================
  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();

      setRecording(false);

      console.log("🛑 Recording stopped");
    }
  };

  // =====================================
  // BLOB → BASE64
  // =====================================
  const blobToBase64 = (blob) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onloadend = () => {
          const result =
            reader.result;

          const base64 =
            result.split(",")[1];

          resolve(base64);
        };

        reader.onerror = reject;

        reader.readAsDataURL(blob);
      }
    );
  };

  // =====================================
  // SEND VOICE TO AI
  // =====================================
  const sendVoiceToAI = async (
    audioBlob
  ) => {
    try {
      setLoading(true);
      setAnswer("");

      const token =
        localStorage.getItem(
          "token"
        );

      console.log(
        "🔑 Voice Token:",
        token
          ? "Found"
          : "Not found"
      );

      if (!token) {
        setAnswer(
          "Please login again. Authentication token not found."
        );

        return;
      }

      const base64Audio =
        await blobToBase64(
          audioBlob
        );

      console.log(
        "🎤 Sending voice to live backend..."
      );

      const response =
        await API.post(
          "/ai/voice",
          {
            audio: base64Audio,
            mimeType:
              audioBlob.type,
          }
        );

      console.log(
        "🤖 Voice AI Response:",
        response.data
      );

      if (
        response.data?.answer
      ) {
        setAnswer(
          response.data.answer
        );

        scrollToAnswer();
      } else {
        setAnswer(
          "I couldn't understand the voice question."
        );
      }
    } catch (error) {
      console.error(
        "❌ Voice AI Error:",
        error
      );

      console.error(
        "Response:",
        error.response?.data
      );

      setAnswer(
        error.response?.data
          ?.message ||
          "Sorry, I couldn't understand the voice question."
      );

      scrollToAnswer();
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // TEXT AI
  // =====================================
  const askAI = async (
    text = question
  ) => {
    const trimmedQuestion =
      text.trim();

    if (
      !trimmedQuestion ||
      loading ||
      recording
    ) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const token =
        localStorage.getItem(
          "token"
        );

      console.log(
        "🔑 Text Token:",
        token
          ? "Found"
          : "Not found"
      );

      console.log(
        "❓ Question:",
        trimmedQuestion
      );

      if (!token) {
        setAnswer(
          "Please login again. Authentication token not found."
        );

        return;
      }

      console.log(
        "🌐 Sending text to live backend..."
      );

      const response =
        await API.post(
          "/ai/chat",
          {
            question:
              trimmedQuestion,
          }
        );

      console.log(
        "🤖 AI Response:",
        response.data
      );

      if (
        response.data?.answer
      ) {
        setAnswer(
          response.data.answer
        );
      } else {
        setAnswer(
          "AI did not return an answer."
        );
      }

      setQuestion("");

      scrollToAnswer();
    } catch (error) {
      console.error(
        "❌ AI Error:",
        error
      );

      console.error(
        "Response:",
        error.response?.data
      );

      if (
        error.response?.status ===
        401
      ) {
        setAnswer(
          "Your login session has expired. Please login again."
        );
      } else {
        setAnswer(
          error.response?.data
            ?.message ||
            "Sorry, I couldn't get an answer."
        );
      }

      scrollToAnswer();
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // ENTER TO ASK AI
  // SHIFT + ENTER = NEW LINE
  // =====================================
  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      askAI();
    }
  };

  // =====================================
  // SCROLL TO ANSWER
  // =====================================
  const scrollToAnswer = () => {
    setTimeout(() => {
      answerRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "nearest",
        }
      );
    }, 100);
  };

  // =====================================
  // SUGGESTED QUESTION
  // =====================================
  const askSuggestion = (
    text
  ) => {
    if (loading) return;

    setQuestion(text);

    askAI(text);
  };

  // =====================================
  // CLEAR CHAT
  // =====================================
  const clearChat = () => {
    setQuestion("");
    setAnswer("");

    window.speechSynthesis.cancel();
  };

  // =====================================
  // SPEAK ANSWER
  // =====================================
  const speakAnswer = () => {
    if (!answer) return;

    const speech =
      new SpeechSynthesisUtterance(
        answer
      );

    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
      speech
    );
  };

  // =====================================
  // SUGGESTIONS
  // =====================================
  const suggestions = [
    "How much milk did Rahul take?",
    "Who are my customers?",
    "How much milk did Rahul take this month?",
    "Show Rahul's milk history",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 md:px-8">

      <div className="mx-auto max-w-4xl">

        {/* ================= HEADER ================= */}

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="relative">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">

                <Sparkles size={28} />

              </div>

              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />

            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                  Dairy AI
                </h1>

                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Your intelligent dairy business assistant
              </p>

            </div>

          </div>

          {(question ||
            answer) && (

            <button
              type="button"
              onClick={
                clearChat
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-red-600"
            >

              <Trash2
                size={17}
              />

              <span className="hidden sm:inline">
                Clear
              </span>

            </button>

          )}

        </div>

        {/* ================= AI CARD ================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

          {/* ================= CHAT AREA ================= */}

          <div className="min-h-[430px] p-5 md:p-8">

            {!question &&
            !answer &&
            !loading ? (

              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">

                  <Bot size={42} />

                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  How can I help you?
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Ask me about your customers,
                  milk entries, milk consumption,
                  and other dairy business
                  information.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">

                  <Lightbulb
                    size={15}
                  />

                  Try one of the questions below

                </div>

                <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">

                  {suggestions.map(
                    (item) => (

                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          askSuggestion(
                            item
                          )
                        }
                        disabled={
                          loading
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {item}
                      </button>

                    )
                  )}

                </div>

              </div>

            ) : (

              <div className="space-y-6">

                {/* USER QUESTION */}

                {question && (

                  <div className="flex justify-end gap-3">

                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                      {question}
                    </div>

                    <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 sm:flex">

                      <User
                        size={18}
                      />

                    </div>

                  </div>

                )}

                {/* THINKING */}

                {loading && (

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">

                      <Bot
                        size={19}
                      />

                    </div>

                    <div className="rounded-2xl rounded-tl-md bg-slate-100 px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-slate-500">

                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />

                        Thinking...

                      </div>

                    </div>

                  </div>

                )}

                {/* AI ANSWER */}

                {answer &&
                  !loading && (

                    <div
                      ref={
                        answerRef
                      }
                      className="flex items-start gap-3"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">

                        <Bot
                          size={19}
                        />

                      </div>

                      <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-5 py-4">

                        <div className="mb-2 flex items-center justify-between gap-4">

                          <span className="text-sm font-semibold text-slate-800">
                            Dairy AI
                          </span>

                          <button
                            type="button"
                            onClick={
                              speakAnswer
                            }
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-blue-600"
                            title="Read answer aloud"
                          >

                            <Volume2
                              size={
                                18
                              }
                            />

                          </button>

                        </div>

                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                          {answer}
                        </p>

                      </div>

                    </div>

                  )}

              </div>

            )}

          </div>

          {/* ================= INPUT ================= */}

          <div className="border-t border-slate-200 bg-slate-50/80 p-4 md:p-5">

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Ask your dairy assistant..."
                rows={2}
                disabled={
                  loading ||
                  recording
                }
                className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex items-center justify-between px-2 pb-1">

                <span className="hidden text-xs text-slate-400 sm:block">
                  Press Enter to ask • Shift + Enter for new line
                </span>

                <div className="ml-auto flex items-center gap-2">

                  {/* VOICE */}

                  {!recording ? (

                    <button
                      type="button"
                      onClick={
                        startRecording
                      }
                      disabled={
                        loading
                      }
                      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Ask with voice"
                    >

                      <Mic
                        size={
                          19
                        }
                      />

                      <span className="hidden sm:inline">
                        Speak
                      </span>

                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={
                        stopRecording
                      }
                      className="flex h-10 items-center gap-2 rounded-xl bg-red-500 px-3 text-white shadow-sm transition hover:bg-red-600"
                      title="Stop recording"
                    >

                      <Square
                        size={
                          17
                        }
                      />

                      <span>
                        Stop
                      </span>

                    </button>

                  )}

                  {/* SEND */}

                  <button
                    type="button"
                    onClick={() =>
                      askAI()
                    }
                    disabled={
                      loading ||
                      !question.trim() ||
                      recording
                    }
                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Ask AI"
                  >

                    {loading ? (

                      <LoaderCircle
                        size={
                          18
                        }
                        className="animate-spin"
                      />

                    ) : (

                      <Send
                        size={
                          18
                        }
                      />

                    )}

                    <span className="hidden sm:inline">
                      {loading
                        ? "Thinking"
                        : "Ask AI"}
                    </span>

                  </button>

                </div>

              </div>

            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">

              <Bot
                size={14}
              />

              AI answers are based on your available dairy data

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default DairyAI;