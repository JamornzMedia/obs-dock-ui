"""
NDI Audio Bridge - Unified App v1.0
Single app with Sender/Receiver mode selection
"""

import os
import sys
import json
import time
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import re

import numpy as np
import sounddevice as sd
import ctypes
from ctypes import (c_bool, c_int, c_uint, c_int64, c_float, c_char_p, c_void_p,
                    POINTER, Structure, byref)

# ========== CONSTANTS ==========
SAMPLE_RATE = 48000
CHANNELS = 2

# ========== GLOBALS ==========
current_mode = None
sender = None
receiver = None

# ========== NDI FUNCTIONS ==========
def find_ndi_runtime():
    for p in [
        os.environ.get('NDI_RUNTIME_DIR_V6', '') + r'\Processing.NDI.Lib.x64.dll',
        os.environ.get('NDI_RUNTIME_DIR_V5', '') + r'\Processing.NDI.Lib.x64.dll',
        r"C:\Program Files\NDI\NDI 6 Runtime\v6\Processing.NDI.Lib.x64.dll",
        r"C:\Program Files\NDI\NDI 5 Runtime\v5\Processing.NDI.Lib.x64.dll",
    ]:
        if p and os.path.exists(p):
            return p
    return None

# ========== NDI STRUCTURES ==========
class NDIlib_send_create_t(Structure):
    _fields_ = [("p_ndi_name", c_char_p), ("p_groups", c_char_p),
                ("clock_video", c_bool), ("clock_audio", c_bool)]

class NDIlib_audio_frame_interleaved_32f_t(Structure):
    _fields_ = [("sample_rate", c_int), ("no_channels", c_int), ("no_samples", c_int),
                ("timecode", c_int64), ("p_data", POINTER(c_float))]

class NDIlib_source_t(Structure):
    _fields_ = [("p_ndi_name", c_char_p), ("p_url_address", c_char_p)]

class NDIlib_find_create_t(Structure):
    _fields_ = [("show_local_sources", c_bool), ("p_groups", c_char_p), ("p_extra_ips", c_char_p)]

class NDIlib_recv_create_v3_t(Structure):
    _fields_ = [("source_to_connect_to", NDIlib_source_t), ("color_format", c_int),
                ("bandwidth", c_int), ("allow_video_fields", c_bool), ("p_ndi_recv_name", c_char_p)]

class NDIlib_audio_frame_v2_t(Structure):
    _fields_ = [("sample_rate", c_int), ("no_channels", c_int), ("no_samples", c_int),
                ("timecode", c_int64), ("p_data", POINTER(c_float)), ("channel_stride_in_bytes", c_int),
                ("p_metadata", c_char_p), ("timestamp", c_int64)]

class NDIlib_video_frame_v2_t(Structure):
    _fields_ = [("xres", c_int), ("yres", c_int), ("FourCC", c_int),
                ("frame_rate_N", c_int), ("frame_rate_D", c_int), ("picture_aspect_ratio", c_float),
                ("frame_format_type", c_int), ("timecode", c_int64), ("p_data", c_void_p),
                ("line_stride_in_bytes", c_int), ("p_metadata", c_char_p), ("timestamp", c_int64)]

class NDIlib_metadata_frame_t(Structure):
    _fields_ = [("length", c_int), ("timecode", c_int64), ("p_data", c_char_p)]


# ========== SENDER CLASS ==========
class NDISender:
    def __init__(self, lib):
        self.lib = lib
        self.mic_send = None
        self.desktop_send = None
        self.running = False
        self.status = "Stopped"

    def _create_sender(self, name):
        settings = NDIlib_send_create_t()
        settings.p_ndi_name = name.encode('utf-8')
        settings.clock_video = False
        settings.clock_audio = True
        return self.lib.NDIlib_send_create(byref(settings))

    def _send_audio(self, instance, data):
        if not instance or not self.running:
            return
        if len(data.shape) == 1:
            stereo = np.column_stack([data, data])
        else:
            stereo = data[:, :2] if data.shape[1] >= 2 else np.column_stack([data, data])
        interleaved = stereo.flatten().astype(np.float32)
        interleaved = np.ascontiguousarray(interleaved)
        frame = NDIlib_audio_frame_interleaved_32f_t()
        frame.sample_rate = SAMPLE_RATE
        frame.no_channels = CHANNELS
        frame.no_samples = len(interleaved) // CHANNELS
        frame.timecode = int(time.time() * 10000000)
        frame.p_data = interleaved.ctypes.data_as(POINTER(c_float))
        self.lib.NDIlib_util_send_send_audio_interleaved_32f(instance, byref(frame))

    def start(self, mic_device=None, desktop_device=None):
        if self.running:
            return
        self.running = True
        self.status = "Running"

        if mic_device is not None:
            self.mic_send = self._create_sender("Audio-Bridge-Mic")
            print(f"[SENDER] Created: Audio-Bridge-Mic")
            threading.Thread(target=self._capture_mic, args=(mic_device,), daemon=True).start()

        if desktop_device is not None:
            self.desktop_send = self._create_sender("Audio-Bridge-Desktop")
            print(f"[SENDER] Created: Audio-Bridge-Desktop")
            threading.Thread(target=self._capture_desktop, args=(desktop_device,), daemon=True).start()

    def _capture_mic(self, dev):
        try:
            dev_info = sd.query_devices(dev)
            channels = min(CHANNELS, int(dev_info['max_input_channels']))
            print(f"[MIC] Device: {dev_info['name']} ({channels}ch @ {SAMPLE_RATE}Hz)")

            def callback(indata, frames, time_info, status):
                if self.running and self.mic_send:
                    self._send_audio(self.mic_send, indata.copy())

            with sd.InputStream(device=dev, samplerate=SAMPLE_RATE, channels=channels,
                               blocksize=1024, dtype=np.float32, callback=callback):
                print(f"[MIC] Capturing...")
                while self.running:
                    time.sleep(0.5)
        except Exception as e:
            print(f"[MIC] Error: {e}")

    def _capture_desktop(self, dev):
        try:
            import pyaudiowpatch as pyaudio
            p = pyaudio.PyAudio()

            loopback = None
            dev_info = sd.query_devices(dev)
            for i in range(p.get_device_count()):
                info = p.get_device_info_by_index(i)
                if info.get('isLoopbackDevice') and dev_info['name'].lower() in info['name'].lower():
                    loopback = info
                    break
            if not loopback:
                for i in range(p.get_device_count()):
                    info = p.get_device_info_by_index(i)
                    if info.get('isLoopbackDevice'):
                        loopback = info
                        break

            if not loopback:
                print("[DESKTOP] No loopback device")
                return

            channels = min(CHANNELS, int(loopback['maxInputChannels']))
            # Force 48kHz - standard for NDI
            print(f"[DESKTOP] Loopback: {loopback['name']} @ {SAMPLE_RATE}Hz")

            stream = p.open(format=pyaudio.paFloat32, channels=channels, rate=SAMPLE_RATE,
                           input=True, input_device_index=loopback['index'], frames_per_buffer=1024)

            print(f"[DESKTOP] Capturing...")
            while self.running:
                data = stream.read(1024, exception_on_overflow=False)
                audio = np.frombuffer(data, dtype=np.float32).copy().reshape(-1, channels)
                
                # Ensure stereo
                if channels == 1:
                    audio = np.column_stack([audio, audio])

                if self.desktop_send:
                    self._send_audio(self.desktop_send, audio)

            stream.close()
            p.terminate()
        except ImportError:
            print("[DESKTOP] Need: pip install pyaudiowpatch")
        except Exception as e:
            print(f"[DESKTOP] Error: {e}")

    def stop(self):
        self.running = False
        self.status = "Stopped"
        time.sleep(0.2)
        for s in [self.mic_send, self.desktop_send]:
            if s:
                self.lib.NDIlib_send_destroy(s)
        self.mic_send = self.desktop_send = None


# ========== RECEIVER CLASS ==========
class NDIReceiver:
    def __init__(self, lib):
        self.lib = lib
        self.find_instance = None
        self.mic_recv = None
        self.desktop_recv = None
        self.running = False
        self.status = "Stopped"
        self.sources = []
        self.mic_stream = None
        self.desktop_stream = None
        self.mic_volume = 1.0
        self.desktop_volume = 1.0

        find_settings = NDIlib_find_create_t()
        find_settings.show_local_sources = True
        self.find_instance = self.lib.NDIlib_find_create_v2(byref(find_settings))

    def find_sources(self):
        self.lib.NDIlib_find_wait_for_sources(self.find_instance, 2000)
        num = c_uint(0)
        ptr = self.lib.NDIlib_find_get_current_sources(self.find_instance, byref(num))
        self.sources = []
        for i in range(num.value):
            name = ptr[i].p_ndi_name.decode('utf-8') if ptr[i].p_ndi_name else ''
            self.sources.append({'id': i, 'name': name, '_struct': ptr[i]})
        return [{'id': s['id'], 'name': s['name']} for s in self.sources]

    def _create_receiver(self, source_struct):
        settings = NDIlib_recv_create_v3_t()
        settings.source_to_connect_to = source_struct
        settings.bandwidth = 10
        return self.lib.NDIlib_recv_create_v3(byref(settings))

    def connect(self, mic_source_id=None, mic_output=None, desktop_source_id=None, desktop_output=None):
        self.running = True

        if mic_source_id is not None and mic_output is not None:
            for s in self.sources:
                if s['id'] == mic_source_id:
                    self.mic_recv = self._create_receiver(s['_struct'])
                    self.mic_stream = sd.OutputStream(device=mic_output, samplerate=SAMPLE_RATE,
                                                       channels=CHANNELS, dtype=np.float32)
                    self.mic_stream.start()
                    print(f"[MIC] Receiving: {s['name']} -> Device {mic_output}")
                    threading.Thread(target=self._receive, args=(self.mic_recv, self.mic_stream, "MIC"), daemon=True).start()
                    break

        if desktop_source_id is not None and desktop_output is not None:
            for s in self.sources:
                if s['id'] == desktop_source_id:
                    self.desktop_recv = self._create_receiver(s['_struct'])
                    self.desktop_stream = sd.OutputStream(device=desktop_output, samplerate=SAMPLE_RATE,
                                                           channels=CHANNELS, dtype=np.float32)
                    self.desktop_stream.start()
                    print(f"[DESKTOP] Receiving: {s['name']} -> Device {desktop_output}")
                    threading.Thread(target=self._receive, args=(self.desktop_recv, self.desktop_stream, "DESKTOP"), daemon=True).start()
                    break

        self.status = "Receiving"

    def _receive(self, recv, stream, label):
        count = 0
        while self.running and recv:
            video = NDIlib_video_frame_v2_t()
            audio = NDIlib_audio_frame_v2_t()
            meta = NDIlib_metadata_frame_t()
            ft = self.lib.NDIlib_recv_capture_v2(recv, byref(video), byref(audio), byref(meta), 100)

            if ft == 2 and audio.no_samples > 0 and audio.p_data:
                no_samples = audio.no_samples
                no_channels = audio.no_channels
                stride = audio.channel_stride_in_bytes
                
                # NDI uses planar format: [ch0_sample0, ch0_sample1, ...], [ch1_sample0, ch1_sample1, ...]
                # stride tells us bytes between channel starts
                if stride > 0:
                    samples_per_channel = stride // 4  # 4 bytes per float32
                else:
                    samples_per_channel = no_samples
                
                total = samples_per_channel * no_channels
                ptr = ctypes.cast(audio.p_data, ctypes.POINTER(ctypes.c_float * total))
                raw = np.ctypeslib.as_array(ptr.contents).copy()
                
                # Reshape as planar: (channels, samples_per_channel)
                raw = raw.reshape(no_channels, samples_per_channel)
                # Take only the actual samples
                raw = raw[:, :no_samples]
                # Transpose to interleaved: (samples, channels)
                data = np.ascontiguousarray(raw.T)
                
                if no_channels == 1:
                    data = np.column_stack([data, data])
                elif no_channels > 2:
                    data = data[:, :2]

                try:
                    # Apply volume
                    vol = self.mic_volume if label == "MIC" else self.desktop_volume
                    data = data * vol
                    data = np.clip(data, -1.0, 1.0)  # Prevent clipping
                    stream.write(np.ascontiguousarray(data.astype(np.float32)))
                    count += 1
                    if count % 500 == 0:
                        print(f"[{label}] {count} frames (sr={audio.sample_rate}, ch={no_channels})")
                except Exception as e:
                    if count < 5:
                        print(f"[{label}] Write error: {e}")

                self.lib.NDIlib_recv_free_audio_v2(recv, byref(audio))
            elif ft == 0:
                time.sleep(0.001)

    def stop(self):
        self.running = False
        self.status = "Stopped"
        time.sleep(0.2)
        for s in [self.mic_stream, self.desktop_stream]:
            if s:
                try:
                    s.stop()
                    s.close()
                except:
                    pass
        for r in [self.mic_recv, self.desktop_recv]:
            if r:
                self.lib.NDIlib_recv_destroy(r)
        self.mic_stream = self.desktop_stream = None
        self.mic_recv = self.desktop_recv = None


# ========== DEVICE HELPERS ==========
def get_devices():
    devices = sd.query_devices()
    inputs, outputs = [], []
    seen_input_names, seen_output_names = set(), set()
    
    for i, d in enumerate(devices):
        api = sd.query_hostapis(d['hostapi'])
        if 'WASAPI' not in api['name']:
            continue
        name = d['name'].strip()
        
        # For inputs - avoid duplicates by full name
        if d['max_input_channels'] > 0:
            if name not in seen_input_names:
                seen_input_names.add(name)
                name_lower = name.lower()
                # Detect CABLE Output (virtual mic source for apps like Discord)
                is_cable_output = 'cable output' in name_lower or ('cable' in name_lower and 'output' in name_lower)
                inputs.append({'id': i, 'name': name, 'is_cable_output': is_cable_output})
        
        # For outputs - avoid duplicates by full name
        if d['max_output_channels'] > 0:
            if name not in seen_output_names:
                seen_output_names.add(name)
                # VB-Cable detection - "CABLE Input" is the one for virtual mic
                name_lower = name.lower()
                is_cable_input = 'cable input' in name_lower
                is_vb = is_cable_input or 'vb-audio' in name_lower
                # Mark as suitable for Mic output (virtual mic)
                outputs.append({'id': i, 'name': name, 'is_vb': is_vb, 'is_cable_input': is_cable_input})
    
    return {'inputs': inputs, 'outputs': outputs}


# ========== WEB SERVER ==========
class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=self.directory, **kwargs)

    def do_GET(self):
        global current_mode, sender, receiver

        if self.path == '/':
            self.path = '/index.html'
        elif self.path == '/api/devices':
            self._json(get_devices())
            return
        elif self.path == '/api/sources':
            self._json(receiver.find_sources() if receiver else [])
            return
        elif self.path == '/api/status':
            if current_mode == 'sender':
                self._json({'mode': 'sender', 'running': sender.running if sender else False})
            elif current_mode == 'receiver':
                self._json({'mode': 'receiver', 'running': receiver.running if receiver else False})
            else:
                self._json({'mode': None, 'running': False})
            return
        return super().do_GET()

    def do_POST(self):
        global current_mode, sender, receiver, ndi_lib
        data = self._read_json()

        if self.path == '/api/mode':
            mode = data.get('mode')
            if mode == 'sender':
                current_mode = 'sender'
                if not sender:
                    sender = NDISender(ndi_lib)
                print(f"[MODE] Sender")
            elif mode == 'receiver':
                current_mode = 'receiver'
                if not receiver:
                    receiver = NDIReceiver(ndi_lib)
                print(f"[MODE] Receiver")
            self._json({'success': True, 'mode': current_mode})
            return

        elif self.path == '/api/start':
            if current_mode == 'sender' and sender:
                mic = data.get('mic')
                desktop = data.get('desktop')
                mic = int(mic) if mic not in (None, '') else None
                desktop = int(desktop) if desktop not in (None, '') else None
                sender.start(mic, desktop)
            self._json({'success': True})
            return

        elif self.path == '/api/connect':
            if current_mode == 'receiver' and receiver:
                mic_src = int(data['mic_source']) if data.get('mic_source') not in (None, '') else None
                mic_out = int(data['mic_output']) if data.get('mic_output') not in (None, '') else None
                desk_src = int(data['desktop_source']) if data.get('desktop_source') not in (None, '') else None
                desk_out = int(data['desktop_output']) if data.get('desktop_output') not in (None, '') else None
                receiver.connect(mic_src, mic_out, desk_src, desk_out)
            self._json({'success': True})
            return

        elif self.path == '/api/stop':
            if current_mode == 'sender' and sender:
                sender.stop()
            elif current_mode == 'receiver' and receiver:
                receiver.stop()
            self._json({'success': True})
            return

        elif self.path == '/api/volume':
            if receiver:
                stream = data.get('stream')
                vol = data.get('volume', 100) / 100.0  # Convert percentage to multiplier
                if stream == 'mic':
                    receiver.mic_volume = vol
                    print(f"[VOLUME] Mic: {vol*100:.0f}%")
                elif stream == 'desktop':
                    receiver.desktop_volume = vol
                    print(f"[VOLUME] Desktop: {vol*100:.0f}%")
            self._json({'success': True})
            return

        self.send_response(404)
        self.end_headers()

    def _json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length).decode('utf-8')) if length else {}

    def log_message(self, *args):
        pass


# ========== MAIN ==========
ndi_lib = None

def main():
    global ndi_lib

    print("=" * 50)
    print("  NDI Audio Bridge v1.0")
    print("=" * 50)

    dll = find_ndi_runtime()
    if not dll:
        print("\n[ERROR] NDI Runtime not found!")
        print("Please install: https://ndi.video/tools/")
        input("\nPress Enter to exit...")
        return

    print(f"[NDI] Loading: {dll}")
    ndi_lib = ctypes.CDLL(dll)

    ndi_lib.NDIlib_initialize.restype = c_bool
    ndi_lib.NDIlib_send_create.argtypes = [POINTER(NDIlib_send_create_t)]
    ndi_lib.NDIlib_send_create.restype = c_void_p
    ndi_lib.NDIlib_send_destroy.argtypes = [c_void_p]
    ndi_lib.NDIlib_util_send_send_audio_interleaved_32f.argtypes = [c_void_p, POINTER(NDIlib_audio_frame_interleaved_32f_t)]
    ndi_lib.NDIlib_find_create_v2.argtypes = [POINTER(NDIlib_find_create_t)]
    ndi_lib.NDIlib_find_create_v2.restype = c_void_p
    ndi_lib.NDIlib_find_destroy.argtypes = [c_void_p]
    ndi_lib.NDIlib_find_wait_for_sources.argtypes = [c_void_p, c_uint]
    ndi_lib.NDIlib_find_wait_for_sources.restype = c_bool
    ndi_lib.NDIlib_find_get_current_sources.argtypes = [c_void_p, POINTER(c_uint)]
    ndi_lib.NDIlib_find_get_current_sources.restype = POINTER(NDIlib_source_t)
    ndi_lib.NDIlib_recv_create_v3.argtypes = [POINTER(NDIlib_recv_create_v3_t)]
    ndi_lib.NDIlib_recv_create_v3.restype = c_void_p
    ndi_lib.NDIlib_recv_destroy.argtypes = [c_void_p]
    ndi_lib.NDIlib_recv_capture_v2.argtypes = [c_void_p, POINTER(NDIlib_video_frame_v2_t),
                                                POINTER(NDIlib_audio_frame_v2_t), POINTER(NDIlib_metadata_frame_t), c_uint]
    ndi_lib.NDIlib_recv_capture_v2.restype = c_int
    ndi_lib.NDIlib_recv_free_audio_v2.argtypes = [c_void_p, POINTER(NDIlib_audio_frame_v2_t)]

    if not ndi_lib.NDIlib_initialize():
        print("[ERROR] NDI init failed")
        return

    print("[NDI] Initialized")

    port = 8080
    print(f"\n[SERVER] http://localhost:{port}")
    print("[INFO] Press Ctrl+C to stop\n")

    webbrowser.open(f'http://localhost:{port}')

    server = HTTPServer(('localhost', port), RequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")


if __name__ == "__main__":
    main()
