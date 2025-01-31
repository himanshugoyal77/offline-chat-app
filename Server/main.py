import requests

# Your Sarvam API subscription key
API_KEY = 'your_api_subscription_key'

# Endpoint URLs
STT_TRANSLATE_URL = 'https://api.sarvam.ai/speech-to-text-translate'

def translate_speech(audio_file_path, target_language_code):
    # Open the audio file in binary mode
    with open(audio_file_path, 'rb') as audio_file:
        files = {'file': audio_file}
        headers = {'api-subscription-key': API_KEY}
        data = {
            'model': 'saaras:v1',  # Specify the model version
            'with_diarization': 'false'  # Set to 'true' if speaker diarization is needed
        }

        # Send POST request to the Speech-to-Text Translate API
        response = requests.post(STT_TRANSLATE_URL, headers=headers, files=files, data=data)

        if response.status_code == 200:
            result = response.json()
            transcript = result.get('transcript', '')
            detected_language = result.get('language_code', 'unknown')
            print(f"Detected Language: {detected_language}")
            print(f"Transcript: {transcript}")

            # Proceed to translate the transcript if needed
            if detected_language != target_language_code:
                translated_text = translate_text(transcript, detected_language, target_language_code)
                print(f"Translated Text: {translated_text}")
            else:
                print("Source and target languages are the same. No translation needed.")
        else:
            print(f"Error: {response.status_code}")
            print(response.json())

def translate_text(text, source_language_code, target_language_code):
    TRANSLATE_URL = 'https://api.sarvam.ai/translate'
    headers = {'api-subscription-key': API_KEY}
    data = {
        'input': text,
        'source_language_code': source_language_code,
        'target_language_code': target_language_code,
        'mode': 'formal'  # Options: 'formal', 'modern-colloquial', 'classic-colloquial', 'code-mixed'
    }

    response = requests.post(TRANSLATE_URL, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        return result.get('translated_text', '')
    else:
        print(f"Translation Error: {response.status_code}")
        print(response.json())
        return ''

if __name__ == "__main__":
    audio_path = 'path_to_your_audio_file.wav'  # Replace with your audio file path
    target_lang_code = 'hi-IN'  # Replace with your target language code
    translate_speech(audio_path, target_lang_code)
