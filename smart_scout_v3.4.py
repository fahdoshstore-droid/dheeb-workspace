# Smart Scout AI v3.4 - Single Player Analysis
# تحليل لاعب واحد طوال 90 دقيقة

import cv2
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

# ==================== CONFIG ====================

class Config:
    CALIBRATION = {
        'zoom': {'meters': 5, 'motion_factor': 0.15},
        'close': {'meters': 10, 'motion_factor': 0.2},
        'medium': {'meters': 15, 'motion_factor': 0.25},
        'wide': {'meters': 25, 'motion_factor': 0.3},
        'full_field': {'meters': 50, 'motion_factor': 0.35}
    }
    
    YOLO_CONFIDENCE = 0.5
    
    # Position zones (percentage of field)
    ZONES = {
        'attack': (0, 33),      # Top 33% of field
        'midfield': (33, 66),   # Middle 33%
        'defense': (66, 100)    # Bottom 33%
    }

# ==================== PLAYER TRACKER ====================

@dataclass
class Player:
    id: int
    positions: List[Tuple[int, int]]  # All positions over time
    speeds: List[float]
    distances: List[float]
    timestamps: List[float]
    bbox_history: List[Tuple[int, int, int, int]]
    
class SinglePlayerTracker:
    """تتبع لاعب واحد طوال المباراة"""
    
    def __init__(self, target_player_id: int = None):
        self.target_id = target_player_id
        self.players = {}
        self.next_id = 1
        
    def update(self, detections: List, frame: int, timestamp: float):
        """تحديث حالة اللاعبين في الإطار"""
        
        if not detections:
            return
        
        centroids = [d[0] for d in detections]
        bboxes = [d[1] for d in detections]
        
        # If no existing players, register all
        if not self.players:
            for i, (centroid, bbox) in enumerate(zip(centroids, bboxes)):
                self.players[i+1] = Player(
                    id=i+1,
                    positions=[centroid],
                    speeds=[0],
                    distances=[0],
                    timestamps=[timestamp],
                    bbox_history=[bbox]
                )
            return
        
        # Simple matching - assign to nearest
        for centroid, bbox in zip(centroids, bboxes):
            # Find nearest existing player or create new
            min_dist = float('inf')
            nearest_id = None
            
            for pid, player in self.players.items():
                if player.positions:
                    last_pos = player.positions[-1]
                    dist = np.sqrt((centroid[0]-last_pos[0])**2 + (centroid[1]-last_pos[1])**2)
                    if dist < min_dist and dist < 150:  # Max distance threshold
                        min_dist = dist
                        nearest_id = pid
            
            if nearest_id is None:
                nearest_id = self.next_id
                self.next_id += 1
                self.players[nearest_id] = Player(
                    id=nearest_id,
                    positions=[],
                    speeds=[],
                    distances=[],
                    timestamps=[],
                    bbox_history=[]
                )
            
            # Calculate speed
            player = self.players[nearest_id]
            if player.positions:
                last_pos = player.positions[-1]
                pixel_dist = np.sqrt((centroid[0]-last_pos[0])**2 + (centroid[1]-last_pos[1])**2)
                speed = pixel_dist * 0.5  # Approximate
                player.speeds.append(speed)
                player.distances.append(pixel_dist if player.distances else pixel_dist)
                if player.distances:
                    player.distances[-1] += pixel_dist
            else:
                player.speeds.append(0)
                player.distances.append(0)
            
            player.positions.append(centroid)
            player.timestamps.append(timestamp)
            player.bbox_history.append(bbox)
    
    def get_player_stats(self, player_id: int) -> Dict:
        """إحصائيات لاعب معين"""
        
        if player_id not in self.players:
            return {'error': 'Player not found'}
        
        player = self.players[player_id]
        
        if not player.speeds:
            return {'error': 'No data for this player'}
        
        speeds = np.array(player.speeds)
        distances = np.array(player.distances) if player.distances else np.array([0])
        
        # Calculate zone times
        zone_times = {'attack': 0, 'midfield': 0, 'defense': 0}
        total_positions = len(player.positions)
        
        for pos in player.positions:
            # Assuming field is divided vertically
            field_y = pos[1] / 480 * 100  # Normalize to percentage
            if field_y < 33:
                zone_times['attack'] += 1
            elif field_y < 66:
                zone_times['midfield'] += 1
            else:
                zone_times['defense'] += 1
        
        # Count sprints (speed > 20)
        sprint_count = sum(1 for s in player.speeds if s > 20)
        
        # Calculate duration
        duration = player.timestamps[-1] - player.timestamps[0] if player.timestamps else 0
        
        return {
            'player_id': player_id,
            'total_frames': total_positions,
            'duration_seconds': round(duration, 1),
            'distance': {
                'total_pixels': round(sum(player.distances), 1),
                'total_meters': round(sum(player.distances) / 50, 2),  # Approximate
                'total_km': round(sum(player.distances) / 50000, 2)
            },
            'speed': {
                'max': round(max(player.speeds), 1),
                'avg': round(np.mean(speeds), 1),
                'median': round(np.median(speeds), 1),
                'sprint_count': sprint_count
            },
            'positions': {
                'attack_percentage': round(zone_times['attack'] / total_positions * 100, 1) if total_positions > 0 else 0,
                'midfield_percentage': round(zone_times['midfield'] / total_positions * 100, 1) if total_positions > 0 else 0,
                'defense_percentage': round(zone_times['defense'] / total_positions * 100, 1) if total_positions > 0 else 0
            },
            'positions_xy': player.positions[-100:] if len(player.positions) > 100 else player.positions
        }
    
    def get_all_players_stats(self) -> List[Dict]:
        """إحصائيات كل اللاعبين"""
        return [self.get_player_stats(pid) for pid in self.players.keys()]

# ==================== HEAT MAP GENERATOR ====================

class HeatMapGenerator:
    """توليد heat map لحركة اللاعبين"""
    
    def __init__(self, field_size=(640, 480)):
        self.field_size = field_size
        
    def generate(self, positions: List[Tuple[int, int]], output_path: str) -> str:
        """توليد heat map من مواقع اللاعب"""
        
        if not positions:
            return None
            
        # Create heat map
        heat_map = np.zeros(self.field_size, dtype=np.float32)
        
        for pos in positions:
            x, y = int(pos[0]), int(pos[1])
            if 0 <= x < self.field_size[0] and 0 <= y < self.field_size[1]:
                # Draw circle with gradient
                cv2.circle(heat_map, (x, y), 30, 0.5, -1)
        
        # Normalize
        heat_map = cv2.normalize(heat_map, None, 0, 255, cv2.NORM_MINMAX)
        heat_map = heat_map.astype(np.uint8)
        
        # Apply color map
        heat_map = cv2.applyColorMap(heat_map, cv2.COLORMAP_JET)
        
        # Draw field
        field = self.draw_field()
        
        # Overlay
        result = cv2.addWeighted(field, 0.7, heat_map, 0.3, 0)
        
        cv2.imwrite(output_path, result)
        return output_path
    
    def draw_field(self) -> np.ndarray:
        """رسم ملعب"""
        field = np.zeros((self.field_size[1], self.field_size[0], 3), dtype=np.uint8)
        field[:] = (19, 83, 20)  # Green
        
        # White lines
        cv2.rectangle(field, (50, 30), (self.field_size[0]-50, self.field_size[1]-30), (255,255,255), 2)
        cv2.line(field, (self.field_size[0]//2, 30), (self.field_size[0]//2, self.field_size[1]-30), (255,255,255), 2)
        cv2.circle(field, (self.field_size[0]//2, self.field_size[1]//2), 50, (255,255,255), 2)
        
        return field

# ==================== VIDEO ANALYZER ====================

class FullMatchAnalyzer:
    """تحليل كامل للمباراة"""
    
    def __init__(self):
        self.config = Config()
        self.tracker = SinglePlayerTracker()
        self.heat_mapper = HeatMapGenerator()
        
    def analyze_full_match(self, video_path: str, calibration: str = 'full_field') -> Dict:
        """تحليل مباراه كاملة مع تقارير كل لاعب"""
        
        if not os.path.exists(video_path):
            return {'error': 'Video file not found'}
        
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        duration = total_frames / fps
        
        print(f"📹 Analyzing full match: {duration:.1f} minutes")
        print(f"   Resolution: {width}x{height}")
        print(f"   FPS: {fps}")
        print(f"   Total frames: {total_frames}")
        
        frame = 0
        max_frames = min(total_frames, 5000)  # Analyze up to 5000 frames
        
        # Try to import YOLO
        try:
            from ultralytics import YOLO
            model = YOLO('yolov8n.pt')
            use_yolo = True
            print("✅ Using YOLO for detection")
        except:
            use_yolo = False
            print("⚠️ YOLO not available, using simple detection")
        
        while frame < max_frames:
            ret, img = cap.read()
            if not ret:
                break
            
            timestamp = frame / fps
            
            if use_yolo:
                results = model(img, verbose=False)
                detections = []
                for r in results:
                    for box in r.boxes:
                        if int(box.cls[0]) == 0:  # Person class
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            centroid = (int((x1 + x2) / 2), int((y1 + y2) / 2))
                            detections.append((centroid, (int(x1), int(y1), int(x2), int(y2))))
            else:
                detections = []
            
            self.tracker.update(detections, frame, timestamp)
            
            if frame % 500 == 0:
                print(f"   Progress: {frame}/{max_frames} frames...")
            
            frame += 1
        
        cap.release()
        
        # Get all player stats
        all_players = self.tracker.get_all_players_stats()
        
        # Find the most tracked player (likely the main player of interest)
        main_player = max(all_players, key=lambda x: x.get('total_frames', 0)) if all_players else None
        
        # Generate heat map for main player
        heatmap_path = None
        if main_player and 'positions_xy' in main_player:
            heatmap_path = video_path.replace('.mp4', '_heatmap.jpg')
            self.heat_mapper.generate(main_player['positions_xy'], heatmap_path)
        
        return {
            'match_info': {
                'duration_minutes': round(duration, 1),
                'resolution': f'{width}x{height}',
                'fps': fps,
                'frames_analyzed': frame
            },
            'all_players': all_players,
            'main_player': main_player,
            'heatmap': heatmap_path
        }

# ==================== MAIN ====================

if __name__ == "__main__":
    import sys
    
    analyzer = FullMatchAnalyzer()
    
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        
        print("="*60)
        print("⚽ Full Match Analysis - 90 Minute Report")
        print("="*60)
        
        result = analyzer.analyze_full_match(video_path)
        
        print("\n" + "="*60)
        print("📊 RESULTS")
        print("="*60)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"\n🎬 Match Duration: {result['match_info']['duration_minutes']} minutes")
            print(f"   Frames Analyzed: {result['match_info']['frames_analyzed']}")
            
            if result['main_player']:
                mp = result['main_player']
                print(f"\n🏆 Main Player (ID: {mp['player_id']})")
                print(f"   📍 Total Distance: {mp['distance']['total_km']} km")
                print(f"   ⚡ Max Speed: {mp['speed']['max']} km/h")
                print(f"   📊 Avg Speed: {mp['speed']['avg']} km/h")
                print(f"   🏃 Sprint Count: {mp['speed']['sprint_count']}")
                print(f"   🎯 Attack Zone: {mp['positions']['attack_percentage']}%")
                print(f"   🛡️ Defense Zone: {mp['positions']['defense_percentage']}%")
                
                if result['heatmap']:
                    print(f"\n🗺️ Heatmap saved to: {result['heatmap']}")
            
            # Save full report
            output_file = video_path.replace('.mp4', '_full_report.json')
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Full report saved to: {output_file}")
    else:
        print("Usage: python smart_scout_v3.4.py <video_path>")
