import 'package:flutter/material.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import 'package:google_mlkit_language_id/google_mlkit_language_id.dart';
import 'package:translator/translator.dart';

void main() {
  runApp(const ProximityVoiceApp());
}

class ProximityVoiceApp extends StatelessWidget {
  const ProximityVoiceApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late WebSocketChannel channel;
  final List<String> messages = [];
  final TextEditingController messageController = TextEditingController();
  stt.SpeechToText speechToText = stt.SpeechToText();
  FlutterTts flutterTts = FlutterTts();
  final languageIdentifier = LanguageIdentifier(confidenceThreshold: 0.5);
  final translator = GoogleTranslator();

  bool isListening = false;
  String selectedLanguage = 'en'; // Default language

  final Map<String, String> languageMap = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Hindi': 'hi',
  };

  @override
  void initState() {
    super.initState();
    _connectToWebSocket();
    _initializeTts();
  }

  void _initializeTts() {
    flutterTts.setLanguage(selectedLanguage);
    flutterTts.setSpeechRate(0.5);
    flutterTts.setPitch(1.0);
  }

  void _connectToWebSocket() {
    channel = IOWebSocketChannel.connect("ws://192.168.137.15:8080");

    channel.stream.listen((message) {
      _detectAndTranslate(message);
    }, onError: (error) {
      print("WebSocket error: $error");
    }, onDone: () {
      print("WebSocket connection closed");
    });
  }

  Future<void> _detectAndTranslate(String message) async {
    String detectedLang = await languageIdentifier.identifyLanguage(message);
    print("Detected Language: $detectedLang");

    var translatedMessage =
        await translator.translate(message, to: selectedLanguage);
    setState(() {
      messages.add("Received: ${translatedMessage.text}");
    });

    _speak(translatedMessage.text);
  }

  void _sendMessage() {
    if (messageController.text.isEmpty) return;

    String message = messageController.text;
    setState(() {
      messages.add("Me: $message");
    });

    channel.sink.add(message);
    messageController.clear();
  }

  void _startListening() async {
    bool available = await speechToText.initialize();
    if (available) {
      setState(() => isListening = true);
      speechToText.listen(onResult: (result) {
        setState(() {
          messageController.text = result.recognizedWords;
        });
      });
    }
  }

  void _stopListening() {
    speechToText.stop();
    setState(() => isListening = false);
  }

  Future<void> _speak(String text) async {
    await flutterTts.setLanguage(selectedLanguage);
    await flutterTts.speak(text);
  }

  @override
  void dispose() {
    channel.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Proximity Voice App"),
        actions: [
          DropdownButton<String>(
            value: selectedLanguage,
            items: languageMap.entries.map((entry) {
              return DropdownMenuItem(
                value: entry.value,
                child: Text(entry.key),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                selectedLanguage = value!;
                _initializeTts(); // Update TTS language
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) {
                return ListTile(title: Text(messages[index]));
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: messageController,
                    decoration: InputDecoration(
                      hintText: "Type a message...",
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.mic,
                      color: isListening ? Colors.red : Colors.black),
                  onPressed: isListening ? _stopListening : _startListening,
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
