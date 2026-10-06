Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("test_speech.wav")
$synth.Speak("Today we are studying calculus and limits. The derivative of x squared is 2x.")
$synth.Dispose()
Write-Host "Audio generated successfully: test_speech.wav"
