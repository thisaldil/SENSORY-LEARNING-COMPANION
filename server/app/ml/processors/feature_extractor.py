"""
Feature Extractor
Extract behavioral features from quiz interaction logs for cognitive load prediction
Matches the actual dataset features: answerChanges, currentErrorStreak, idleGapsOverThreshold, 
responseTimeVariability, completionTime, avgResponseTime
"""
from typing import Dict, List, Optional
import numpy as np
from datetime import datetime


class FeatureExtractor:
    """Extract features from behavior logs for cognitive load prediction"""
    
    def extract_features(self, behavior_log: Dict) -> Dict[str, float]:
        """
        Extract features from behavior log for cognitive load prediction
        Matches the actual training dataset features
        
        Args:
            behavior_log: Behavior log dictionary with interaction data
            
        Returns:
            Dictionary of feature names and values matching training dataset
        """
        features = {}
        
        # Get basic metrics
        total_time = behavior_log.get('total_time_seconds', 0)
        total_questions = behavior_log.get('total_questions', 1)
        question_interactions = behavior_log.get('question_interactions', [])
        
        # 1. answerChanges - Total number of answer changes
        features['answerChanges'] = float(behavior_log.get('answer_changes', 0))
        
        # 2. currentErrorStreak - Current streak of incorrect answers
        features['currentErrorStreak'] = self._calculate_error_streak(question_interactions, behavior_log)
        
        # 3. idleGapsOverThreshold - Number of idle periods over threshold
        # Idle gap = time between questions (if > threshold, count it)
        features['idleGapsOverThreshold'] = self._calculate_idle_gaps(question_interactions, threshold=30.0)
        
        # 4. responseTimeVariability - Variability in response times
        features['responseTimeVariability'] = self._calculate_response_time_variability(question_interactions)
        
        # 5. completionTime - Total time to complete quiz
        features['completionTime'] = float(total_time)
        
        # 6. avgResponseTime - Average response time per question
        avg_time = self._calculate_avg_response_time(question_interactions, total_questions)
        if avg_time == 0.0 and total_time > 0 and total_questions > 0:
            # Fallback: calculate from total time
            avg_time = total_time / total_questions
        features['avgResponseTime'] = float(avg_time)
        
        return features
    
    def _calculate_error_streak(self, question_interactions: List[Dict], behavior_log: Dict) -> float:
        """
        Calculate current error streak (consecutive incorrect answers)
        
        Args:
            question_interactions: List of question interactions
            behavior_log: Full behavior log with correct/incorrect info
            
        Returns:
            Current error streak count
        """
        # If we have quiz result, use that to determine errors
        correct_answers = behavior_log.get('correct_answers', 0)
        incorrect_answers = behavior_log.get('incorrect_answers', 0)
        total_answered = correct_answers + incorrect_answers
        
        if total_answered == 0:
            return 0.0
        
        # For now, calculate streak from question interactions
        # In a real scenario, you'd track this during the quiz
        streak = 0
        max_streak = 0
        
        # Check interactions in reverse order to find current streak
        for interaction in reversed(question_interactions):
            # If we had correct/incorrect info, we'd use it here
            # For now, estimate based on answer changes (more changes = likely wrong)
            if interaction.get('attempts', 0) > 1:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        
        return float(max_streak)
    
    def _calculate_idle_gaps(self, question_interactions: List[Dict], threshold: float = 30.0) -> float:
        """
        Calculate number of idle gaps over threshold
        Idle gap = time between answering one question and starting the next
        
        Args:
            question_interactions: List of question interactions
            threshold: Threshold in seconds for idle gap
            
        Returns:
            Number of idle gaps over threshold
        """
        if len(question_interactions) < 2:
            return 0.0
        
        # Sort by time started
        sorted_interactions = sorted(
            [q for q in question_interactions if q.get('time_started')],
            key=lambda x: self._parse_datetime(x.get('time_started', ''))
        )
        
        idle_gaps = 0
        for i in range(1, len(sorted_interactions)):
            prev_answered = self._parse_datetime(sorted_interactions[i-1].get('time_answered', ''))
            curr_started = self._parse_datetime(sorted_interactions[i].get('time_started', ''))
            
            if prev_answered and curr_started:
                gap = (curr_started - prev_answered).total_seconds()
                if gap > threshold:
                    idle_gaps += 1
        
        return float(idle_gaps)
    
    def _calculate_response_time_variability(self, question_interactions: List[Dict]) -> float:
        """
        Calculate variability in response times (coefficient of variation)
        
        Args:
            question_interactions: List of question interactions
            
        Returns:
            Coefficient of variation of response times
        """
        response_times = []
        
        for interaction in question_interactions:
            time_spent = interaction.get('time_spent_seconds')
            if time_spent is not None and time_spent > 0:
                response_times.append(time_spent)
        
        if len(response_times) < 2:
            return 0.0
        
        mean_time = np.mean(response_times)
        if mean_time == 0:
            return 0.0
        
        std_time = np.std(response_times)
        # Coefficient of variation
        return float(std_time / mean_time)
    
    def _calculate_avg_response_time(self, question_interactions: List[Dict], total_questions: int) -> float:
        """
        Calculate average response time per question
        
        Args:
            question_interactions: List of question interactions
            total_questions: Total number of questions
            
        Returns:
            Average response time in seconds
        """
        # If we have question interactions with times, use those
        if question_interactions:
            total_time = 0.0
            count = 0
            
            for interaction in question_interactions:
                time_spent = interaction.get('time_spent_seconds')
                if time_spent is not None and time_spent > 0:
                    total_time += time_spent
                    count += 1
            
            if count > 0:
                return float(total_time / count)
        
        # Fallback: calculate from total time and total questions
        # This handles the case where question_interactions is empty
        if total_questions > 0:
            # Use total_time from behavior_log if available
            return 0.0  # Will be calculated from total_time_seconds / total_questions in extract_features
        
        return 0.0
    
    def _parse_datetime(self, dt_string: Optional[str]) -> Optional[datetime]:
        """Parse datetime string to datetime object"""
        if not dt_string:
            return None
        
        try:
            # Handle ISO format with Z
            if dt_string.endswith('Z'):
                dt_string = dt_string[:-1] + '+00:00'
            return datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None


def extract_features_from_behavior_log(behavior_log: Dict) -> Dict[str, float]:
    """
    Main function to extract features from behavior log
    Matches the actual training dataset features
    
    Args:
        behavior_log: Behavior log dictionary
        
    Returns:
        Dictionary of extracted features matching training dataset
    """
    extractor = FeatureExtractor()
    return extractor.extract_features(behavior_log)
