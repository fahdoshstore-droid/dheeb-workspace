# Smart Scout AI v3.3 - YOLO + Player Tracking
# إضافة كشف اللاعبين وتتبعهم

import cv2
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict

# ==================== CONFIG ====================

class Config:
    #Calibration settings
    CALIBRATION = {
        'zoom': {'meters': 5, 'motion_factor': 0.15},
        'close': {'meters': 10, 'motion_factor': 0.2},
        'medium': {'meters': 15, 'motion_factor': 0.25},
        'wide': {'meters': 25, 'motion_factor': 0.3},
        'full_field': {'meters': 50, 'motion_factor': 0.35}
    }
    
    # YOLO settings
    YOLO_CONFIDENCE = 0.5
    YOLO_NMS = 0.4
    
    # Player tracking settings
    MAX_DISAPPEAR = 10
    MAX_DISTANCE = 100
    
# ==================== PLAYER TRACKER ====================

@dataclass
class Player:
    id: int
    centroid: Tuple[int, int]
    bbox: Tuple[int, int, int, int]
    speed: float
    distance: float
    appearances: int
    
class PlayerTracker:
    """تتبع اللاعبين عبر الإطارات"""
    
    def __init__(self, max_disappear: int = 10, max_distance: int = 100):
        self.next_id = 1
        self.players = {}  # id -> Player
        self.disappeared = {}  # id -> count
        self.max_disappear = max_disappear
        self.max_distance = max_distance
        
    def register(self, centroid: Tuple[int, int], bbox: Tuple[int, int, int, int]) -> int:
        """تسجيل لاعب جديد"""
        player_id = self.next_id
        self.players[player_id] = Player(
            id=player_id,
            centroid=centroid,
            bbox=bbox,
            speed=0,
            distance=0,
            appearances=1
        )
        self.disappeared[player_id] = 0
        self.next_id += 1
        return player_id
    
    def calculate_distance(self, p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
        """حساب المسافة بين نقطتين"""
        return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
    
    def update(self, detections: List[Tuple[Tuple[int, int], Tuple[int, int, int, int]]]) -> Dict:
        """تحديث حالة اللاعبين"""
        # Empty detection list
        if not detections:
            # Mark all as disappeared
            for pid in list(self.players.keys()):
                self.disappeared[pid] += 1
                if self.disappeared[pid] > self.max_disappear:
                    del self.players[pid]
                    del self.disappeared[pid]
            return self.get_tracked_players()
        
        centroids = [d[0] for d in detections]
        bboxes = [d[1] for d in detections]
        
        # If no existing players, register all
        if not self.players:
            for centroid, bbox in zip(centroids, bboxes):
                self.register(centroid, bbox)
            return self.get_tracked_players()
        
        # Match detections with existing players
        matched = []
        used_dets = set()
        used_players = set()
        
        for pid, player in list(self.players.items()):
            best_dist = float('inf')
            best_det_idx = -1
            
            for idx, centroid in enumerate(centroids):
                if idx in used_dets:
                    continue
                dist = self.calculate_distance(player.centroid, centroid)
                if dist < best_dist and dist < self.max_distance:
                    best_dist = dist
                    best_det_idx = idx
            
            if best_det_idx >= 0:
                # Update player
                old_centroid = player.centroid
                new_centroid = centroids[best_det_idx]
                new_bbox = bboxes[best_det_idx]
                
                # Calculate speed
                pixel_dist = self.calculate_distance(old_centroid, new_centroid)
                player.speed = pixel_dist * 0.5  # Approximate
                player.distance += pixel_dist
                player.centroid = new_centroid
                player.bbox = new_bbox
                player.appearances += 1
                
                self.disappeared[pid] = 0
                matched.append((pid, best_det_idx))
                used_dets.add(best_det_idx)
                used_players.add(pid)
        
        # Register new detections
        for idx, (centroid, bbox) in enumerate(zip(centroids, bboxes)):
            if idx not in used_dets:
                new_id = self.register(centroid, bbox)
                used_players.add(new_id)
        
        # Mark unmatched as disappeared
        for pid in list(self.players.keys()):
            if pid not in used_players:
                self.disappeared[pid] += 1
                if self.disappeared[pid] > self.max_disappear:
                    del self.players[pid]
                    del self.disappeared[pid]
        
        return self.get_tracked_players()
    
    def get_tracked_players(self) -> Dict:
        """الحصول على بيانات اللاعبين المتتبعين"""
        return {
            'count': len(self.players),
            'players': [
                {
                    'id': p.id,
                    'centroid': p.centroid,
                    'bbox': p.bbox,
                    'speed': round(p.speed, 1),
                    'distance': round(p.distance, 1),
                    'appearances': p.appearances
                }
                for p in self.players.values()
            ]
        }

# ==================== YOLO DETECTOR ====================

class YOLODetector:
    """كشف الأجسام باستخدام YOLO"""
    
    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.5):
        self.confidence = confidence
        try:
            # Try YOLOv8
            from ultralytics import YOLO
            self.model = YOLO(model_path)
            self.use_ultralytics = True
            print(f"✅ YOLO loaded: {model_path}")
        except ImportError:
            print("⚠️ Ultralytics not found, using OpenCV DNN")
            self.use_ultralytics = False
    
    def detect(self, frame) -> List[Tuple[Tuple[int, int], Tuple[int, int, int, int], float]]:
        """كشف الأشخاص في الإطار"""
        if self.use_ultralytics:
            results = self.model(frame, verbose=False)
            detections = []
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    # Only detect people (class 0)
                    if int(box.cls[0]) == 0:
                        conf = float(box.conf[0])
                        if conf >= self.confidence:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            centroid = (int((x1 + x2) / 2), int((y1 + y2) / 2))
                            bbox = (int(x1), int(y1), int(x2), int(y2))
                            detections.append((centroid, bbox, conf))
            
            return detections
        else:
            # Fallback to simple detection
            return self._simple_detection(frame)
    
    def _simple_detection(self, frame):
        """كشف بسيط باستخدام OpenCV"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        # Simple motion/people detection (placeholder)
        # In production, use proper YOLO model
        h, w = frame.shape[:2]
        
        # Return center point as detection (for demo)
        detections = []
        # Detect roughly where players might be based on frame analysis
        return detections

# ==================== VIDEO ANALYZER ====================

class VideoAnalyzer:
    """Core video analysis engine with YOLO + Tracking"""
    
    def __init__(self):
        self.config = Config()
        self.tracker = PlayerTracker()
        self.detector = YOLODetector()
        
    def analyze(self, video_path: str, calibration: str = 'medium') -> Dict:
        """تحليل الفيديو كامل مع YOLO والتتبع"""
        
        if not os.path.exists(video_path):
            return {'error': 'Video file not found'}
        
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        cal = self.config.CALIBRATION.get(calibration, self.config.CALIBRATION['medium'])
        ppm = width / cal['meters']
        motion_factor = cal['motion_factor']
        
        # Results storage
        speeds = []
        timestamps = []
        player_tracks = []
        
        prev_gray = None
        frame = 0
        max_frames = min(total_frames, 500)
        
        # Process every 5th frame for YOLO (faster)
        yolo_interval = 5
        
        while frame < max_frames:
            ret, img = cap.read()
            if not ret:
                break
            
            # Motion detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, (640, 480))
            
            if prev_gray is not None:
                diff = cv2.absdiff(prev_gray, gray)
                motion = np.mean(diff)
                
                if motion > 2:
                    time_sec = frame / fps
                    speed_ms = (motion * motion_factor * fps) / ppm
                    speed_kmh = speed_ms * 3.6
                    speeds.append(speed_kmh)
                    timestamps.append(time_sec)
            
            # YOLO detection every N frames
            if frame % yolo_interval == 0:
                detections = self.detector.detect(img)
                if detections:
                    dets = [(d[0], d[1]) for d in detections]
                    track_result = self.tracker.update(dets)
                    if track_result['count'] > 0:
                        player_tracks.append({
                            'frame': frame,
                            'timestamp': frame / fps,
                            'players': track_result['players']
                        })
            
            prev_gray = gray
            frame += 1
        
        cap.release()
        
        # Calculate stats
        if not speeds:
            speeds = [0]
        
        speeds = np.array(speeds)
        
        return {
            'video': {
                'width': width,
                'height': height,
                'fps': fps,
                'duration': total_frames / fps,
                'frames': total_frames
            },
            'calibration': calibration,
            'speeds': {
                'avg': float(np.mean(speeds)),
                'max': float(np.max(speeds)),
                'min': float(np.min(speeds)),
                'std': float(np.std(speeds)),
                'p50': float(np.percentile(speeds, 50)),
                'p75': float(np.percentile(speeds, 75)),
                'p90': float(np.percentile(speeds, 90)),
                'p95': float(np.percentile(speeds, 95))
            },
            'player_tracking': {
                'total_unique_players': len(self.tracker.players),
                'tracking_data': player_tracks[-10:] if player_tracks else []
            },
            'motion': {
                'frames_with_motion': len(speeds),
                'motion_percentage': round(len(speeds) / max_frames * 100, 1)
            }
        }

# ==================== MAIN ====================

if __name__ == "__main__":
    import sys
    
    analyzer = VideoAnalyzer()
    
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        calibration = sys.argv[2] if len(sys.argv) > 2 else 'medium'
        
        print(f"📹 Analyzing: {video_path}")
        print(f"📐 Calibration: {calibration}")
        print("⏳ Processing...")
        
        result = analyzer.analyze(video_path, calibration)
        
        print("\n" + "="*50)
        print("📊 RESULTS")
        print("="*50)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"\n🎬 Video: {result['video']['width']}x{result['video']['height']} @ {result['video']['fps']}fps")
            print(f"⏱️ Duration: {result['video']['duration']:.1f}s")
            
            print(f"\n⚡ Speed Analysis:")
            print(f"   Avg: {result['speeds']['avg']:.1f} km/h")
            print(f"   Max: {result['speeds']['max']:.1f} km/h")
            print(f"   P90: {result['speeds']['p90']:.1f} km/h")
            
            print(f"\n👥 Player Tracking:")
            print(f"   Unique Players: {result['player_tracking']['total_unique_players']}")
            print(f"   Motion Frames: {result['motion']['frames_with_motion']}")
            
            # Save to JSON
            output_file = video_path.replace('.mp4', '_analysis.json')
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Results saved to: {output_file}")
    else:
        print("Usage: python smart_scout_v3.3.py <video_path> [calibration]")
        print("Calibration options: zoom, close, medium, wide, full_field")
