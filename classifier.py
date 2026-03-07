#!/usr/bin/env python3
"""
🔴 Self-Healing Classifier - Phase 1 MVP
تصنيف الأخطاء تلقائياً
"""

import re
import json
from datetime import datetime
from typing import Dict, List

class ErrorClassifier:
    """تصنيف الأخطاء حسب الخطورة"""
    
    # 🔴 CRITICAL - Security, Data, Config
    CRITICAL_KEYWORDS = [
        "security", "breach", "hack", "exploit", 
        "data leak", "unauthorized", "permission denied",
        "config corrupted", "authentication fail"
    ]
    
    # 🟡 WARNING - Performance, API, Integration
    WARNING_KEYWORDS = [
        "error", "fail", "timeout", "api", "performance",
        "slow", "503", "502", "connection refused",
        "rate limit", "429", "500", "exception"
    ]
    
    # 🟢 INFO - UI, Cosmetic
    INFO_KEYWORDS = [
        "warn", "info", "debug", "notice",
        "ui", "cosmetic", "typo", "minor"
    ]
    
    @staticmethod
    def classify(error_msg: str) -> Dict:
        """تصنيف الخطأ"""
        error_lower = error_msg.lower()
        
        # فحص CRITICAL أولاً
        for keyword in ErrorClassifier.CRITICAL_KEYWORDS:
            if keyword in error_lower:
                return {
                    "type": "🔴 CRITICAL",
                    "action": "Freeze + تحليل فوري + Fix",
                    "description": f"Found: {keyword}"
                }
        
        # فحص WARNING
        for keyword in ErrorClassifier.WARNING_KEYWORDS:
            if keyword in error_lower:
                return {
                    "type": "🟡 WARNING", 
                    "action": "Log + قاعدة + متابعة",
                    "description": f"Found: {keyword}"
                }
        
        # فحص INFO
        for keyword in ErrorClassifier.INFO_KEYWORDS:
            if keyword in error_lower:
                return {
                    "type": "🟢 INFO",
                    "action": "Log فقط",
                    "description": f"Found: {keyword}"
                }
        
        # Default
        return {
            "type": "🟢 INFO",
            "action": "Log فقط",
            "description": "No match - default to INFO"
        }
    
    @staticmethod
    def log_error(error_msg: str, output_file: str = "/home/ubuntu/.openclaw/workspace/memory/errors.log") -> None:
        """تسجيل الخطأ"""
        result = ErrorClassifier.classify(error_msg)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = f"[{timestamp}] [{result['type']}] {error_msg} → {result['action']}\n"
        
        # إضافة للسجل
        with open(output_file, "a") as f:
            f.write(log_entry)
        
        print(log_entry.strip())


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python classifier.py <error_message>")
        sys.exit(1)
    
    error_msg = " ".join(sys.argv[1:])
    ErrorClassifier.log_error(error_msg)
