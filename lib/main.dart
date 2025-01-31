import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_nearby_connections/flutter_nearby_connections.dart';
import 'package:permission_handler/permission_handler.dart';
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
  final NearbyService nearbyService = NearbyService();
  final List<Device> devices = [];
  final List<Device> connectedDevices = [];
  final List<String> messages = [];
  final TextEditingController messageController = TextEditingController();

  stt.SpeechToText speechToText = stt.SpeechToText();
  FlutterTts flutterTts = FlutterTts();
  final languageIdentifier = LanguageIdentifier(confidenceThreshold: 0.5);
  final translator = GoogleTranslator();
  String selectedLanguage = 'en'; // Default: English

  late StreamSubscription deviceSubscription;
  late StreamSubscription dataSubscription;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
    _initializeNearbyService();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.location,
      Permission.bluetooth,
      Permission.bluetoothAdvertise,
      Permission.bluetoothConnect,
      Permission.bluetoothScan,
      Permission.microphone,
    ].request();
  }

  Future<void> _initializeNearbyService() async {
    await nearbyService.init(
      serviceType: 'mpconn',
      deviceName: 'Your Device Name',
      strategy: Strategy.P2P_CLUSTER,
      callback: (isRunning) {
        if (isRunning) {
          nearbyService.startAdvertisingPeer();
          nearbyService.startBrowsingForPeers();
        }
      },
    );

    deviceSubscription =
        nearbyService.stateChangedSubscription(callback: (devicesList) {
      setState(() {
        devices.clear();
        devices.addAll(devicesList);
        connectedDevices.clear();
        connectedDevices.addAll(
            devicesList.where((d) => d.state == SessionState.connected));
      });
    });

    dataSubscription =
        nearbyService.dataReceivedSubscription(callback: (data) async {
      String receivedMessage = data["message"];
      String detectedLanguage = await _detectLanguage(receivedMessage);

      // Translate if needed
      if (detectedLanguage != selectedLanguage) {
        String translatedMessage = (await translator.translate(receivedMessage,
                from: detectedLanguage, to: selectedLanguage))
            .text;
        setState(() {
          messages.add("Translated: $translatedMessage");
        });
        _speak(translatedMessage);
      } else {
        setState(() {
          messages.add("Received: $receivedMessage");
        });
        _speak(receivedMessage);
      }
    });
  }

  Future<String> _detectLanguage(String text) async {
    final language = await languageIdentifier.identifyLanguage(text);
    return language ?? 'en'; // Default to English if detection fails
  }

  void _sendMessage() {
    if (messageController.text.isEmpty || connectedDevices.isEmpty) return;

    String message = messageController.text;
    setState(() {
      messages.add("Me: $message");
    });

    for (var device in connectedDevices) {
      nearbyService.sendMessage(device.deviceId, message);
    }

    messageController.clear();
  }

  void _speak(String text) async {
    await flutterTts.setLanguage(selectedLanguage);
    await flutterTts.speak(text);
  }

  void _startListening() async {
    bool available = await speechToText.initialize();
    if (available) {
      speechToText.listen(
        onResult: (result) {
          setState(() {
            messageController.text = result.recognizedWords;
          });
        },
      );
    }
  }

  @override
  void dispose() {
    deviceSubscription.cancel();
    dataSubscription.cancel();
    nearbyService.stopBrowsingForPeers();
    nearbyService.stopAdvertisingPeer();
    speechToText.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Proximity Voice App")),
      body: Column(
        children: [
          // Device List
          Expanded(
            child: ListView.builder(
              itemCount: devices.length,
              itemBuilder: (context, index) {
                final device = devices[index];
                return ListTile(
                  title: Text(device.deviceName),
                  subtitle: Text(device.state.toString()),
                  trailing: ElevatedButton(
                    onPressed: () {
                      if (device.state == SessionState.connected) {
                        nearbyService.disconnectPeer(deviceID: device.deviceId);
                      } else if (device.state == SessionState.notConnected) {
                        nearbyService.invitePeer(
                          deviceID: device.deviceId,
                          deviceName: device.deviceName,
                        );
                      }
                    },
                    child: Text(
                      device.state == SessionState.connected
                          ? 'Disconnect'
                          : 'Connect',
                    ),
                  ),
                );
              },
            ),
          ),

          // Message Display
          Divider(),
          Expanded(
            child: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) {
                return ListTile(title: Text(messages[index]));
              },
            ),
          ),

          // Language Selection
          DropdownButton<String>(
            value: selectedLanguage,
            onChanged: (String? newValue) {
              setState(() {
                selectedLanguage = newValue!;
              });
            },
            items: ['en', 'es', 'fr', 'de', 'hi', 'zh']
                .map<DropdownMenuItem<String>>((String value) {
              return DropdownMenuItem<String>(
                value: value,
                child: Text(value.toUpperCase()),
              );
            }).toList(),
          ),

          // Input Area
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
                  icon: Icon(Icons.mic),
                  onPressed: _startListening,
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
