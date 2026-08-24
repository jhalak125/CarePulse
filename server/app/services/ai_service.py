import json
import os
import google.generativeai as genai
from app.config import settings
from app.utils.logger import logger

class AIService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
            logger.info("Google Gemini AI Service Initialized.")
        else:
            self.model = None
            logger.info("No GEMINI_API_KEY provided. Intelligent heuristic clinical engine active.")

    def preview_symptoms(self, symptoms: str) -> dict:
        if not symptoms or len(symptoms.strip()) == 0:
            return self._heuristic_symptom_triage("General consultation checkup request.")

        if self.model:
            try:
                prompt = (
                    f"Analyse these symptoms and return: urgency level (Low / Medium / High), "
                    f"chief complaint, and three suggested questions for the doctor. "
                    f"Symptoms: {symptoms}\n\n"
                    f"Return ONLY valid JSON matching this structure:\n"
                    f'{{\n'
                    f'  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",\n'
                    f'  "chiefComplaint": "string",\n'
                    f'  "suggestedQuestions": ["string", "string", "string"],\n'
                    f'  "summary": "string"\n'
                    f'}}\n'
                )
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                data = json.loads(text)
                return {
                    "urgencyLevel": data.get("urgencyLevel", "MEDIUM").upper(),
                    "chiefComplaint": data.get("chiefComplaint", symptoms[:60]),
                    "suggestedQuestions": data.get("suggestedQuestions", [
                        "How long have you experienced these symptoms?",
                        "Does anything aggravate or relieve the discomfort?",
                        "Are you currently taking any prescription medications?"
                    ])[:3],
                    "summary": data.get("summary", f"Pre-visit assessment for: {symptoms[:80]}")
                }
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}). Falling back to heuristic triage.")

        return self._heuristic_symptom_triage(symptoms)

    def preview_notes(self, clinical_notes: str) -> dict:
        if not clinical_notes or len(clinical_notes.strip()) == 0:
            return self._heuristic_notes_summary("Patient visit completed cleanly.")

        if self.model:
            try:
                prompt = (
                    f"Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: {clinical_notes}\n\n"
                    f"Return ONLY valid JSON matching this structure:\n"
                    f'{{\n'
                    f'  "friendlySummary": "string",\n'
                    f'  "medicationSchedule": [\n'
                    f'    {{"medicine": "string", "dosage": "string", "frequency": "string", "instructions": "string"}}\n'
                    f'  ],\n'
                    f'  "followUpSteps": ["string"],\n'
                    f'  "warningsToWatch": ["string"]\n'
                    f'}}\n'
                )
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                data = json.loads(text)
                return {
                    "friendlySummary": data.get("friendlySummary", "Doctor completed consultation and reviewed your clinical progress."),
                    "medicationSchedule": data.get("medicationSchedule", []),
                    "followUpSteps": data.get("followUpSteps", ["Follow prescribed medication timing.", "Schedule follow-up review if symptoms persist."]),
                    "warningsToWatch": data.get("warningsToWatch", ["Seek emergency medical attention if severe pain or high fever develops."])
                }
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}). Falling back to heuristic care plan.")

        return self._heuristic_notes_summary(clinical_notes)

    def _heuristic_symptom_triage(self, symptoms: str) -> dict:
        s_lower = symptoms.lower()
        
        # High Urgency Keywords
        high_keywords = ["chest pain", "shortness of breath", "severe tightness", "fainting", "numbness", "sweating", "radiating"]
        # Medium Urgency Keywords
        medium_keywords = ["fever", "palpitations", "persistent headache", "cough", "dizziness", "vomiting", "sprain", "abdominal"]

        urgency = "LOW"
        if any(k in s_lower for k in high_keywords):
            urgency = "HIGH"
        elif any(k in s_lower for k in medium_keywords):
            urgency = "MEDIUM"

        questions = [
            "How long have you noticed these symptoms starting?",
            "Have you noticed any triggers that aggravate or alleviate the discomfort?",
            "Are you currently taking any daily prescribed medications or supplements?"
        ]

        if "chest" in s_lower:
            questions[0] = "Does the chest heaviness radiate to your neck, shoulder, or left arm?"
            questions[1] = "Did the symptoms begin while resting or during physical exertion?"
        elif "fever" in s_lower:
            questions[0] = "What is the highest temperature recorded with a thermometer today?"
            questions[1] = "Have you experienced associated chills, body aches, or shivering?"

        return {
            "urgencyLevel": urgency,
            "chiefComplaint": symptoms[:70] + ("..." if len(symptoms) > 70 else ""),
            "suggestedQuestions": questions,
            "summary": f"Heuristic clinical triage complete. Evaluated urgency level: {urgency}."
        }

    def _heuristic_notes_summary(self, notes: str) -> dict:
        return {
            "friendlySummary": f"Your physician has documented your visit findings: {notes[:120]}...",
            "medicationSchedule": [
                {
                    "medicine": "Prescribed Medication",
                    "dosage": "As Directed",
                    "frequency": "Once Daily After Meals",
                    "instructions": "Take with water at the same time each day."
                }
            ],
            "followUpSteps": [
                "Strictly follow your daily prescription schedule.",
                "Maintain adequate fluid hydration and adequate rest.",
                "Book a follow-up consultation in 2 weeks or if symptoms change."
            ],
            "warningsToWatch": [
                "Contact the clinic immediately if you experience shortness of breath, high fever, or severe dizziness."
            ]
        }

ai_service = AIService()
