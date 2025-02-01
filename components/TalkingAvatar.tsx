import { useEffect, useRef, useState, useCallback } from "react";

const TalkingAvatar = ({ script }: { script: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [talkStreamId, setTalkStreamId] = useState<string | null>(null);
  const apiKey = "ZGFua2hpbWFuc2h1QGdtYWlsLmNvbQ:3hYLN1A_zbCVMMyF-93VT"; // Replace with your D-ID API key
  const imageUrl =
    "https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg?semt=ais_hybrid"; // Replace with the URL to your avatar image

  // Store the previous scripts and their talk stream IDs to avoid duplicate API calls
  const scriptsCache = useRef<{ [key: string]: string }>({});

  const createTalkStream = useCallback(async () => {
    try {
      // Check if the script has already been processed
      if (scriptsCache.current[script]) {
        console.log("Script already processed:", script);
        setTalkStreamId(scriptsCache.current[script]); // Use the cached talkStreamId
        return;
      }

      // Step 1: Create a new talk stream only if script is not empty
      if (!script || script.length < 3) {
        throw new Error("Input text must be at least 3 characters long.");
      }

      const response = await fetch("https://api.d-id.com/talks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(apiKey + ":")}`,
        },
        body: JSON.stringify({
          source_url: imageUrl,
          script: {
            type: "text",
            input: script,
            provider: { type: "google" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create talk stream");
      }

      const { id } = await response.json();
      setTalkStreamId(id); // Store the talk stream ID to trigger the next steps

      // Cache the script and its talkStreamId
      scriptsCache.current[script] = id;
    } catch (error) {
      console.error("Error creating talk stream:", error);
    }
  }, [script]);

  useEffect(() => {
    if (talkStreamId) {
      const startWebRTCConnection = async () => {
        try {
          const offerResponse = await fetch(
            `https://api.d-id.com/talks/${talkStreamId}/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${btoa(apiKey + ":")}`,
              },
            }
          );

          if (!offerResponse.ok) {
            throw new Error("Failed to start WebRTC connection");
          }

          const { sdp } = await offerResponse.json();

          // Create a new RTC connection and handle the SDP offer
          const pc = new RTCPeerConnection();

          // Set the remote description (SDP offer) from the response
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));

          // Handle ICE candidate gathering (if necessary)
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              // Send candidate to the server if needed
              console.log('ICE Candidate: ', event.candidate);
            }
          };

          // Play the video stream when it's available
          pc.ontrack = (event) => {
            const stream = event.streams[0]; // Assuming a single stream (audio/video)
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          };

          // Once the connection is set up, display the video
          const offer = await pc.createAnswer();
          await pc.setLocalDescription(offer);
        } catch (error) {
          console.error("Error starting WebRTC connection:", error);
        }
      };

      startWebRTCConnection();
    }
  }, [talkStreamId]); // Only run this effect when the talk stream ID is available

  useEffect(() => {
    createTalkStream();
  }, [script, createTalkStream]); // Only recreate the talk stream when the script changes

  return <video ref={videoRef} controls />;
};

export default TalkingAvatar;
